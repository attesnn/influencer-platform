"use client";

import { useSignIn } from "@clerk/nextjs";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function SignInPage() {
  const { isLoaded, signIn, setActive } = useSignIn();
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isLoaded) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await signIn.create({
        identifier,
        password,
        strategy: "password",
      });

      if (result.status === "complete" && result.createdSessionId) {
        await setActive({ session: result.createdSessionId });
        router.push("/dashboard");
        return;
      }

      setError("Password sign-in is not available for this account.");
    } catch (err) {
      const message =
        err && typeof err === "object" && "errors" in err
          ? (err as { errors?: Array<{ longMessage?: string }> }).errors?.[0]?.longMessage
          : undefined;
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
          This form uses password authentication directly and skips email code prompts.
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
            disabled={!isLoaded || isSubmitting}
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
