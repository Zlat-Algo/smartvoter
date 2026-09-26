import {
  useEffect,
  useState,
} from "react";

import HomeScreen from "./components/HomeScreen";
import CreatePoll from "./components/CreatePoll";
import PollScreen from "./components/PollScreen";
import RankedPollScreen from "./components/RankedPollScreen";
import MyPolls from "./components/MyPolls";

import {
  getTelegramUserId,
  getTelegramUserName,
  getStartParam,
  initTelegram,
  sharePoll,
} from "./lib/telegram";

import {
  createPoll,
  getMyPolls,
  getPoll,
  getPollOptions,
  hasUserVoted,
  vote,
  rankedVote,
  getVoteCounts,
  getRankedResults,
  deletePoll,
} from "./lib/polls";

import type {
  Poll,
  PollOption,
  Screen,
  VotingMethod,
  ResultsVisibility,
} from "./types/poll";

export default function App() {
  const [
    screen,
    setScreen,
  ] = useState<Screen>(
    "home"
  );

  const [
    poll,
    setPoll,
  ] = useState<Poll | null>(
    null
  );

  const [
    options,
    setOptions,
  ] = useState<
    PollOption[]
  >([]);

  const [
    myPolls,
    setMyPolls,
  ] = useState<Poll[]>(
    []
  );

  const [
    voted,
    setVoted,
  ] = useState(false);

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    voteCounts,
    setVoteCounts,
  ] = useState<
    Record<string, number>
  >({});

  const [
    rankedScores,
    setRankedScores,
  ] = useState<
    Record<string, number>
  >({});

  const [
    rankedParticipantCount,
    setRankedParticipantCount,
  ] = useState(0);

  const [
    now,
    setNow,
  ] = useState(
    Date.now()
  );

  const telegramName =
    getTelegramUserName();

  const telegramUserId =
    getTelegramUserId();

  useEffect(() => {
    initTelegram();

    const startParam =
      getStartParam();

    if (startParam) {
      openPoll(startParam);
    }
  }, []);

  useEffect(() => {
    const timer =
      window.setInterval(() => {
        setNow(
          Date.now()
        );
      }, 30000);

    return () =>
      window.clearInterval(
        timer
      );
  }, []);

  async function openPoll(
    pollId: string
  ) {
    try {
      setLoading(true);

      const [
        pollData,
        optionData,
      ] =
        await Promise.all([
          getPoll(pollId),
          getPollOptions(
            pollId
          ),
        ]);

      setPoll(pollData);
      setOptions(
        optionData
      );

      const userId =
        getTelegramUserId();

      if (userId) {
        const userVoted =
          await hasUserVoted(
            pollId,
            userId,
            pollData.voting_method
          );

        setVoted(
          userVoted
        );
      } else {
        setVoted(false);
      }

      if (
        pollData.voting_method ===
        "ranked"
      ) {
        const results =
          await getRankedResults(
            pollId,
            optionData.length
          );

        setRankedScores(
          results.scores
        );

        setRankedParticipantCount(
          results.participantCount
        );

        setVoteCounts({});
      } else {
        const counts =
          await getVoteCounts(
            pollId
          );

        setVoteCounts(
          counts
        );

        setRankedScores({});
        setRankedParticipantCount(
          0
        );
      }

      setScreen("poll");
    } catch (error) {
      console.error(
        error
      );

      alert(
        "Не удалось открыть голосование."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(
    title: string,
    optionTexts: string[],
    votingMethod: VotingMethod,
    resultsVisibility: ResultsVisibility,
    endsAt: string | null,
    allowRevoting: boolean
  ) {
    try {
      setLoading(true);

      const pollData =
        await createPoll(
          title,
          optionTexts,
          votingMethod,
          telegramUserId,
          resultsVisibility,
          endsAt,
          allowRevoting
        );

      await openPoll(
        pollData.id
      );
    } catch (error) {
      console.error(
        error
      );

      alert(
        "Не удалось создать голосование."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleVote(
    optionId: string
  ) {
    if (!poll) {
      return;
    }

    if (
      poll.ends_at &&
      new Date(
        poll.ends_at
      ).getTime() <=
        Date.now()
    ) {
      alert(
        "Срок голосования уже истёк."
      );
      return;
    }

    if (!telegramUserId) {
      alert(
        "Не удалось определить пользователя Telegram."
      );
      return;
    }

    try {
      setLoading(true);

      await vote(
        poll.id,
        optionId,
        telegramUserId,
        poll.allow_revoting ??
          true
      );

      setVoted(true);

      const counts =
        await getVoteCounts(
          poll.id
        );

      setVoteCounts(
        counts
      );
    } catch (error) {
      console.error(
        error
      );

      if (
        error instanceof
          Error &&
        error.message ===
          "ALREADY_VOTED"
      ) {
        alert(
          "Вы уже голосовали."
        );
      } else {
        alert(
          "Не удалось сохранить голос."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleRankedVote(
    orderedOptionIds: string[]
  ) {
    if (!poll) {
      return;
    }

    if (
      poll.ends_at &&
      new Date(
        poll.ends_at
      ).getTime() <=
        Date.now()
    ) {
      alert(
        "Срок голосования уже истёк."
      );
      return;
    }

    if (!telegramUserId) {
      alert(
        "Не удалось определить пользователя Telegram."
      );
      return;
    }

    try {
      setLoading(true);

      await rankedVote(
        poll.id,
        orderedOptionIds,
        telegramUserId,
        poll.allow_revoting ??
          true
      );

      setVoted(true);

      const results =
        await getRankedResults(
          poll.id,
          options.length
        );

      setRankedScores(
        results.scores
      );

      setRankedParticipantCount(
        results.participantCount
      );
    } catch (error) {
      console.error(
        error
      );

      if (
        error instanceof
          Error &&
        error.message ===
          "ALREADY_VOTED"
      ) {
        alert(
          "Вы уже голосовали."
        );
      } else {
        alert(
          "Не удалось сохранить голос."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  async function loadMyPolls() {
    if (!telegramUserId) {
      alert(
        "Не удалось определить пользователя Telegram."
      );
      return;
    }

    try {
      setLoading(true);

      const polls =
        await getMyPolls(
          telegramUserId
        );

      setMyPolls(
        polls
      );

      setScreen(
        "myPolls"
      );
    } catch (error) {
      console.error(
        error
      );

      alert(
        "Не удалось загрузить голосования."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleDeletePoll(
    pollId: string
  ) {
    if (!telegramUserId) {
      return;
    }

    try {
      setLoading(true);

      await deletePoll(
        pollId,
        telegramUserId
      );

      setMyPolls(
        (current) =>
          current.filter(
            (item) =>
              item.id !==
              pollId
          )
      );
    } catch (error) {
      console.error(
        error
      );

      alert(
        "Не удалось удалить голосование."
      );
    } finally {
      setLoading(false);
    }
  }

  function handleShare() {
    if (!poll) {
      return;
    }

    sharePoll(
      poll.id,
      poll.title
    );
  }

  if (
    screen === "home"
  ) {
    return (
      <HomeScreen
        telegramName={
          telegramName
        }
        loading={loading}
        setScreen={
          setScreen
        }
        loadMyPolls={
          loadMyPolls
        }
      />
    );
  }

  if (
    screen === "create"
  ) {
    return (
      <CreatePoll
        loading={loading}
        setScreen={
          setScreen
        }
        onCreate={
          handleCreate
        }
      />
    );
  }

  if (
    screen === "myPolls"
  ) {
    return (
      <MyPolls
        polls={myPolls}
        loading={loading}
        setScreen={
          setScreen
        }
        openPoll={
          openPoll
        }
        onDeletePoll={
          handleDeletePoll
        }
      />
    );
  }

  if (
    screen === "poll" &&
    poll
  ) {
    if (
      poll.voting_method ===
      "ranked"
    ) {
      return (
        <RankedPollScreen
          poll={poll}
          options={options}
          voted={voted}
          loading={loading}
          now={now}
          rankedScores={
            rankedScores
          }
          rankedParticipantCount={
            rankedParticipantCount
          }
          setScreen={
            setScreen
          }
          onVote={
            handleRankedVote
          }
          onShare={
            handleShare
          }
        />
      );
    }

    return (
      <PollScreen
        poll={poll}
        options={options}
        voted={voted}
        loading={loading}
        now={now}
        voteCounts={
          voteCounts
        }
        setScreen={
          setScreen
        }
        onVote={
          handleVote
        }
        onShare={
          handleShare
        }
      />
    );
  }

  return null;
}
