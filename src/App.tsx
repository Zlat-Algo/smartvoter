import {
  useEffect,
  useState,
} from "react";

import HomeScreen from "./components/HomeScreen";
import CreatePoll from "./components/CreatePoll";
import PollScreen from "./components/PollScreen";
import RankedPollScreen from "./components/RankedPollScreen";
import ParliamentaryPollScreen from "./components/ParliamentaryPollScreen";
import MyPolls from "./components/MyPolls";

import {
  getTelegramUserId,
  getTelegramUserName,
  getStartParam,
  initTelegram,
  sharePoll,
} from "./lib/telegram";

import {
  authenticateTelegram,
} from "./lib/telegramAuth";

import {
  createPoll,
  getMyPolls,
  getPoll,
  getPollOptions,
  hasUserVoted,
  vote,
  rankedVote,
  parliamentaryVote,
  getVoteCounts,
  getRankedResults,
  getParliamentaryResults,
  deletePoll,
} from "./lib/polls";

import type {
  Poll,
  PollOption,
  Screen,
  VotingMethod,
  ResultsVisibility,
  ParliamentaryResults,
} from "./types/poll";

export default function App() {
  const [screen, setScreen] =
    useState<Screen>("home");

  const [poll, setPoll] =
    useState<Poll | null>(null);

  const [options, setOptions] =
    useState<PollOption[]>([]);

  const [myPolls, setMyPolls] =
    useState<Poll[]>([]);

  const [voted, setVoted] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [voteCounts, setVoteCounts] =
    useState<Record<string, number>>(
      {}
    );

  const [participantCount, setParticipantCount] =
    useState(0);

  const [rankedScores, setRankedScores] =
    useState<Record<string, number>>(
      {}
    );

  const [rankedParticipantCount, setRankedParticipantCount] =
    useState(0);

  const [
    parliamentaryResults,
    setParliamentaryResults,
  ] =
    useState<ParliamentaryResults | null>(
      null
    );

  const [now, setNow] =
    useState(Date.now());

  const [
    authenticatedUserId,
    setAuthenticatedUserId,
  ] =
    useState<number | null>(null);

  const telegramName =
    getTelegramUserName();

  const telegramUserId =
    authenticatedUserId ??
    getTelegramUserId();

  useEffect(() => {
    async function startApp() {
      initTelegram();

      try {
        const user =
          await authenticateTelegram();

        setAuthenticatedUserId(
          user.id
        );

        const startParam =
          getStartParam();

        if (startParam) {
          await openPoll(
            startParam,
            user.id
          );
        }
      } catch (error) {
        console.error(
          "Telegram authentication failed:",
          error
        );

        alert(
          "Не удалось подтвердить Telegram-пользователя. Откройте SmartVoter внутри Telegram."
        );
      }
    }

    startApp();
  }, []);

  useEffect(() => {
    const timer =
      window.setInterval(() => {
        setNow(Date.now());
      }, 30000);

    return () =>
      window.clearInterval(timer);
  }, []);

  async function openPoll(
    pollId: string,
    userIdOverride?: number
  ) {
    setLoading(true);

    try {
      const loadedPoll =
        await getPoll(pollId);

      const loadedOptions =
        await getPollOptions(
          pollId
        );

      setPoll(loadedPoll);
      setOptions(loadedOptions);

      const userId =
        userIdOverride ??
        authenticatedUserId ??
        getTelegramUserId();

      if (userId !== null) {
        const userVoted =
          await hasUserVoted(
            pollId,
            userId,
            loadedPoll.voting_method
          );

        setVoted(userVoted);
      } else {
        setVoted(false);
      }

      if (
        loadedPoll.voting_method ===
        "ranked"
      ) {
        const results =
          await getRankedResults(
            pollId,
            loadedOptions.length
          );

        setRankedScores(
          results.scores
        );

        setRankedParticipantCount(
          results.participantCount
        );

        setParliamentaryResults(
          null
        );
      } else if (
        loadedPoll.voting_method ===
        "parliamentary"
      ) {
        const results =
          await getParliamentaryResults(
            pollId
          );

        setParliamentaryResults(
          results
        );

        setVoteCounts({});
        setParticipantCount(0);
        setRankedScores({});
        setRankedParticipantCount(0);
      } else {
        const results =
          await getVoteCounts(
            pollId
          );

        setVoteCounts(
          results.counts
        );

        setParticipantCount(
          results.participantCount
        );

        setRankedScores({});
        setRankedParticipantCount(0);
        setParliamentaryResults(
          null
        );
      }

      setScreen("poll");
    } catch (error) {
      console.error(
        "Failed to open poll:",
        error
      );

      alert(
        "Не удалось открыть голосование. Возможно, оно было удалено."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(
    title: string,
    description: string,
    optionTexts: string[],
    votingMethod: VotingMethod,
    resultsVisibility: ResultsVisibility,
    endsAt: string | null,
    allowRevoting: boolean,
    maxChoices: number,
    shuffleOptions: boolean,
    showParticipantCount: boolean,
    parliamentarySeats: number | null
  ) {
    if (
      authenticatedUserId === null
    ) {
      alert(
        "Пользователь Telegram не подтверждён."
      );
      return;
    }

    setLoading(true);

    try {
      const newPoll =
        await createPoll(
          title,
          description,
          optionTexts,
          votingMethod,
          resultsVisibility,
          endsAt,
          allowRevoting,
          maxChoices,
          shuffleOptions,
          showParticipantCount,
          parliamentarySeats
        );

      await openPoll(
        newPoll.id,
        authenticatedUserId
      );
    } catch (error) {
      console.error(
        "Failed to create poll:",
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
    optionIds: string[]
  ) {
    if (
      !poll ||
      authenticatedUserId === null
    ) {
      return;
    }

    setLoading(true);

    try {
      await vote(
        poll.id,
        optionIds
      );

      setVoted(true);

      const results =
        await getVoteCounts(
          poll.id
        );

      setVoteCounts(
        results.counts
      );

      setParticipantCount(
        results.participantCount
      );
    } catch (error) {
      console.error(
        "Failed to vote:",
        error
      );

      if (
        error instanceof Error &&
        error.message ===
          "ALREADY_VOTED"
      ) {
        alert(
          "Повторное голосование отключено для этого опроса."
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
    rankedOptionIds: string[]
  ) {
    if (
      !poll ||
      authenticatedUserId === null
    ) {
      return;
    }

    setLoading(true);

    try {
      await rankedVote(
        poll.id,
        rankedOptionIds
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
        "Failed to save ranked vote:",
        error
      );

      if (
        error instanceof Error &&
        error.message ===
          "ALREADY_VOTED"
      ) {
        alert(
          "Повторное голосование отключено для этого опроса."
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

  async function handleParliamentaryVote(
    forOptionIds: string[],
    againstOptionIds: string[]
  ) {
    if (
      !poll ||
      authenticatedUserId === null
    ) {
      return;
    }

    setLoading(true);

    try {
      await parliamentaryVote(
        poll.id,
        forOptionIds,
        againstOptionIds
      );

      setVoted(true);

      const results =
        await getParliamentaryResults(
          poll.id
        );

      setParliamentaryResults(
        results
      );
    } catch (error) {
      console.error(
        "Failed to save parliamentary vote:",
        error
      );

      if (
        error instanceof Error &&
        error.message ===
          "ALREADY_VOTED"
      ) {
        alert(
          "Повторное голосование отключено для этого опроса."
        );
      } else if (
        error instanceof Error &&
        error.message ===
          "EMPTY_PARLIAMENTARY_VOTE"
      ) {
        alert(
          "Выберите хотя бы одну партию: «За» или «Против»."
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
    if (
      authenticatedUserId === null
    ) {
      alert(
        "Пользователь Telegram не подтверждён."
      );
      return;
    }

    setLoading(true);

    try {
      const polls =
        await getMyPolls(
          authenticatedUserId
        );

      setMyPolls(polls);
      setScreen("myPolls");
    } catch (error) {
      console.error(
        "Failed to load polls:",
        error
      );

      alert(
        "Не удалось загрузить мои голосования."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleDeletePoll(
    pollId: string
  ) {
    if (
      authenticatedUserId === null
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        "Удалить это голосование?\n\nВсе голоса и результаты тоже будут удалены."
      );

    if (!confirmed) {
      return;
    }

    setLoading(true);

    try {
      await deletePoll(
        pollId
      );

      setMyPolls((current) =>
        current.filter(
          (item) =>
            item.id !== pollId
        )
      );
    } catch (error) {
      console.error(
        "Failed to delete poll:",
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

  function goHome() {
    setScreen("home");
    setPoll(null);
    setOptions([]);
    setVoted(false);
    setVoteCounts({});
    setParticipantCount(0);
    setRankedScores({});
    setRankedParticipantCount(0);
    setParliamentaryResults(
      null
    );
  }

  return (
    <>
      {screen === "home" && (
        <HomeScreen
          telegramName={
            telegramName
          }
          loading={loading}
          onCreate={() =>
            setScreen("create")
          }
          onMyPolls={
            loadMyPolls
          }
        />
      )}

      {screen === "create" && (
        <CreatePoll
          loading={loading}
          onCreate={handleCreate}
          onBack={goHome}
        />
      )}

      {screen === "myPolls" && (
        <MyPolls
          polls={myPolls}
          now={now}
          loading={loading}
          onOpen={openPoll}
          onDelete={
            handleDeletePoll
          }
          onBack={goHome}
        />
      )}

      {screen === "poll" &&
        poll &&
        poll.voting_method !==
          "ranked" &&
        poll.voting_method !==
          "parliamentary" && (
          <PollScreen
            poll={poll}
            options={options}
            voted={voted}
            loading={loading}
            voteCounts={
              voteCounts
            }
            participantCount={
              participantCount
            }
            now={now}
            onVote={handleVote}
            onShare={
              handleShare
            }
            onBack={goHome}
          />
        )}

      {screen === "poll" &&
        poll &&
        poll.voting_method ===
          "ranked" && (
          <RankedPollScreen
            poll={poll}
            options={options}
            voted={voted}
            loading={loading}
            rankedScores={
              rankedScores
            }
            participantCount={
              rankedParticipantCount
            }
            now={now}
            onVote={
              handleRankedVote
            }
            onShare={
              handleShare
            }
            onBack={goHome}
          />
        )}

      {screen === "poll" &&
        poll &&
        poll.voting_method ===
          "parliamentary" && (
          <ParliamentaryPollScreen
            poll={poll}
            options={options}
            voted={voted}
            loading={loading}
            results={
              parliamentaryResults
            }
            now={now}
            onVote={
              handleParliamentaryVote
            }
            onShare={
              handleShare
            }
            onBack={goHome}
          />
        )}

      {loading && (
        <div className="global-loader">
          <div className="loader-card">
            <span className="loader-dot" />
            <span>
              Загрузка…
            </span>
          </div>
        </div>
      )}
    </>
  );
}
