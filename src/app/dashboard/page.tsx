import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ensureUserInDb } from "@/lib/auth";
import UserProfileChip from "@/components/UserProfileChip";

export default async function DashboardPage() {
  const user = await ensureUserInDb();
  const linkedAccounts = await prisma.socialAccount.findMany({
    where: { userId: user.id },
    select: { id: true, platform: true, oauthStatus: true, channelId: true },
  });
  const connectedPlatforms = new Set(
    linkedAccounts
      .filter((account) => account.oauthStatus === "connected")
      .map((account) => account.platform),
  );
  if (
    connectedPlatforms.has("youtube") &&
    connectedPlatforms.has("instagram") &&
    connectedPlatforms.has("tiktok")
  ) {
    redirect("/influencer");
  }

  const providerCards = [
    {
      title: "Google / YouTube",
      description: "Bring channel performance and audience data into your profile.",
      platform: "youtube",
    },
    {
      title: "Meta",
      description: "Add Instagram/Facebook performance signals for a fuller dataset.",
      platform: "meta",
    },
    {
      title: "TikTok",
      description: "Include short-form growth and engagement context.",
      platform: "tiktok",
    },
  ] as const;

  const connectedCount = connectedPlatforms.size;
  const preferredAccount =
    linkedAccounts.find((account) => account.oauthStatus === "connected" && account.channelId) ??
    linkedAccounts.find((account) => account.oauthStatus === "connected");
  const socialDisplayName =
    preferredAccount?.channelId ??
    (user.email.includes("@") ? `@${user.email.split("@")[0]}` : user.email);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-6 py-10">
      <section className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Influencer onboarding
            </p>
            <h1 className="mt-1 text-3xl font-bold md:text-4xl">Welcome to your creator workspace</h1>
            <p className="mt-2 max-w-3xl text-zinc-600 dark:text-zinc-300">
              You are signed in. Start by connecting your social accounts so we can unify
              your profile data and improve matching quality.
            </p>
          </div>
          <UserProfileChip displayName={socialDisplayName} />
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-900/40">
        <p className="text-sm text-zinc-600 dark:text-zinc-300">
          Connected accounts: <span className="font-semibold">{connectedCount}</span> / 3
        </p>
      </section>

      <section className="grid gap-3">
        {providerCards.map((provider) => {
          const linked = linkedAccounts.find((account) => account.platform === provider.platform);
          const isConnected = linked?.oauthStatus === "connected";

          return (
            <article
              key={provider.platform}
              className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h2 className="text-lg font-semibold">{provider.title}</h2>
                  <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">{provider.description}</p>
                </div>
                <span className="rounded-full border border-zinc-300 px-2 py-1 text-xs text-zinc-600 dark:border-zinc-700 dark:text-zinc-300">
                  {isConnected ? "Connected" : "Not connected"}
                </span>
              </div>
              <button
                type="button"
                disabled
                className="mt-4 rounded-lg border border-dashed border-zinc-300 px-3 py-2 text-sm text-zinc-500 disabled:cursor-not-allowed dark:border-zinc-700 dark:text-zinc-400"
                aria-label={`Connect ${provider.title} (coming soon)`}
              >
                Connect {provider.title} (coming soon)
              </button>
            </article>
          );
        })}
      </section>

      <section className="rounded-2xl border border-zinc-200 p-5 dark:border-zinc-800">
        <h2 className="text-lg font-semibold">Next steps</h2>
        <ol className="mt-3 grid gap-1 text-sm text-zinc-600 dark:text-zinc-300">
          <li>1. Connect at least one social platform.</li>
          <li>2. Refresh data sync once connections are active.</li>
          <li>3. Review your influencer workspace insights.</li>
        </ol>
      </section>

      <div className="flex flex-wrap gap-3">
        <Link className="rounded bg-black px-4 py-2 text-white" href="/influencer">
          Open influencer workspace
        </Link>
        {user.role === "agency" ? (
          <Link className="rounded border px-4 py-2" href="/agency">
            Open agency workspace
          </Link>
        ) : null}
      </div>
    </main>
  );
}
