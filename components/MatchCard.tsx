import { UserProfile } from "@/app/profile/types";
import { calculateAge } from "@/lib/utils";
import Image from "next/image";

export const MatchCard = ({ user }: { user: UserProfile }) => {
  return (
    <div className="relative w-full max-w-sm mx-auto">
      <div className="card-swipe aspect-3/4 overflow-hidden">
        <Image
          src={user?.avatar_url}
          alt={user?.full_name}
          fill
          className={`object-cover transition-opacity duration-300`}
          priority
        />

        <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-1">
                {user?.full_name}, {calculateAge(user?.birthdate)}
              </h2>
              <p className="text-sm opacity-90 mb-2">@{user?.username}</p>
              <p className="text-sm leading-relaxed">{user?.bio}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
