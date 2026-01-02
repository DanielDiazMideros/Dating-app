"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Channel, StreamChat } from "stream-chat";

import { createOrGetChannel, getStreamUserToken } from "@/lib/actions/stream";
import { formatTimeChat } from "@/lib/utils";
import { UserProfile } from "@/app/profile/types";

import { Message } from "./types";

export const StreamChatInterface = ({
  otherUser,
}: {
  otherUser: UserProfile;
}) => {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [client, setClient] = useState<StreamChat | null>(null);
  const [channel, setChannel] = useState<Channel | null>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [newMessage, setNewMessage] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    setShowScrollButton(false);
  };

  const handleScroll = () => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;

    setShowScrollButton(!isNearBottom);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

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
            image: userImage,
          },
          token
        );

        const { channelType, channelId } = await createOrGetChannel(
          otherUser.id
        );

        // Load channel
        const chatChannel = chatClient.channel(channelType, channelId);
        await chatChannel.watch();

        // Load existing messages
        const state = await chatChannel.query({ messages: { limit: 20 } });
        console.log("Loaded messages:", state.messages);

        // Convert messages
        const convertedMessages: Message[] = state.messages.map((msg) => ({
          id: msg.id,
          text: msg.text || "",
          sender: msg.user?.id === userId ? "me" : "other",
          timestamp: new Date(msg.created_at || new Date()),
          user_id: msg.user?.id || "",
        }));

        setMessages(convertedMessages);

        chatChannel.on("message.new", (event) => {
          if (!event.message) return;
          if (event.message.user?.id === userId) return;

          const newMsg: Message = {
            id: event.message.id,
            text: event.message.text || "",
            sender: "other",
            timestamp: new Date(event.message.created_at || new Date()),
            user_id: event.message.user?.id || "",
          };

          setMessages((prevMessages) => {
            const messageExists = prevMessages.some(
              (msg) => msg.id === newMsg.id
            );

            return messageExists ? prevMessages : [...prevMessages, newMsg];
          });
        });

        setClient(chatClient);
        setChannel(chatChannel);
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
  }, [otherUser, router]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !channel) return;

    try {
      const response = await channel.sendMessage({ text: newMessage.trim() });

      const messageData: Message = {
        id: response.message.id,
        text: newMessage.trim(),
        sender: "me",
        timestamp: new Date(),
        user_id: currentUserId,
      };

      // (nota) messageData no se usa: si querías optimista, aquí tocaría hacer setMessages(...)
      console.log(messageData);
    } catch (err) {
      console.error("Error sending message:", err);
    } finally {
      setNewMessage("");
    }
  };

  if (!client || !channel) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Setting up chat...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth chat-scrollbar relative"
        style={{ scrollBehavior: "smooth" }}
      >
        {messages.map((msg, key) => (
          <div
            key={key}
            className={`flex ${
              msg.sender === "me" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                msg.sender === "me"
                  ? "bg-gradient-to-r from-pink-500 to-red-500 text-white"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white"
              }`}
            >
              <p className="text-base">{msg.text}</p>

              <p
                className={`text-xs mt-1 ${
                  msg.sender === "me"
                    ? "text-pink-100"
                    : "text-gray-500 dark:text-gray-400"
                }`}
              >
                {formatTimeChat(msg.timestamp)}
              </p>
            </div>
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>

      {showScrollButton && (
        <div className="absolute bottom-20 right-6 z-10">
          <button
            type="button"
            onClick={scrollToBottom}
            className="bg-pink-500 hover:bg-pink-600 text-white p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-110"
            title="Scroll to bottom"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 14l-7 7m0 0l-7-7m7 7V3"
              />
            </svg>
          </button>
        </div>
      )}

      {/* Message input */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-4">
        <form className="flex space-x-2" onSubmit={handleSendMessage}>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);

              if (channel && e.target.value.length > 0) {
                channel.keystroke();
              }
            }}
            onFocus={() => {
              channel?.keystroke();
            }}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-full focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
            disabled={!channel}
          />

          <button
            type="submit"
            disabled={!newMessage.trim() || !channel}
            className="px-6 py-2 bg-gradient-to-r from-pink-500 to-red-500 text-white rounded-full hover:from-pink-600 hover:to-red-600 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 12h14m-7-7l7 7-7 7"
              />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
};
