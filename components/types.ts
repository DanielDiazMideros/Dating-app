import { UserProfile } from "@/app/profile/types";

export interface MatchButtonsProps {
  onLike: () => void;
  onPass: () => void;
}

export interface MatchNotificationProps {
  match: UserProfile;
  onClose: () => void;
  onStartChat: () => void;
}

export interface ChatHeaderProps {
  user: UserProfile;
  onVideoCall: () => void;
}
export interface Message {
  id: string;
  text: string;
  sender: "me" | "other";
  timestamp: Date;
  user_id: string;
}
