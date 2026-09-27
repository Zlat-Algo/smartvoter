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

  const [rankedScores, setRankedScores] =
    useState<Record<string, number>>(
      {}
    );

  const [
    rankedParticipantCount,
    setRankedParticipantCount,
  ] = useState(0);

  const [now, setNow] =
    useState(Date.now());

  const [
    authenticatedUserId,
    setAuthenticatedUserId,
  ] = useState<number | null>(null);

  const telegramName =
    getTelegramUserName();

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
      setOptions(
        loadedOptions
      );

      const userId =
        userIdOverride ??
        authenticatedUserId;

      if (userId !== null) {
        setVoted(
          await hasUserVoted(
            pollId,
            userId,
            loadedPoll.voting_method
          )
        );
      } else {
        setVoted(false);
      }

      setVoteCounts({});
      setRankedScores({});
      setRankedParticipantCount(
        0
      );

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
      } else {
        setVoteCounts(
          await getVoteCounts(
            pollId
          )
        );
      }

      setScreen("poll");
    } catch (error) {
      console.error(
        "Failed to open poll:",
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
    description: string,
    optionTexts: string[],
    votingMethod: VotingMethod,
    resultsVisibility: ResultsVisibility,
    endsAt: string | null,
    allowRevoting: boolean,
    maxChoices: number,
    shuffleOptions: boolean,
    showParticipantCount: boolean
  ) {
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
          showParticipantCount
        );

      await openPoll(
        newPoll.id,
        authenticatedUserId ??
          undefined
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
    if (!poll) {
      return;
    }

    setLoading(true);

    try {
      await vote(
        poll.id,
        optionIds
      );

      setVoted(true);

      setVoteCounts(
        await getVoteCounts(
          poll.id
        )
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
          "Вы уже голосовали в этом голосовании."
        );
      } else if (
        error instanceof Error &&
        error.message ===
          "TOO_MANY_CHOICES"
      ) {
        alert(
          `Можно выбрать максимум ${poll.max_choices} вариантов.`
        );
      } else if (
        error instanceof Error &&
        error.message ===
          "POLL_EXPIRED"
      ) {
        alert(
          "Это голосование уже завершено."
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
    if (!poll) {
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
          "Вы уже голосовали в этом голосовании."
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
    setLoading(true);

    try {
      setMyPolls(
        await getMyPolls()
      );

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
    const confirmed =
      window.confirm(
        "Удалить это голосование?"
      );

    if (!confirmed) {
      return;
    }

    setLoading(true);

    try {
      await deletePoll(
        pollId
      );

      setMyPolls(
        await getMyPolls()
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

  function goHome() {
    setScreen("home");
    setPoll(null);
    setOptions([]);
    setVoted(false);
    setVoteCounts({});
    setRankedScores({});
    setRankedParticipantCount(
      0
    );
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
          onCreate={
            handleCreate
          }
          onBack={goHome}
        />
      )}

      {screen === "myPolls" && (
        <MyPolls
          polls={myPolls}
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
        poll.voting_method !==
          "ranked" && (
          <PollScreen
            poll={poll}
            options={options}
            voted={voted}
            loading={loading}
            voteCounts={
              voteCounts
            }
            now={now}
            onVote={
              handleVote
            }
            onShare={
              handleShare
            }
            onBack={goHome}
          />
        )}

      {loading && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            display: "flex",
            alignItems:
              "center",
            justifyContent:
              "center",
            pointerEvents:
              "none",
            zIndex: 999,
          }}
        >
          <div
            style={{
              padding:
                "10px 16px",
              borderRadius: 12,
              background:
                "rgba(0,0,0,0.08)",
              backdropFilter:
                "blur(8px)",
              fontSize: 14,
            }}
          >
            Загрузка…
          </div>
        </div>
      )}
    </>
  );
}
