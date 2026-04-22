import Link from "next/link";
import { SignedIn, SignedOut } from "@clerk/nextjs";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-6 py-12">
      <h1 className="text-3xl font-bold">Influencer Platform (V1 Foundation)</h1>
      <p className="text-zinc-600 dark:text-zinc-300">
        YouTube-first influencer analytics and campaign offer requests for agencies.
      </p>
      <div className="flex gap-3">
        <SignedOut>
          <Link className="rounded bg-black px-4 py-2 text-white" href="/sign-in">
            Sign in
          </Link>
          <Link className="rounded border px-4 py-2" href="/sign-up">
            Create account
          </Link>
        </SignedOut>
        <SignedIn>
          <Link className="rounded bg-black px-4 py-2 text-white" href="/dashboard">
            Open dashboard
          </Link>
        </SignedIn>
      </div>
    </main>
  );
}
