import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export default async function InfluencerPage() {
  const { userId } = await auth();
  if (!userId) return <main className="p-8">Unauthorized</main>;

  const user = await prisma.user.findUnique({
    where: { clerkUserId: userId },
    include: {
      socialAccounts: true,
      metrics: { orderBy: { snapshotDate: "desc" }, take: 5 },
      offersReceived: { orderBy: { createdAt: "desc" }, take: 10 },
    },
  });
  if (!user || user.role !== "influencer") return <main className="p-8">Influencer role required.</main>;

  const youtubeAccount = user.socialAccounts.find((account) => account.platform === "youtube");

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-6 py-8">
      <h1 className="text-2xl font-bold">Influencer workspace</h1>
      <section className="rounded border p-4">
        <h2 className="font-semibold">YouTube connection</h2>
        {youtubeAccount?.oauthStatus === "connected" ? (
          <p className="mt-2 text-sm text-green-700">Connected ({youtubeAccount.channelId ?? "channel pending"})</p>
        ) : (
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">Not connected yet.</p>
        )}
        <div className="mt-3 flex gap-2">
          <a className="rounded bg-black px-3 py-2 text-white" href="/api/youtube/connect">
            Connect YouTube
          </a>
          <form action="/api/youtube/ingest" method="post">
            <button className="rounded border px-3 py-2" type="submit">
              Refresh metrics
            </button>
          </form>
        </div>
      </section>
      <section className="rounded border p-4">
        <h2 className="font-semibold">Recent metrics snapshots</h2>
        <ul className="mt-2 space-y-2 text-sm">
          {user.metrics.map((metric) => (
            <li className="rounded bg-zinc-50 p-2 dark:bg-zinc-900" key={metric.id}>
              Subs: {metric.subscribers} | Views(30d): {metric.views30d} | Retention proxy:{" "}
              {metric.retentionProxy?.toFixed(2) ?? "N/A"}
            </li>
          ))}
          {user.metrics.length === 0 ? <li>No metrics yet.</li> : null}
        </ul>
      </section>
      <section className="rounded border p-4">
        <h2 className="font-semibold">Incoming offers</h2>
        <ul className="mt-2 space-y-2 text-sm">
          {user.offersReceived.map((offer) => (
            <li className="rounded bg-zinc-50 p-2 dark:bg-zinc-900" key={offer.id}>
              {offer.message} - {offer.proposedValue} EUR - {offer.status}
            </li>
          ))}
          {user.offersReceived.length === 0 ? <li>No offers yet.</li> : null}
        </ul>
      </section>
      <Link className="text-sm underline" href="/dashboard">
        Back to dashboard
      </Link>
    </main>
  );
}
