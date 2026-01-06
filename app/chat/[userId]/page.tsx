"use client";
import { UserProfile } from "@/app/profile/types";
import { ChatHeader, Loading, StreamChatInterface } from "@/components";
import { useAuthStore } from "@/contexts/auth-context";
import { getUserMatches } from "@/lib/actions/matches";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export default function ChatConversationPage() {
  const params = useParams();
  const [otherUser, setOtherUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const userId = params.userId;
  const { user } = useAuthStore();
  const router = useRouter();
  const chatInterfaceRef = useRef<{ handleVideoCall: () => void } | null>(null);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const userMatches = await getUserMatches();
        const matchedUser = userMatches.find((match) => match.id === userId);
        if (matchedUser) {
          setOtherUser(matchedUser);
        } else {
          router.push("/chat");
        }
      } catch (error) {
        console.error(error);
        router.push("/chat");
      } finally {
        setLoading(false);
      }
    };
    if (user) {
      loadUserData();
    }
    loadUserData();
  }, [userId, router, user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-pink-50 to-red-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <Loading complementaryText="your chat..." />
      </div>
    );
  }

  if (!otherUser) {
    return (
      <div className="min-h-screen bg-linear-to-br from-pink-50 to-red-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-24 h-24 bg-linear-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">❌</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            User not found
          </h2>
          <p>The user you&#39;re looking for doesn&#39;t exist.</p>
          <button
            onClick={() => router.push("/chat")}
            className="bg-linear-to-r from-pink-500 to-red-500 text-white font-semibold py-3 px-6 rounded-full hover:from-pink-600 hover:to-red-600 transition-all duration-200"
          >
            Back to Messages
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-linear-to-br from-pink-50 to-red-50 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-4xl mx-auto h-full flex flex-col">
        <ChatHeader
          user={otherUser}
          onVideoCall={() => {
            chatInterfaceRef.current?.handleVideoCall();
          }}
        />
        <div className="flex-1 min-h-0">
          <StreamChatInterface
            otherUser={otherUser}
            ref={chatInterfaceRef}
          />
        </div>
      </div>
    </div>
  );
}
