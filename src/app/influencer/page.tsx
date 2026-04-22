import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import UserProfileChip from "@/components/UserProfileChip";

type YouTubeAnalyticsReport = {
  kind: "youtubeAnalytics#resultTable";
  columnHeaders: Array<{
    name: string;
    columnType: "DIMENSION" | "METRIC";
    dataType: "STRING" | "INTEGER" | "FLOAT";
  }>;
  rows: Array<[string, number, number, number, number, number, number, number]>;
};

type InstagramInsightsResponse = {
  data: Array<{
    name: string;
    period: "day";
    values: Array<{ value: number; end_time: string }>;
    title: string;
    description: string;
    id: string;
  }>;
};

type TikTokAnalyticsResponse = {
  data: {
    list: Array<{
      stat_time_day: string;
      video_views: number;
      profile_views: number;
      likes: number;
      comments: number;
      shares: number;
      followers_count: number;
      average_watch_time: number;
    }>;
    cursor: number;
    has_more: boolean;
  };
};

type AgeSplitBucket = { group: string; share: number };
type GeographyRow = { country: string; flag: string; share: number };
type PlatformKey = "youtube" | "instagram" | "tiktok";

function parseAgeSplitJson(input: unknown): AgeSplitBucket[] {
  if (!Array.isArray(input)) return [];
  return input.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const candidate = item as Record<string, unknown>;
    if (typeof candidate.group !== "string" || typeof candidate.share !== "number") return [];
    return [{ group: candidate.group, share: candidate.share }];
  });
}

function parseGeographyJson(input: unknown): GeographyRow[] {
  if (!Array.isArray(input)) return [];
  return input.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const candidate = item as Record<string, unknown>;
    if (
      typeof candidate.country !== "string" ||
      typeof candidate.flag !== "string" ||
      typeof candidate.share !== "number"
    ) {
      return [];
    }
    return [{ country: candidate.country, flag: candidate.flag, share: candidate.share }];
  });
}

function percentBar(value: number, max = 100) {
  const width = Math.max(4, Math.min(100, (value / max) * 100));
  return `${width}%`;
}

