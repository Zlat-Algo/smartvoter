import { useEffect, useState } from "react";

import HomeScreen from "./components/HomeScreen";
import CreatePoll from "./components/CreatePoll";
import PollScreen from "./components/PollScreen";
import RankedPollScreen from "./components/RankedPollScreen";
import MyPolls from "./components/MyPolls";

import {
  createPoll,
  getMyPolls,
  getPoll,
  getResults,
  hasVoted,
  hasRankedVoted,
  rankedVote,
  getRankedResults,
  vote,
} from "./lib/polls";

import {
  getStartParam,
  getTelegramUserId,
  getTelegramUserName,
  sharePoll,
} from "./lib/telegram";

import type {
  Poll,
  PollOption,
  Screen,
  VotingMethod,
} from "./types/poll";

type RankedResult = {
  option: PollOption;
  score: number;
  firstPlaces: number;
};

export default function App() {
  const [screen, setScreen] =
    useState<Screen>("home");

  const [createdPollId, setCreatedPollId] =
    useState<string | null>(null);

  const [title, setTitle] =
    useState("");

  const [pollOptions, setPollOptions] =
    useState<PollOption[]>([]);

  const [votingMethod, setVotingMethod] =
    useState<VotingMethod>("plurality");

  const [voteCounts, setVoteCounts] =
    useState<Record<string, number>>({});

  const [rankedResults, setRankedResults] =
    useState<RankedResult[]>([]);

  const [totalRankedVoters, setTotalRankedVoters] =
    useState(0);

  const [myPolls, setMyPolls] =
    useState<Poll[]>([]);

  const [loading, setLoading] =
    useState(false);

  const [voted, setVoted] =
    useState(false);

  const telegramUserId =
    getTelegramUserId();

  const telegramName =
    getTelegramUserName();

  const openPollById = async (
    pollId: string
  ) => {
    try {
      setLoading(true);

      const result =
        await getPoll(pollId);

      setCreatedPollId(
        result.poll.id
      );

      setTitle(
        result.poll.title
      );

      setPollOptions(
        result.options
      );

      const method: VotingMethod =
        result.poll
          .voting_method === "ranked"
          ? "ranked"
          : "plurality";

      setVotingMethod(method);

      if (method === "plurality") {
        const results =
          await getResults(pollId);

        setVoteCounts(results);
        setRankedResults([]);
        setTotalRankedVoters(0);

        if (telegramUserId) {
          const alreadyVoted =
            await hasVoted(
              pollId,
              telegramUserId
            );

          setVoted(
            alreadyVoted
          );
        } else {
          setVoted(false);
        }
      } else {
        setVoteCounts({});

        const ranked =
          await getRankedResults(
            pollId,
            result.options
          );

        setRankedResults(
          ranked.results
        );

        setTotalRankedVoters(
          ranked.totalVoters
        );

        if (telegramUserId) {
          const alreadyVoted =
            await hasRankedVoted(
              pollId,
              telegramUserId
            );

          setVoted(
            alreadyVoted
          );
        } else {
          setVoted(false);
        }
      }

      setScreen("poll");
    } catch (error: any) {
      console.error(error);

      alert(
        `Не удалось открыть голосование:\n\n${
          error?.message ||
          JSON.stringify(error)
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const startParam =
      getStartParam();

    if (startParam) {
      openPollById(startParam);
    }
  }, []);

  const handleCreatePoll = async (
    pollTitle: string,
    options: string[],
    method: VotingMethod
  ) => {
    if (!telegramUserId) {
      alert(
        "Не удалось определить Telegram-пользователя"
      );

      return;
    }

    try {
      setLoading(true);

      const result =
        await createPoll(
          pollTitle,
          options,
          telegramUserId,
          method
        );

      setCreatedPollId(
        result.poll.id
      );

      setTitle(
        result.poll.title
      );

      setPollOptions(
        result.options
      );

      setVotingMethod(
        method
      );

      setVoteCounts({});
      setRankedResults([]);
      setTotalRankedVoters(0);
      setVoted(false);

      setScreen("poll");
    } catch (error: any) {
      console.error(error);

      alert(
        `Не удалось создать голосование:\n\n${
          error?.message ||
          JSON.stringify(error)
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMyPolls =
    async () => {
      if (!telegramUserId) {
        alert(
          "Не удалось определить Telegram-пользователя"
        );

        return;
      }

      try {
        setLoading(true);

        const polls =
          await getMyPolls(
            telegramUserId
          );

        setMyPolls(polls);
        setScreen("myPolls");
      } catch (error: any) {
        console.error(error);

        alert(
          `Не удалось загрузить голосования:\n\n${
            error?.message ||
            JSON.stringify(error)
          }`
        );
      } finally {
        setLoading(false);
      }
    };

  const handleOpenPoll = async (
    poll: Poll
  ) => {
    await openPollById(
      poll.id
    );
  };

  const handleVote = async (
    optionId: string
  ) => {
    if (!createdPollId) {
      alert(
        "Не найдено голосование"
      );

      return;
    }

    if (!telegramUserId) {
      alert(
        "Не удалось определить Telegram-пользователя"
      );

      return;
    }

    if (voted) {
      alert(
        "Вы уже голосовали!"
      );

      return;
    }

    try {
      setLoading(true);

      await vote(
        createdPollId,
        optionId,
        telegramUserId
      );

      setVoted(true);

      const results =
        await getResults(
          createdPollId
        );

      setVoteCounts(
        results
      );

      alert(
        `Голос принят, ${telegramName}! 🗳️`
      );
    } catch (error: any) {
      console.error(error);

      if (
        error?.code === "23505"
      ) {
        setVoted(true);

        alert(
          "Вы уже голосовали!"
        );
      } else {
        alert(
          `Не удалось отправить голос:\n\n${
            error?.message ||
            JSON.stringify(error)
          }`
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRankedVote =
    async (
      orderedOptions: PollOption[]
    ) => {
      if (!createdPollId) {
        alert(
          "Не найдено голосование"
        );

        return;
      }

      if (!telegramUserId) {
        alert(
          "Не удалось определить Telegram-пользователя"
        );

        return;
      }

      if (voted) {
        alert(
          "Вы уже голосовали!"
        );

        return;
      }

      try {
        setLoading(true);

        await rankedVote(
          createdPollId,
          orderedOptions,
          telegramUserId
        );

        setVoted(true);

        const ranked =
          await getRankedResults(
            createdPollId,
            pollOptions
          );

        setRankedResults(
          ranked.results
        );

        setTotalRankedVoters(
          ranked.totalVoters
        );

        alert(
          `Ваш порядок принят, ${telegramName}! 🏆`
        );
      } catch (error: any) {
        console.error(error);

        if (
          error?.code === "23505"
        ) {
          setVoted(true);

          const ranked =
            await getRankedResults(
              createdPollId,
              pollOptions
            );

          setRankedResults(
            ranked.results
          );

          setTotalRankedVoters(
            ranked.totalVoters
          );

          alert(
            "Вы уже голосовали!"
          );
        } else {
          alert(
            `Не удалось отправить голос:\n\n${
              error?.message ||
              JSON.stringify(error)
            }`
          );
        }
      } finally {
        setLoading(false);
      }
    };

  const handleShare = () => {
    if (!createdPollId) {
      return;
    }

    sharePoll(
      createdPollId,
      title
    );
  };

  const totalVotes =
    Object.values(
      voteCounts
    ).reduce(
      (sum, count) =>
        sum + count,
      0
    );

  if (screen === "create") {
    return (
      <CreatePoll
        loading={loading}
        setScreen={setScreen}
        onCreate={
          handleCreatePoll
        }
      />
    );
  }

  if (
    screen === "poll" &&
    votingMethod === "ranked"
  ) {
    return (
      <RankedPollScreen
  title={title}
  options={pollOptions}
  voted={voted}
  loading={loading}
  totalVoters={
    totalRankedVoters
  }
  results={
    rankedResults
  }
  setScreen={setScreen}
  onVote={
    handleRankedVote
  }
  onShare={
    handleShare
  }
/>
    );
  }

  if (screen === "poll") {
    return (
      <PollScreen
        title={title}
        pollId={
          createdPollId || ""
        }
        options={pollOptions}
        voteCounts={
          voteCounts
        }
        totalVotes={
          totalVotes
        }
        voted={voted}
        loading={loading}
        setScreen={setScreen}
        onVote={handleVote}
        onShare={handleShare}
      />
    );
  }

  if (screen === "myPolls") {
    return (
      <MyPolls
        polls={myPolls}
        loading={loading}
        setScreen={setScreen}
        openPoll={
          handleOpenPoll
        }
      />
    );
  }

  return (
    <HomeScreen
      telegramName={
        telegramName
      }
      loading={loading}
      setScreen={setScreen}
      loadMyPolls={
        handleLoadMyPolls
      }
    />
  );
}
