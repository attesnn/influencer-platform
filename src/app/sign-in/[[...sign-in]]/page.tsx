"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

function getSafeRedirectPath(candidate: string | null) {
  if (!candidate) {
    return "/dashboard";
  }
  if (!candidate.startsWith("/") || candidate.startsWith("//")) {
    return "/dashboard";
  }
  return candidate;
}

export default function SignInPage() {
  const supabase = createSupabaseBrowserClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setIsSubmitting(true);
    setError(null);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: identifier,
        password,
      });

      if (signInError) {
        throw signInError;
      }

      const redirectPath = getSafeRedirectPath(searchParams.get("redirect"));
      router.push(redirectPath);
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : null;
      setError(message ?? "Unable to sign in. Check email and password.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 items-center justify-center px-6 py-12">
      <section className="w-full rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <h1 className="text-xl font-semibold">Sign in with email and password</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          This form uses Supabase Auth with direct password sign-in.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block space-y-1">
            <span className="text-sm font-medium">Email</span>
            <input
              type="email"
              required
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none ring-zinc-300 transition focus:ring dark:border-zinc-700 dark:bg-zinc-900"
              placeholder="fake-user@example.com"
            />
          </label>

          <label className="block space-y-1">
            <span className="text-sm font-medium">Password</span>
            <input
              type="password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none ring-zinc-300 transition focus:ring dark:border-zinc-700 dark:bg-zinc-900"
              placeholder="Enter password"
            />
          </label>

          {error ? (
            <p className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {isSubmitting ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-zinc-500 dark:text-zinc-400">
          Need an account?{" "}
          <Link href="/sign-up" className="underline underline-offset-2">
            Sign up
          </Link>
        </p>
      </section>
    </main>
  );
}
