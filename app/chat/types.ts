import { UserProfile } from "../profile/types";

export interface chatData {
  id: string;
  user: UserProfile;
  lastMessage: string;
  lastMessageTimestamp: string;
  unreadCount: number;
}