export default async function InfluencerPage() {
  const { userId } = await auth();
  if (!userId) return <main className="p-8">Unauthorized</main>;

  const user = await prisma.user.findUnique({
    where: { clerkUserId: userId },
  });
  if (!user || user.role !== "influencer") return <main className="p-8">Influencer role required.</main>;
  const socialAccounts = await prisma.socialAccount.findMany({ where: { userId: user.id } });
  const platformMetrics = await prisma.$queryRaw<
    Array<{
      platform: PlatformKey;
      snapshotDate: Date;
      reachOrganic: number;
      reachPaid: number;
      engagementRate: number;
      retentionRate: number;
      followers: number;
      payloadJson: unknown;
    }>
  >`
    SELECT "platform", "snapshotDate", "reachOrganic", "reachPaid", "engagementRate", "retentionRate", "followers", "payloadJson"
    FROM "PlatformMetric"
    WHERE "userId" = ${user.id}
    ORDER BY "snapshotDate" DESC
  `;
  const audienceSnapshotRows = await prisma.$queryRaw<
    Array<{ ageSplitJson: unknown; geographyJson: unknown }>
  >`
    SELECT "ageSplitJson", "geographyJson"
    FROM "AudienceSnapshot"
    WHERE "userId" = ${user.id}
    ORDER BY "snapshotDate" DESC
    LIMIT 1
  `;

  const platforms: PlatformKey[] = ["youtube", "instagram", "tiktok"];
  const platformLabel: Record<PlatformKey, string> = {
    youtube: "YouTube",
    instagram: "Instagram",
    tiktok: "TikTok",
  };
  const latestByPlatform = new Map<PlatformKey, (typeof platformMetrics)[number]>();
  for (const metric of platformMetrics) {
    const key = metric.platform;
    if (!latestByPlatform.has(key)) {
      latestByPlatform.set(key, metric);
    }
  }

  const platformConnectionStatus = platforms.map((platform) => ({
    key: platform,
    label: platformLabel[platform],
    connected: socialAccounts.some(
      (account) => String(account.platform) === platform && account.oauthStatus === "connected",
    ),
  }));
  const missingConnections = platformConnectionStatus.filter((item) => !item.connected).length;
  const preferredAccount =
    socialAccounts.find((account) => account.oauthStatus === "connected" && account.channelId) ??
    socialAccounts.find((account) => account.oauthStatus === "connected");
  const socialDisplayName =
    preferredAccount?.channelId ??
    (user.email.includes("@") ? `@${user.email.split("@")[0]}` : user.email);

  const reachRows = platforms.map((platform) => {
    const metric = latestByPlatform.get(platform);
    return {
      platform,
      organic: metric?.reachOrganic ?? 0,
      paid: metric?.reachPaid ?? 0,
      engagementRate: metric?.engagementRate ?? 0,
      retentionRate: metric?.retentionRate ?? 0,
      followers: metric?.followers ?? 0,
    };
  });
  const qualityRows = reachRows.map((row) => {
    const total = row.organic + row.paid;
    const organicShare = total > 0 ? (row.organic / total) * 100 : 0;
    const qualityScore = organicShare * (row.engagementRate / 100);
    return {
      platform: row.platform,
      total,
      organicShare,
      qualityScore,
    };
  });
  const followerCounts = {
    youtube: reachRows.find((row) => row.platform === "youtube")?.followers ?? 0,
    instagram: reachRows.find((row) => row.platform === "instagram")?.followers ?? 0,
    tiktok: reachRows.find((row) => row.platform === "tiktok")?.followers ?? 0,
  };
  const totalFollowers = followerCounts.youtube + followerCounts.instagram + followerCounts.tiktok;
  const youtubeShare = totalFollowers > 0 ? (followerCounts.youtube / totalFollowers) * 100 : 0;
  const instagramShare = totalFollowers > 0 ? (followerCounts.instagram / totalFollowers) * 100 : 0;
  const tiktokShare = totalFollowers > 0 ? (followerCounts.tiktok / totalFollowers) * 100 : 0;
  const pieChartBackground = `conic-gradient(#ef4444 0% ${youtubeShare}%, #a855f7 ${youtubeShare}% ${
    youtubeShare + instagramShare
  }%, #0ea5e9 ${youtubeShare + instagramShare}% 100%)`;
  const latestAudienceSnapshot = audienceSnapshotRows[0];
  const ageSplit = parseAgeSplitJson(latestAudienceSnapshot?.ageSplitJson);
  const geography = parseGeographyJson(latestAudienceSnapshot?.geographyJson);
  const totalReach = reachRows.reduce((acc, row) => acc + row.organic + row.paid, 0);
  const avgEngagement = reachRows.reduce((acc, row) => acc + row.engagementRate, 0) / reachRows.length;
  const avgRetention = reachRows.reduce((acc, row) => acc + row.retentionRate, 0) / reachRows.length;

  const youtubePayload = latestByPlatform.get("youtube")?.payloadJson as YouTubeAnalyticsReport | undefined;
  const instagramPayload = latestByPlatform.get("instagram")?.payloadJson as InstagramInsightsResponse | undefined;
  const tiktokPayload = latestByPlatform.get("tiktok")?.payloadJson as TikTokAnalyticsResponse | undefined;

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-8">
      {missingConnections > 0 ? (
        <section className="rounded-xl border border-amber-300 bg-amber-50 p-4 dark:border-amber-700 dark:bg-amber-950/30">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-amber-900 dark:text-amber-200">
              Account connection status
            </h2>
            <p className="text-sm text-amber-800 dark:text-amber-300">
              {missingConnections} platform{missingConnections > 1 ? "s" : ""} still missing
            </p>
          </div>
          <div className="mt-3 grid gap-2 md:grid-cols-3">
            {platformConnectionStatus.map((item) => (
              <article
                key={item.key}
                className={`rounded-lg border px-3 py-2 ${
                  item.connected
                    ? "border-emerald-300 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-950/30"
                    : "border-rose-300 bg-rose-50 dark:border-rose-700 dark:bg-rose-950/30"
                }`}
              >
                <p
                  className={`text-sm font-medium ${
                    item.connected
                      ? "text-emerald-900 dark:text-emerald-200"
                      : "text-rose-900 dark:text-rose-200"
                  }`}
                >
                  {item.label}
                </p>
                <p
                  className={`text-xs ${
                    item.connected
                      ? "text-emerald-700 dark:text-emerald-300"
                      : "text-rose-700 dark:text-rose-300"
                  }`}
                >
                  {item.connected ? "Connected" : "Not connected - you should probably add this"}
                </p>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">Influencer analytics hub</h1>
            <p className="text-zinc-600 dark:text-zinc-300">
              Unified dummy analytics preview across YouTube, Instagram, and TikTok using
              realistic API response shapes.
            </p>
          </div>
          <UserProfileChip displayName={socialDisplayName} />
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-4">
        {[
          { label: "Total Reach", value: totalReach.toLocaleString() },
          { label: "Avg Engagement", value: `${avgEngagement.toFixed(1)}%` },
          { label: "Avg Retention", value: `${avgRetention.toFixed(1)}%` },
          { label: "Total Audience", value: totalFollowers.toLocaleString() },
        ].map((item) => (
          <article key={item.label} className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
            <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{item.label}</p>
            <p className="mt-2 text-2xl font-semibold">{item.value}</p>
          </article>
        ))}
      </section>

      <section className="rounded-xl border border-zinc-200 p-5 dark:border-zinc-800">
        <h2 className="text-lg font-semibold">Reach split (organic vs paid)</h2>
        <div className="mt-4 space-y-4">
          {reachRows.map((row) => {
            const total = row.organic + row.paid;
            const organicShare = total > 0 ? (row.organic / total) * 100 : 0;
            const paidShare = total > 0 ? (row.paid / total) * 100 : 0;
            return (
              <div key={row.platform}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="font-medium capitalize">{row.platform}</span>
                  <span className="text-zinc-600 dark:text-zinc-300">
                    {total.toLocaleString()} total
                  </span>
                </div>
                <div className="flex h-3 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                  <div
                    className="h-full bg-emerald-600"
                    style={{ width: `${organicShare}%` }}
                  />
                  <div
                    className="h-full bg-amber-500"
                    style={{ width: `${paidShare}%` }}
                  />
                </div>
                <div className="mt-1 flex justify-between text-xs text-zinc-500 dark:text-zinc-400">
                  <span>
                    Organic: {row.organic.toLocaleString()} ({organicShare.toFixed(1)}%)
                  </span>
                  <span>
                    Paid: {row.paid.toLocaleString()} ({paidShare.toFixed(1)}%)
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-xl border border-zinc-200 p-5 dark:border-zinc-800">
          <h2 className="text-lg font-semibold">Engagement quality</h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
            Quality score blends engagement rate with organic reach share.
          </p>
          <div className="mt-4 space-y-3">
            {qualityRows.map((row) => (
              <div key={row.platform}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="capitalize">{row.platform}</span>
                  <span>{row.organicShare.toFixed(1)}% organic</span>
                </div>
                <div className="h-2 rounded-full bg-zinc-200 dark:bg-zinc-800">
                  <div
                    className="h-2 rounded-full bg-emerald-600"
                    style={{ width: percentBar(row.organicShare) }}
                  />
                </div>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  Quality score {row.qualityScore.toFixed(1)} from engagement + organic mix
                </p>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-xl border border-zinc-200 p-5 dark:border-zinc-800">
          <h2 className="text-lg font-semibold">Retention by platform</h2>
          <div className="mt-4 space-y-3">
            {reachRows.map((row) => (
              <div key={row.platform}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="capitalize">{row.platform}</span>
                  <span>{row.retentionRate.toFixed(1)}%</span>
                </div>
                <div className="h-2 rounded-full bg-zinc-200 dark:bg-zinc-800">
                  <div
                    className="h-2 rounded-full bg-violet-600"
                    style={{ width: percentBar(row.retentionRate) }}
                  />
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-xl border border-zinc-200 p-5 dark:border-zinc-800">
          <h2 className="text-lg font-semibold">Audience</h2>
          <div className="mt-4 flex flex-col items-center gap-4 md:flex-row md:items-start">
            <div
              className="aspect-square w-40 shrink-0 rounded-full border border-zinc-200 dark:border-zinc-700"
              style={{ background: pieChartBackground }}
              aria-label="Audience split pie chart by platform"
            />
            <div className="w-full space-y-2 text-sm">
              <p className="font-medium">Platform split (followers)</p>
              <div className="flex items-center justify-between rounded bg-zinc-50 px-2 py-1 dark:bg-zinc-900">
                <span className="flex items-center gap-2">
                  <span className="inline-block h-3 w-3 rounded-full bg-red-500" />
                  YouTube
                </span>
                <span>
                  {followerCounts.youtube.toLocaleString()} ({youtubeShare.toFixed(1)}%)
                </span>
              </div>
              <div className="flex items-center justify-between rounded bg-zinc-50 px-2 py-1 dark:bg-zinc-900">
                <span className="flex items-center gap-2">
                  <span className="inline-block h-3 w-3 rounded-full bg-purple-500" />
                  Instagram
                </span>
                <span>
                  {followerCounts.instagram.toLocaleString()} ({instagramShare.toFixed(1)}%)
                </span>
              </div>
              <div className="flex items-center justify-between rounded bg-zinc-50 px-2 py-1 dark:bg-zinc-900">
                <span className="flex items-center gap-2">
                  <span className="inline-block h-3 w-3 rounded-full bg-sky-500" />
                  TikTok
                </span>
                <span>
                  {followerCounts.tiktok.toLocaleString()} ({tiktokShare.toFixed(1)}%)
                </span>
              </div>
            </div>
          </div>
          <h3 className="mt-4 text-sm font-semibold">Age split</h3>
          <div className="mt-2 space-y-2">
            {ageSplit.map((bucket) => (
              <div key={bucket.group}>
                <div className="mb-1 flex justify-between text-xs text-zinc-600 dark:text-zinc-300">
                  <span>{bucket.group}</span>
                  <span>{bucket.share}%</span>
                </div>
                <div className="h-2 rounded-full bg-zinc-200 dark:bg-zinc-800">
                  <div
                    className="h-2 rounded-full bg-sky-600"
                    style={{ width: percentBar(bucket.share) }}
                  />
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-xl border border-zinc-200 p-5 dark:border-zinc-800">
          <h2 className="text-lg font-semibold">Geography</h2>
          <div className="mt-3 space-y-3">
            {geography.map((row) => (
              <div key={row.country}>
                <div className="mb-1 flex justify-between text-sm">
                  <span>
                    {row.flag} {row.country}
                  </span>
                  <span>{row.share}%</span>
                </div>
                <div className="h-2 rounded-full bg-zinc-200 dark:bg-zinc-800">
                  <div
                    className="h-2 rounded-full bg-amber-500"
                    style={{ width: percentBar(row.share, 30) }}
                  />
                </div>
              </div>
            ))}
            {geography.length === 0 ? (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">No geography snapshot yet.</p>
            ) : null}
          </div>
        </article>
      </section>

      <section className="rounded-xl border border-zinc-200 p-5 dark:border-zinc-800">
        <h2 className="text-lg font-semibold">Raw API-shaped dummy payloads</h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
          These payloads follow typical response shapes from each platform API for
          realistic integration scaffolding.
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <article className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-900">
            <h3 className="text-sm font-semibold">YouTube Analytics</h3>
            <pre className="mt-2 overflow-x-auto text-xs text-zinc-700 dark:text-zinc-300">
              {JSON.stringify(youtubePayload ?? {}, null, 2)}
            </pre>
          </article>
          <article className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-900">
            <h3 className="text-sm font-semibold">Instagram Insights</h3>
            <pre className="mt-2 overflow-x-auto text-xs text-zinc-700 dark:text-zinc-300">
              {JSON.stringify(instagramPayload ?? {}, null, 2)}
            </pre>
          </article>
          <article className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-900">
            <h3 className="text-sm font-semibold">TikTok Analytics</h3>
            <pre className="mt-2 overflow-x-auto text-xs text-zinc-700 dark:text-zinc-300">
              {JSON.stringify(tiktokPayload ?? {}, null, 2)}
            </pre>
          </article>
        </div>
      </section>

      <Link className="text-sm underline" href="/dashboard">
        Back to dashboard
      </Link>
    </main>
  );
}
