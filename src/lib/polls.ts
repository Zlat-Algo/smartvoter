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
  description: string,
  options: string[],
  votingMethod: VotingMethod,
  resultsVisibility: ResultsVisibility,
  endsAt: string | null,
  allowRevoting: boolean,
  maxChoices: number,
  shuffleOptions: boolean,
  showParticipantCount: boolean
) {
  const data =
    await callTelegramApi(
      "create_poll",
      {
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
      }
    );

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

  return data as PollOption[];
}

export async function getMyPolls() {
  const data =
    await callTelegramApi(
      "get_my_polls"
    );

  return (data.polls ??
    []) as Poll[];
}

export async function hasUserVoted(
  pollId: string,
  telegramUserId: number,
  votingMethod: VotingMethod
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
  optionIds: string[]
) {
  return await callTelegramApi(
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
  return await callTelegramApi(
    "ranked_vote",
    {
      pollId,
      rankedOptionIds,
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

export async function getParticipantCount(
  pollId: string,
  votingMethod: VotingMethod
) {
  if (
    votingMethod ===
    "ranked"
  ) {
    const { data, error } =
      await supabase
        .from("ranked_votes")
        .select(
          "telegram_user_id"
        )
        .eq(
          "poll_id",
          pollId
        );

    if (error) {
      throw error;
    }

    return new Set(
      (data ?? []).map(
        (item) =>
          item.telegram_user_id
      )
    ).size;
  }

  const { data, error } =
    await supabase
      .from("votes")
      .select(
        "telegram_user_id"
      )
      .eq(
        "poll_id",
        pollId
      );

  if (error) {
    throw error;
  }

  return new Set(
    (data ?? []).map(
      (item) =>
        item.telegram_user_id
    )
  ).size;
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
  pollId: string
) {
  return await callTelegramApi(
    "delete_poll",
    {
      pollId,
    }
  );
}
