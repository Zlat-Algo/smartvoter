export type Screen = "home" | "create" | "poll" | "myPolls";

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
};
