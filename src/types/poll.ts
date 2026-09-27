export type Screen =
  | "home"
  | "create"
  | "poll"
  | "myPolls";

export type VotingMethod =
  | "plurality"
  | "multiple"
  | "ranked"
  | "yes_no"
  | "rating"
  | "parliamentary";

export type ResultsVisibility =
  | "always"
  | "after_vote"
  | "after_expiration";

export type PollOption = {
  id: string;
  text: string;
  position: number;
};

export type Poll = {
  id: string;

  title: string;
  description: string;

  voting_method: VotingMethod | string;

  creator_telegram_id: number | null;

  created_at: string;

  results_visibility: ResultsVisibility;

  ends_at: string | null;

  allow_revoting: boolean;

  max_choices: number;

  shuffle_options: boolean;

  show_participant_count: boolean;

  participant_count?: number;

  parliamentary_seats: number | null;

  access_mode: "public" | "chat_members";

  allowed_chat_id: number | null;
};

export type ParliamentaryResults = {
  seats: number;
  allocation: string[];
  seatCounts: Record<string, number>;
  participantCount: number;
};
