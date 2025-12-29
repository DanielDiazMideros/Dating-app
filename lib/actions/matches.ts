"use server";

import { UserProfile } from "@/app/profile/types";
import { getAuthedSupabase, throwIfError } from "./helpers";

export async function getPotentialMatches(): Promise<UserProfile[]> {
  const { supabase, user } = await getAuthedSupabase();

  const { data: potentialMatches, error: pmError } = await supabase
    .from("users")
    .select("*")
    .neq("id", user.id)
    .limit(15);

  throwIfError(pmError, "failed to fetch potential matches");

  const { data: userPreferencesRow, error: upError } = await supabase
    .from("users")
    .select("preferences")
    .eq("id", user.id)
    .single();

  throwIfError(upError, "failed to fetch user preferences");

  const currentUserPreferences = userPreferencesRow?.preferences || {};
  const genderPreference = currentUserPreferences?.gender_preference || [];

  const filteredMatches =
    potentialMatches
      ?.filter((match) => {
        if (!genderPreference || genderPreference.length === 0) return true;
        return genderPreference.includes(match.gender || "");
      })
      .map((match) => ({
        id: match.id,
        full_name: match.full_name,
        username: match.username,
        email: "",
        gender: match.gender,
        birthdate: match.birthdate,
        bio: match.bio,
        avatar_url: match.avatar_url,
        preferences: match.preferences,
        location_lat: undefined,
        location_lng: undefined,
        last_active: match.last_active,
        is_verified: true,
        is_online: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })) || [];

  return filteredMatches;
}

export async function likeUser(
  toUserId: string
): Promise<
  | { success: true; isMatch: false }
  | { success: true; isMatch: true; matchedUser: UserProfile }
> {
  const { supabase, user } = await getAuthedSupabase();

  const { error: likeError } = await supabase.from("likes").insert({
    from_user_id: user.id,
    to_user_id: toUserId,
  });

  throwIfError(likeError, "Failed to create like");

  const { data: existingLike, error: checkError } = await supabase
    .from("likes")
    .select("*")
    .eq("from_user_id", toUserId)
    .eq("to_user_id", user.id)
    .maybeSingle();

  throwIfError(checkError, "Failed to check for match");

  if (!existingLike) return { success: true, isMatch: false };

  const { data: matchedUser, error: userError } = await supabase
    .from("users")
    .select("*")
    .eq("id", toUserId)
    .maybeSingle();

  throwIfError(userError, "Failed to fetch matched user");

  if (!matchedUser) {
    return { success: true, isMatch: false };
  }

  return {
    success: true,
    isMatch: true,
    matchedUser: matchedUser as UserProfile,
  };
}

export async function getUserMatches(): Promise<UserProfile[]> {
  const { supabase, user } = await getAuthedSupabase();

  const { data: matches, error } = await supabase
    .from("matches")
    .select("*")
    .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
    .eq("is_active", true);

  throwIfError(error, "Failed to fetch matches");

  const safeMatches = matches ?? [];
  if (safeMatches.length === 0) return [];

  const otherUserIds = Array.from(
    new Set(
      safeMatches.map((m) => (m.user1_id === user.id ? m.user2_id : m.user1_id))
    )
  );

  if (otherUserIds.length === 0) return [];

  const { data: users, error: usersError } = await supabase
    .from("users")
    .select("*")
    .in("id", otherUserIds);

  throwIfError(usersError, "Failed to fetch matched users");

  const usersById = new Map(users?.map((u) => [u.id, u]) ?? []);
  const matchByOtherId = new Map<string, (typeof safeMatches)[number]>();
  for (const m of safeMatches) {
    const otherId = m.user1_id === user.id ? m.user2_id : m.user1_id;
    const prev = matchByOtherId.get(otherId);

    if (!prev || String(m.created_at) > String(prev.created_at)) {
      matchByOtherId.set(otherId, m);
    }
  }

  const matchedUsers: UserProfile[] = [];
  for (const [otherId, m] of matchByOtherId.entries()) {
    const otherUser = usersById.get(otherId);
    if (!otherUser) continue;

    matchedUsers.push({
      id: otherUser.id,
      full_name: otherUser.full_name,
      username: otherUser.username,
      email: otherUser.email,
      gender: otherUser.gender,
      birthdate: otherUser.birthdate,
      bio: otherUser.bio,
      avatar_url: otherUser.avatar_url,
      preferences: otherUser.preferences,
      location_lat: undefined,
      location_lng: undefined,
      last_active: new Date().toISOString(),
      is_verified: true,
      is_online: false,
      created_at: m.created_at,
      updated_at: m.updated_at,
    });
  }

  return matchedUsers;
}
