"use client";

import { create } from "zustand";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

type AuthState = {
  user: User | null;
  loading: boolean;
  startAuthListener: () => () => void;
  signOut: () => Promise<void>;
};

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  loading: true,

  startAuthListener: () => {
    set({ loading: true });

    void supabase.auth
      .getSession()
      .then(({ data: { session }, error }) => {
        if (error) {
          console.error(error);
          set({ user: null, loading: false });
          return;
        }
        set({ user: session?.user ?? null, loading: false });
      })
      .catch((err) => {
        console.error(err);
        set({ user: null, loading: false });
      });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      set({ user: session?.user ?? null, loading: false });
    });

    return () => {
      data.subscription.unsubscribe();
    };
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    set({ user: null });
  },
}));
