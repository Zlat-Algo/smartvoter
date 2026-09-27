import { supabase } from "../supabase";
import { getTelegramInitData } from "./telegram";

import type {
  Poll,
  PollOption,
  ResultsVisibility,
  VotingMethod,
} from "../types/poll";

async function callTelegramApi(
  action: string,
  payload: Record<string, unknown> = {}
) {
  const initData =
    getTelegramInitData();

  if (!initData) {
    throw new Error(
      "TELEGRAM_NOT_AVAILABLE"
    );
  }

  const { data, error } =
    await supabase.functions.invoke(
      "telegram-api",
      {
        body: {
          action,
          initData,
          ...payload,
        },
      }
    );

  if (error) {
    console.error(
      "Telegram API error:",
      error
    );

    throw error;
  }

  if (
    data &&
    data.ok === false
  ) {
    throw new Error(
      data.error ??
        "API_ERROR"
    );
  }

  return data;
}

export async function createPoll(
  title: string,
  options: string[],
  votingMethod: VotingMethod,
  creatorTelegramId: number | null,
  resultsVisibility: ResultsVisibility,
  endsAt: string | null,
  allowRevoting: boolean
) {
  const { data: poll, error: pollError } =
    await supabase
      .from("polls")
      .insert({
        title: title.trim(),
        voting_method: votingMethod,
        creator_telegram_id:
          creatorTelegramId,
        results_visibility:
          resultsVisibility,
        ends_at: endsAt,
        allow_revoting:
          allowRevoting,
      })
      .select()
      .single();

  if (pollError) {
    throw pollError;
  }

  const optionRows =
    options.map(
      (text, index) => ({
        poll_id: poll.id,
        text: text.trim(),
        position: index,
      })
    );

  const { error: optionsError } =
    await supabase
      .from("poll_options")
      .insert(optionRows);

  if (optionsError) {
    await supabase
      .from("polls")
      .delete()
      .eq("id", poll.id);

    throw optionsError;
  }

  return poll as Poll;
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

  return data as PollOption[];
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

  const polls =
    (data as Poll[]) ?? [];

  const pollsWithCounts =
    await Promise.all(
      polls.map(async (poll) => {
        const { count } =
          await supabase
            .from("votes")
            .select(
              "telegram_user_id",
              {
                count: "exact",
                head: true,
              }
            )
            .eq(
              "poll_id",
              poll.id
            );

        const { data: rankedVotes } =
          await supabase
            .from("ranked_votes")
            .select(
              "telegram_user_id"
            )
            .eq(
              "poll_id",
              poll.id
            );

        const rankedParticipants =
          new Set<number>();

        for (
          const vote of
            rankedVotes ?? []
        ) {
          rankedParticipants.add(
            vote.telegram_user_id
          );
        }

        const rankedCount =
          rankedParticipants.size;

        const participantCount =
          Math.max(
            count ?? 0,
            rankedCount
          );

        return {
          ...poll,
          participant_count:
            participantCount,
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
  if (
    votingMethod ===
    "ranked"
  ) {
    const { data, error } =
      await supabase
        .from("ranked_votes")
        .select("id")
        .eq(
          "poll_id",
          pollId
        )
        .eq(
          "telegram_user_id",
          telegramUserId
        )
        .limit(1);

    if (error) {
      throw error;
    }

    return (
      (data?.length ?? 0) > 0
    );
  }

  const { data, error } =
    await supabase
      .from("votes")
      .select("id")
      .eq(
        "poll_id",
        pollId
      )
      .eq(
        "telegram_user_id",
        telegramUserId
      )
      .limit(1);

  if (error) {
    throw error;
  }

  return (
    (data?.length ?? 0) > 0
  );
}

export async function vote(
  pollId: string,
  optionId: string,
  telegramUserId: number,
  allowRevoting: boolean
) {
  return await callTelegramApi(
    "vote",
    {
      pollId,
      optionId,
    }
  );
}

export async function rankedVote(
  pollId: string,
  rankedOptionIds: string[],
  telegramUserId: number,
  allowRevoting: boolean
) {
  const initData =
    getTelegramInitData();

  if (!initData) {
    throw new Error(
      "TELEGRAM_NOT_AVAILABLE"
    );
  }

  const { data, error } =
    await supabase.functions.invoke(
      "telegram-api",
      {
        body: {
          action:
            "ranked_vote",
          initData,
          pollId,
          rankedOptionIds,
        },
      }
    );

  if (error) {
    throw error;
  }

  if (
    data &&
    data.ok === false
  ) {
    throw new Error(
      data.error ??
        "API_ERROR"
    );
  }

  return data;
}

export async function getVoteCounts(
  pollId: string
) {
  const { data, error } =
    await supabase
      .from("votes")
      .select("option_id")
      .eq(
        "poll_id",
        pollId
      );

  if (error) {
    throw error;
  }

  const counts: Record<
    string,
    number
  > = {};

  for (
    const vote of
      data ?? []
  ) {
    counts[vote.option_id] =
      (counts[
        vote.option_id
      ] ?? 0) + 1;
  }

  return counts;
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
      .eq(
        "poll_id",
        pollId
      );

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
    const vote of
      data ?? []
  ) {
    participants.add(
      vote.telegram_user_id
    );

    const score =
      optionCount -
      vote.rank;

    scores[vote.option_id] =
      (scores[
        vote.option_id
      ] ?? 0) + score;
  }

  return {
    scores,
    participantCount:
      participants.size,
  };
}

export async function deletePoll(
  pollId: string,
  telegramUserId: number
) {
  const { error } =
    await supabase
      .from("polls")
      .delete()
      .eq("id", pollId)
      .eq(
        "creator_telegram_id",
        telegramUserId
      );

  if (error) {
    throw error;
  }
}
