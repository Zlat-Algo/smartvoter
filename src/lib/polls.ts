import { supabase } from "../supabase";
import { getTelegramInitData } from "./telegram";

import type {
  Poll,
  PollOption,
  ResultsVisibility,
  VotingMethod,
  ParliamentaryResults,
} from "../types/poll";

async function callTelegramApi(
  action: string,
  payload: Record<string, unknown> = {}
) {
  const initData = getTelegramInitData();

  if (!initData) {
    throw new Error("TELEGRAM_NOT_AVAILABLE");
  }

  const { data, error } =
    await supabase.functions.invoke("telegram-api", {
      body: {
        action,
        initData,
        ...payload,
      },
    });

  if (error) {
    console.error("Telegram API error:", error);
    throw error;
  }

  if (data?.ok === false) {
    throw new Error(data.error ?? "API_ERROR");
  }

  return data;
}

export async function createPoll(
  title: string,
  description: string,
  options: string[],
  votingMethod: VotingMethod,
  resultsVisibility: ResultsVisibility,
  endsAt: string | null,
  allowRevoting: boolean,
  maxChoices: number,
  shuffleOptions: boolean,
  showParticipantCount: boolean,
  parliamentarySeats: number | null
) {
  const data = await callTelegramApi("create_poll", {
    title,
    description,
    options,
    votingMethod,
    resultsVisibility,
    endsAt,
    allowRevoting,
    maxChoices,
    shuffleOptions,
    showParticipantCount,
    parliamentarySeats,
  });

  return data.poll as Poll;
}

export async function getPoll(
  pollId: string
) {
  const { data, error } =
    await supabase
      .from("polls")
      .select("*")
      .eq("id", pollId)
      .single();

  if (error) {
    throw error;
  }

  return data as Poll;
}

export async function getPollOptions(
  pollId: string
) {
  const { data, error } =
    await supabase
      .from("poll_options")
      .select("*")
      .eq("poll_id", pollId)
      .order("position", {
        ascending: true,
      });

  if (error) {
    throw error;
  }

  return (data ?? []) as PollOption[];
}

export async function getMyPolls(
  telegramUserId: number
) {
  const { data, error } =
    await supabase
      .from("polls")
      .select("*")
      .eq(
        "creator_telegram_id",
        telegramUserId
      )
      .order("created_at", {
        ascending: false,
      });

  if (error) {
    throw error;
  }

  const polls = (data ?? []) as Poll[];

  const pollsWithCounts =
    await Promise.all(
      polls.map(async (poll) => {
        const participants =
          new Set<number>();

        const { data: votes } =
          await supabase
            .from("votes")
            .select("telegram_user_id")
            .eq(
              "poll_id",
              poll.id
            );

        for (
          const vote of votes ?? []
        ) {
          participants.add(
            vote.telegram_user_id
          );
        }

        const {
          data: rankedVotes,
        } = await supabase
          .from("ranked_votes")
          .select("telegram_user_id")
          .eq(
            "poll_id",
            poll.id
          );

        for (
          const vote of rankedVotes ?? []
        ) {
          participants.add(
            vote.telegram_user_id
          );
        }

        const {
          data: parliamentaryVotes,
        } = await supabase
          .from(
            "parliamentary_votes"
          )
          .select("telegram_user_id")
          .eq(
            "poll_id",
            poll.id
          );

        for (
          const vote of
            parliamentaryVotes ?? []
        ) {
          participants.add(
            vote.telegram_user_id
          );
        }

        return {
          ...poll,
          participant_count:
            participants.size,
        };
      })
    );

  return pollsWithCounts;
}

export async function hasUserVoted(
  pollId: string,
  telegramUserId: number,
  votingMethod: string
) {
  void telegramUserId;
  void votingMethod;

  const data =
    await callTelegramApi(
      "has_voted",
      {
        pollId,
      }
    );

  return data.voted === true;
}

export async function vote(
  pollId: string,
  optionIds: string[]
) {
  return callTelegramApi(
    "vote",
    {
      pollId,
      optionIds,
    }
  );
}

export async function rankedVote(
  pollId: string,
  rankedOptionIds: string[]
) {
  return callTelegramApi(
    "ranked_vote",
    {
      pollId,
      rankedOptionIds,
    }
  );
}

export async function parliamentaryVote(
  pollId: string,
  forOptionIds: string[],
  againstOptionIds: string[]
) {
  return callTelegramApi(
    "parliamentary_vote",
    {
      pollId,
      forOptionIds,
      againstOptionIds,
    }
  );
}

export async function getVoteCounts(
  pollId: string
) {
  const { data, error } =
    await supabase
      .from("votes")
      .select(
        "option_id, telegram_user_id"
      )
      .eq("poll_id", pollId);

  if (error) {
    throw error;
  }

  const counts: Record<
    string,
    number
  > = {};

  const participants =
    new Set<number>();

  for (
    const vote of data ?? []
  ) {
    counts[vote.option_id] =
      (counts[vote.option_id] ?? 0) +
      1;

    participants.add(
      vote.telegram_user_id
    );
  }

  return {
    counts,
    participantCount:
      participants.size,
  };
}

export async function getRankedResults(
  pollId: string,
  optionCount: number
) {
  const { data, error } =
    await supabase
      .from("ranked_votes")
      .select(
        "option_id, rank, telegram_user_id"
      )
      .eq("poll_id", pollId);

  if (error) {
    throw error;
  }

  const scores: Record<
    string,
    number
  > = {};

  const participants =
    new Set<number>();

  for (
    const vote of data ?? []
  ) {
    participants.add(
      vote.telegram_user_id
    );

    const score =
      optionCount - vote.rank;

    scores[vote.option_id] =
      (scores[vote.option_id] ?? 0) +
      score;
  }

  return {
    scores,
    participantCount:
      participants.size,
  };
}

export async function getParliamentaryResults(
  pollId: string
): Promise<ParliamentaryResults> {
  const data =
    await callTelegramApi(
      "get_parliamentary_results",
      {
        pollId,
      }
    );

  return {
    seats: Number(
      data.seats ?? 0
    ),

    allocation:
      (data.allocation ?? []) as string[],

    seatCounts:
      (data.seatCounts ??
        {}) as Record<string, number>,

    participantCount:
      Number(
        data.participantCount ?? 0
      ),
  };
}

export async function deletePoll(
  pollId: string
) {
  return callTelegramApi(
    "delete_poll",
    {
      pollId,
    }
  );
}
