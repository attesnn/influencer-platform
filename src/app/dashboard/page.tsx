import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ensureUserInDb } from "@/lib/auth";
import UserProfileChip from "@/components/UserProfileChip";
import { decryptToken } from "@/lib/crypto";

function hasValidYoutubeToken(tokenRef: string | null | undefined) {
  if (!tokenRef) return false;
  try {
    const parsed = JSON.parse(decryptToken(tokenRef)) as {
      access_token?: string;
      refresh_token?: string;
    };
    return Boolean(parsed.access_token || parsed.refresh_token);
  } catch {
    return false;
  }
}

function hasValidMetaToken(tokenRef: string | null | undefined) {
  if (!tokenRef) return false;
  try {
    const parsed = JSON.parse(decryptToken(tokenRef)) as {
      access_token?: string;
    };
    return Boolean(parsed.access_token);
  } catch {
    return false;
  }
}

function hasValidTiktokToken(tokenRef: string | null | undefined) {
  if (!tokenRef) return false;
  try {
    const parsed = JSON.parse(decryptToken(tokenRef)) as {
      access_token?: string;
      open_id?: string;
    };
    return Boolean(parsed.access_token && parsed.open_id);
  } catch {
    return false;
  }
}

export default async function DashboardPage() {
  const user = await ensureUserInDb();
  const linkedAccounts = await prisma.socialAccount.findMany({
    where: { userId: user.id },
    select: { id: true, platform: true, oauthStatus: true, channelId: true, tokenRef: true },
  });
  

  const providerCards = [
    {
      title: "Google / YouTube",
      description: "Bring channel performance and audience data into your profile.",
      platform: "youtube",
    },
    {
      title: "Meta",
      description: "Add Instagram/Facebook performance signals for a fuller dataset.",
      platform: "instagram",
    },
    {
      title: "TikTok",
      description: "Include short-form growth and engagement context.",
      platform: "tiktok",
    },
  ] as const;

  const isPlatformConnected = (platform: (typeof providerCards)[number]["platform"]) => {
    if (platform === "youtube") {
      const youtubeAccount = linkedAccounts.find((account) => account.platform === "youtube");
      return Boolean(
        youtubeAccount?.oauthStatus === "connected" && hasValidYoutubeToken(youtubeAccount.tokenRef),
      );
    }
    if (platform === "instagram") {
      const metaAccount = linkedAccounts.find((account) => account.platform === "instagram");
      return Boolean(metaAccount?.oauthStatus === "connected" && hasValidMetaToken(metaAccount.tokenRef));
    }
    if (platform === "tiktok") {
      const tiktokAccount = linkedAccounts.find((account) => account.platform === "tiktok");
      return Boolean(tiktokAccount?.oauthStatus === "connected" && hasValidTiktokToken(tiktokAccount.tokenRef));
    }
    return false;
  };
  const connectedCount = providerCards.filter((provider) => isPlatformConnected(provider.platform)).length;
  const preferredAccount =
    linkedAccounts.find(
      (account) => account.platform === "youtube" && account.oauthStatus === "connected" && account.channelId,
    ) ??
    linkedAccounts.find((account) => account.platform === "youtube" && account.oauthStatus === "connected");
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
          const isConnected = isPlatformConnected(provider.platform);

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
              {provider.platform !== "youtube" ? (
                provider.platform === "instagram" ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {isConnected ? (
                      <form action="/api/meta/disconnect" method="post">
                        <button
                          type="submit"
                          className="rounded-lg border border-rose-300 px-3 py-2 text-sm text-rose-700 dark:border-rose-700 dark:text-rose-300"
                        >
                          Disconnect Meta
                        </button>
                      </form>
                    ) : (
                      <a
                        href="/api/meta/connect"
                        className="rounded-lg bg-black px-3 py-2 text-sm text-white dark:bg-zinc-200 dark:text-black"
                      >
                        Connect Meta
                      </a>
                    )}
                  </div>
                ) : provider.platform === "tiktok" ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {isConnected ? (
                      <form action="/api/tiktok/disconnect" method="post">
                        <button
                          type="submit"
                          className="rounded-lg border border-rose-300 px-3 py-2 text-sm text-rose-700 dark:border-rose-700 dark:text-rose-300"
                        >
                          Disconnect TikTok
                        </button>
                      </form>
                    ) : (
                      <a
                        href="/api/tiktok/connect"
                        className="rounded-lg bg-black px-3 py-2 text-sm text-white dark:bg-zinc-200 dark:text-black"
                      >
                        Connect TikTok
                      </a>
                    )}
                  </div>
                ) : null
              ) : null}
              {provider.platform === "youtube" ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {isConnected ? (
                    <>
                      <form action="/api/youtube/ingest" method="post">
                        <button
                          type="submit"
                          className="rounded-lg bg-black px-3 py-2 text-sm text-white dark:bg-zinc-200 dark:text-black"
                        >
                          Sync latest from YouTube
                        </button>
                      </form>
                      <form action="/api/youtube/disconnect" method="post">
                        <button
                          type="submit"
                          className="rounded-lg border border-rose-300 px-3 py-2 text-sm text-rose-700 dark:border-rose-700 dark:text-rose-300"
                        >
                          Disconnect Google / YouTube
                        </button>
                      </form>
                    </>
                  ) : (
                    <a
                      href="/api/youtube/connect"
                      className="rounded-lg bg-black px-3 py-2 text-sm text-white dark:bg-zinc-200 dark:text-black"
                    >
                      Connect Google / YouTube
                    </a>
                  )}
                </div>
              ) : null}
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
