"use client";

import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type UserProfileChipProps = {
  displayName: string;
};

export default function UserProfileChip({ displayName }: UserProfileChipProps) {
  const supabase = createSupabaseBrowserClient();
  const router = useRouter();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/sign-in");
    router.refresh();
  };

  return (
    <div className="inline-flex items-center gap-3 rounded-full border border-zinc-200 bg-white px-3 py-2 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
      <div className="inline-flex items-center gap-2">
        <span
          aria-hidden="true"
          className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-white"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
            <path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm0 2c-4.4 0-8 2.2-8 5v1h16v-1c0-2.8-3.6-5-8-5Z" />
          </svg>
        </span>
        <div className="text-right">
          <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Logged in as</p>
          <p className="text-sm font-semibold">{displayName}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={handleSignOut}
        className="rounded-full border border-zinc-300 px-3 py-1 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-800"
      >
        Sign out
      </button>
    </div>
  );
}
