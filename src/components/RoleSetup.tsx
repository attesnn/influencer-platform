"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function RoleSetup() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function pickRole(role: "influencer" | "agency") {
    setLoading(true);
    setError(null);
    const response = await fetch("/api/user/role", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    setLoading(false);

    if (!response.ok) {
      setError("Could not save role.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="rounded border p-4">
      <h2 className="text-lg font-semibold">Choose your role</h2>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
        You can start as influencer or agency. This can be changed later by admin.
      </p>
      <div className="mt-4 flex gap-2">
        <button
          className="rounded bg-black px-3 py-2 text-white disabled:opacity-50"
          disabled={loading}
          onClick={() => pickRole("influencer")}
        >
          I am an Influencer
        </button>
        <button
          className="rounded border px-3 py-2 disabled:opacity-50"
          disabled={loading}
          onClick={() => pickRole("agency")}
        >
          I am an Agency
        </button>
      </div>
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
