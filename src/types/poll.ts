export type Screen =
  | "home"
  | "create"
  | "poll"
  | "myPolls";

export type VotingMethod =
  | "plurality"
  | "ranked";

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
  voting_method: string;
  creator_telegram_id: number | null;
  created_at: string;
  results_visibility?: ResultsVisibility;
  ends_at?: string | null;
  allow_revoting?: boolean;
  participant_count?: number;
};
