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
