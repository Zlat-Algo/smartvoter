import { supabase } from "../supabase";
import type { Poll, PollOption } from "../types/poll";

export async function createPoll(
  title: string,
  options: string[],
  telegramUserId: number
): Promise<{
  poll: Poll;
  options: PollOption[];
}> {
  const { data: poll, error: pollError } = await supabase
    .from("polls")
    .insert({
      title: title.trim(),
      voting_method: "plurality",
      creator_telegram_id: telegramUserId,
    })
    .select()
    .single();

  if (pollError) {
    throw pollError;
  }

  const { data: createdOptions, error: optionsError } =
    await supabase
      .from("poll_options")
      .insert(
        options.map((text, index) => ({
          poll_id: poll.id,
          text: text.trim(),
          position: index,
        }))
      )
      .select();

  if (optionsError) {
    throw optionsError;
  }

  if (!createdOptions) {
    throw new Error("Варианты не создались");
  }

  const sortedOptions = [...createdOptions].sort(
    (a, b) => a.position - b.position
  );

  return {
    poll,
    options: sortedOptions,
  };
}

export async function getPoll(
  pollId: string
): Promise<{
  poll: Poll;
  options: PollOption[];
}> {
  const { data: poll, error: pollError } = await supabase
    .from("polls")
    .select(
      "id, title, voting_method, creator_telegram_id, created_at"
    )
    .eq("id", pollId)
    .single();

  if (pollError) {
    throw pollError;
  }

  const { data: options, error: optionsError } =
    await supabase
      .from("poll_options")
      .select("id, text, position")
      .eq("poll_id", pollId)
      .order("position");

  if (optionsError) {
    throw optionsError;
  }

  return {
    poll,
    options: options || [],
  };
}

export async function getMyPolls(
  telegramUserId: number
): Promise<Poll[]> {
  const { data, error } = await supabase
    .from("polls")
    .select(
      "id, title, voting_method, creator_telegram_id, created_at"
    )
    .eq("creator_telegram_id", telegramUserId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data || [];
}

export async function getResults(pollId: string) {
  const { data, error } = await supabase
    .from("votes")
    .select("option_id")
    .eq("poll_id", pollId);

  if (error) {
    throw error;
  }

  const counts: Record<string, number> = {};

  for (const vote of data || []) {
    counts[vote.option_id] =
      (counts[vote.option_id] || 0) + 1;
  }

  return counts;
}

export async function hasVoted(
  pollId: string,
  telegramUserId: number
): Promise<boolean> {
  const { data, error } = await supabase
    .from("votes")
    .select("id")
    .eq("poll_id", pollId)
    .eq("telegram_user_id", telegramUserId)
    .limit(1);

  if (error) {
    throw error;
  }

  return (data || []).length > 0;
}

export async function vote(
  pollId: string,
  optionId: string,
  telegramUserId: number
) {
  const { error } = await supabase
    .from("votes")
    .insert({
      poll_id: pollId,
      option_id: optionId,
      telegram_user_id: telegramUserId,
    });

  if (error) {
    throw error;
  }
}
