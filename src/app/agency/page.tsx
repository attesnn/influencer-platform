import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { AgencyActions } from "@/components/AgencyActions";

export default async function AgencyPage() {
  const { userId } = await auth();
  if (!userId) return <main className="p-8">Unauthorized</main>;

  const user = await prisma.user.findUnique({
    where: { clerkUserId: userId },
    include: {
      campaigns: { include: { matches: true, criteria: true }, orderBy: { createdAt: "desc" } },
      offersSent: { orderBy: { createdAt: "desc" }, take: 10 },
    },
  });
  if (!user || user.role !== "agency") return <main className="p-8">Agency role required.</main>;

  const influencers = await prisma.user.findMany({
    where: { role: "influencer" },
    select: { id: true, email: true },
  });

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-8">
      <h1 className="text-2xl font-bold">Agency workspace</h1>
      <AgencyActions influencerIds={influencers.map((item) => item.id)} />
      <section className="rounded border p-4">
        <h2 className="font-semibold">Campaigns and influencer matches</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {user.campaigns.map((campaign) => (
            <li className="rounded bg-zinc-50 p-3 dark:bg-zinc-900" key={campaign.id}>
              <div className="font-medium">
                {campaign.name} ({campaign.id})
              </div>
              <div>Budget: {campaign.budgetRange}</div>
              <div>Matches: {campaign.matches.length}</div>
            </li>
          ))}
          {user.campaigns.length === 0 ? <li>No campaigns yet.</li> : null}
        </ul>
      </section>
      <section className="rounded border p-4">
        <h2 className="font-semibold">Offers sent</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {user.offersSent.map((offer) => (
            <li className="rounded bg-zinc-50 p-3 dark:bg-zinc-900" key={offer.id}>
              {offer.message} - {offer.proposedValue} EUR - {offer.status}
            </li>
          ))}
          {user.offersSent.length === 0 ? <li>No offers sent yet.</li> : null}
        </ul>
      </section>
      <Link className="text-sm underline" href="/dashboard">
        Back to dashboard
      </Link>
    </main>
  );
}
