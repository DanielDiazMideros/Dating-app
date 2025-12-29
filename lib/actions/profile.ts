"use server";

import type { UserProfile } from "@/app/profile/types";
import { throwIfError } from "./helpers";
import { getOptionalAuthedSupabase } from "./helpers";

export async function getCurrentUserProfile() {
  const { supabase, user } = await getOptionalAuthedSupabase();
  if (!user) return null;

  const { data: profile, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  throwIfError(error, "Failed to fetch profile");
  return profile;
}

export async function uploadProfilePhoto(file: File) {
  const { supabase, user } = await getOptionalAuthedSupabase();
  if (!user)
    return { success: false as const, error: "User not authenticated" };

  const fileExt = file.name.split(".").pop() || "jpg";
  const fileName = `${user.id}-${Date.now()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from("profile-photos")
    .upload(fileName, file, { cacheControl: "3600", upsert: true });

  if (uploadError)
    return { success: false as const, error: uploadError.message };

  const { data } = supabase.storage
    .from("profile-photos")
    .getPublicUrl(fileName);
  return { success: true as const, url: data.publicUrl };
}

export async function updateUserProfile(profileData: Partial<UserProfile>) {
  const { supabase, user } = await getOptionalAuthedSupabase();
  if (!user)
    return { success: false as const, error: "User not authenticated" };

  const { error } = await supabase
    .from("users")
    .update({
      full_name: profileData.full_name,
      username: profileData.username,
      bio: profileData.bio,
      gender: profileData.gender,
      birthdate: profileData.birthdate,
      avatar_url: profileData.avatar_url,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) return { success: false as const, error: error.message };
  return { success: true as const };
}
