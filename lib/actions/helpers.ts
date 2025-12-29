import { createClient } from "../supabase/server";
import type { User } from "@supabase/supabase-js";
import type { PostgrestError } from "@supabase/postgrest-js";

export function throwIfError(
  error: PostgrestError | null,
  message: string
): void {
  if (error) throw new Error(message);
}

export async function getAuthedSupabase(): Promise<{
  supabase: Awaited<ReturnType<typeof createClient>>;
  user: User;
}> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error) throw new Error("Failed to get auth user");
  if (!data.user) throw new Error("Not authenticated.");

  return { supabase, user: data.user };
}

export async function getOptionalAuthedSupabase(): Promise<{
  supabase: Awaited<ReturnType<typeof createClient>>;
  user: { id: string } | null;
}> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error) throw new Error("Failed to get auth user");
  return { supabase, user: data.user ?? null };
}
