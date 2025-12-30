import { UserProfile } from "@/app/profile/types";
import { createOrGetChannel, getStreamUserToken } from "@/lib/actions/stream";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { set } from "react-hook-form";
import { Channel, Message, StreamChat } from "stream-chat";

export const StreamChatInterface = ({
  otherUser,
}: {
  otherUser: UserProfile;
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [client, setClient] = useState<StreamChat | null>(null);
  const [channel, setChannel] = useState<Channel | null>(null);
  const router = useRouter();

  useEffect(() => {
    const initializeChat = async () => {
      try {
        setError(null);
        const { token, userId, userName, userImage } =
          await getStreamUserToken();
        setCurrentUserId(userId!);
        const chatClient = StreamChat.getInstance(
          process.env.NEXT_PUBLIC_STREAM_API_KEY!
        );
        await chatClient.connectUser(
          {
            id: userId!,
            name: userName,
            image: userImage || undefined,
          },
          token
        );
        const { channelType, channelId } = await createOrGetChannel(
          otherUser.id
        );

        //Load channel
        const chatChannel = chatClient.channel(channelType, channelId);
        await chatChannel.watch();
        //load existing messages
        const state = await chatChannel.query({ messages: { limit: 20 } });
        console.log("Loaded messages:", state.messages);
        //convert messages
        const convertedMessages: Message[] = state.messages.map((msg) => ({
          id: msg.id,
          text: msg.text || "",
          sender: msg.user?.id === userId ? "me" : "other",
          timestamp: new Date(msg.created_at || new Date()),
          user_id: msg.user?.id,
        }));
        setMessages(convertedMessages);

      } catch (err) {
        router.push("/chat");
        setError("Failed to load chat interface.");
      } finally {
        setLoading(false);
      }
    };
    if (otherUser) {
      initializeChat();
    }
  }, [otherUser]);
  return <div>Stream Chat Interface</div>;
};
