import Link from "next/link";
import { prisma } from "@/lib/prisma";
import UserProfileChip from "@/components/UserProfileChip";
import { requireAppUser } from "@/lib/auth";
import { decryptToken } from "@/lib/crypto";

type AgeSplitBucket = { group: string; share: number };
type GeographyRow = { country: string; flag: string; share: number };
type PlatformKey = "youtube" | "instagram" | "tiktok";

function toFlagEmoji(flagOrCountryCode: string) {
  const candidate = flagOrCountryCode.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(candidate)) {
    return flagOrCountryCode;
  }
  const codePoints = [...candidate].map((char) => 0x1f1e6 + (char.charCodeAt(0) - 65));
  return String.fromCodePoint(...codePoints);
}

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

export default async function InfluencerPage() {
  const user = await requireAppUser();
  if (!user || user.role !== "influencer") return <main className="p-8">Influencer role required.</main>;
  const socialAccounts = await prisma.socialAccount.findMany({ where: { userId: user.id } });
  const latestYoutubeMetric = await prisma.influencerMetric.findFirst({
    where: { userId: user.id },
    orderBy: { snapshotDate: "desc" },
  });
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
    connected:
      platform === "youtube"
        ? socialAccounts.some(
            (account) =>
              String(account.platform) === platform &&
              account.oauthStatus === "connected" &&
              hasValidYoutubeToken(account.tokenRef),
          )
        : platform === "instagram"
          ? socialAccounts.some(
              (account) =>
                String(account.platform) === platform &&
                account.oauthStatus === "connected" &&
                hasValidMetaToken(account.tokenRef),
            )
          : platform === "tiktok"
            ? socialAccounts.some(
                (account) =>
                  String(account.platform) === platform &&
                  account.oauthStatus === "connected" &&
                  hasValidTiktokToken(account.tokenRef),
              )
            : false,
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
    const youtubeFollowers = latestYoutubeMetric?.subscribers ?? metric?.followers ?? 0;
    const youtubeViews = latestYoutubeMetric?.views30d ?? metric?.reachOrganic ?? 0;
    const youtubeRetention = latestYoutubeMetric?.retentionProxy
      ? Math.max(0, Math.min(100, latestYoutubeMetric.retentionProxy * 100))
      : metric?.retentionRate ?? 0;
    return {
      platform,
      organic: platform === "youtube" ? youtubeViews : metric?.reachOrganic ?? 0,
      paid: platform === "youtube" ? 0 : metric?.reachPaid ?? 0,
      engagementRate: metric?.engagementRate ?? 0,
      retentionRate: platform === "youtube" ? youtubeRetention : metric?.retentionRate ?? 0,
      followers: platform === "youtube" ? youtubeFollowers : metric?.followers ?? 0,
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
  const topPlatformByFollowers = reachRows.reduce((best, row) =>
    row.followers > best.followers ? row : best,
  );
  const topPlatformByEngagement = reachRows.reduce((best, row) =>
    row.engagementRate > best.engagementRate ? row : best,
  );
  const topAgeBucket = ageSplit.reduce<AgeSplitBucket | null>(
    (best, bucket) => (!best || bucket.share > best.share ? bucket : best),
    null,
  );
  const topGeographyRow = geography.reduce<GeographyRow | null>(
    (best, row) => (!best || row.share > best.share ? row : best),
    null,
  );
  const linkedinReadyText = [
    "Creator performance snapshot",
    "",
    `- Total audience: ${totalFollowers.toLocaleString()}`,
    `- Total reach: ${totalReach.toLocaleString()}`,
    `- Strongest audience platform: ${
      platformLabel[topPlatformByFollowers.platform]
    } (${topPlatformByFollowers.followers.toLocaleString()} followers)`,
    `- Best engagement platform: ${
      platformLabel[topPlatformByEngagement.platform]
    } (${topPlatformByEngagement.engagementRate.toFixed(1)}%)`,
    `- Average retention across channels: ${avgRetention.toFixed(1)}%`,
    topAgeBucket
      ? `- Top age segment: ${topAgeBucket.group} (${topAgeBucket.share.toFixed(1)}%)`
      : "- Top age segment: not available yet",
    topGeographyRow
      ? `- Top geography: ${topGeographyRow.country} (${topGeographyRow.share.toFixed(1)}%)`
      : "- Top geography: not available yet",
    "",
    "#creator #influencermarketing #socialmedia",
  ].join("\n");

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4 px-4 py-5 sm:gap-6 sm:px-6 sm:py-8">
      {missingConnections > 0 ? (
      <section className="rounded-2xl border border-zinc-200 bg-zinc-50/80 p-4 dark:border-zinc-700 dark:bg-zinc-900/40">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-amber-900 dark:text-amber-200">
              Account connection status
            </h2>
            <p className="text-sm text-amber-800 dark:text-amber-300">
              {missingConnections} platform{missingConnections > 1 ? "s" : ""} still missing
            </p>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {platformConnectionStatus.map((item) => (
              <article
                key={item.key}
                className={`rounded-xl border px-3 py-2 ${
                  item.connected
                    ? "border-blue-200 bg-blue-50/80 dark:border-blue-700 dark:bg-blue-950/30"
                    : "border-zinc-200 bg-zinc-50/80 dark:border-zinc-700 dark:bg-zinc-900/40"
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

      <section className="space-y-2">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold sm:text-3xl">Influencer analytics hub</h1>
            <p className="text-zinc-600 dark:text-zinc-300">
              Unified dummy analytics preview across YouTube, Instagram, and TikTok using
              realistic API response shapes.
            </p>
          </div>
          <UserProfileChip displayName={socialDisplayName} />
        </div>
      </section>

      <section className="rounded-2xl border border-violet-200 bg-violet-50/70 p-4 sm:p-5 dark:border-violet-900/50 dark:bg-violet-950/20">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">Somex summary (LinkedIn-ready)</h2>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">AI text will replace this draft later</span>
        </div>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
          Copy the text below directly to LinkedIn, then adjust tone as needed.
        </p>
        <pre className="mt-3 whitespace-pre-wrap rounded-xl border border-violet-200 bg-white/90 p-4 text-sm leading-6 dark:border-violet-900/50 dark:bg-zinc-950">
          {linkedinReadyText}
        </pre>
      </section>

      <section className="rounded-2xl border border-blue-200 bg-blue-50/70 p-4 sm:p-5 dark:border-blue-900/60 dark:bg-blue-950/20">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">Live YouTube snapshot</h2>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            {latestYoutubeMetric ? `Updated ${latestYoutubeMetric.snapshotDate.toLocaleString()}` : "No sync yet"}
          </span>
        </div>
        {latestYoutubeMetric ? (
          <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <article className="rounded-xl border border-blue-200 bg-white/90 p-3 dark:border-blue-900/60 dark:bg-zinc-950">
              <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Subscribers</p>
              <p className="mt-1 text-xl font-semibold">{latestYoutubeMetric.subscribers.toLocaleString()}</p>
            </article>
            <article className="rounded-xl border border-blue-200 bg-white/90 p-3 dark:border-blue-900/60 dark:bg-zinc-950">
              <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Channel Views</p>
              <p className="mt-1 text-xl font-semibold">{latestYoutubeMetric.views30d.toLocaleString()}</p>
            </article>
            <article className="rounded-xl border border-blue-200 bg-white/90 p-3 dark:border-blue-900/60 dark:bg-zinc-950">
              <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Retention Proxy</p>
              <p className="mt-1 text-xl font-semibold">
                {((latestYoutubeMetric.retentionProxy ?? 0) * 100).toFixed(1)}%
              </p>
            </article>
            <article className="rounded-xl border border-blue-200 bg-white/90 p-3 dark:border-blue-900/60 dark:bg-zinc-950">
              <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Avg View Duration</p>
              <p className="mt-1 text-xl font-semibold">
                {latestYoutubeMetric.avgViewDuration
                  ? `${latestYoutubeMetric.avgViewDuration.toFixed(1)} sec`
                  : "Not available"}
              </p>
            </article>
          </div>
        ) : (
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
            Connect YouTube and run a sync from dashboard to populate live channel metrics here.
          </p>
        )}
      </section>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "Total Reach", value: totalReach.toLocaleString() },
          { label: "Avg Engagement", value: `${avgEngagement.toFixed(1)}%` },
          { label: "Avg Retention", value: `${avgRetention.toFixed(1)}%` },
          { label: "Total Audience", value: totalFollowers.toLocaleString() },
        ].map((item) => (
          <article
            key={item.label}
            className="rounded-2xl border border-zinc-200 bg-zinc-50/80 p-4 dark:border-zinc-700 dark:bg-zinc-900/40"
          >
            <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{item.label}</p>
            <p className="mt-2 text-2xl font-semibold">{item.value}</p>
          </article>
        ))}
      </section>

      <section className="rounded-2xl border border-blue-200 bg-blue-50/60 p-4 sm:p-5 dark:border-blue-900/50 dark:bg-blue-950/20">
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
        <article className="rounded-2xl border border-violet-200 bg-violet-50/60 p-4 sm:p-5 dark:border-violet-900/50 dark:bg-violet-950/20">
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

        <article className="rounded-2xl border border-blue-200 bg-blue-50/60 p-4 sm:p-5 dark:border-blue-900/50 dark:bg-blue-950/20">
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
        <article className="rounded-2xl border border-zinc-200 bg-zinc-50/80 p-4 sm:p-5 dark:border-zinc-700 dark:bg-zinc-900/40">
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

        <article className="rounded-2xl border border-violet-200 bg-violet-50/60 p-4 sm:p-5 dark:border-violet-900/50 dark:bg-violet-950/20">
          <h2 className="text-lg font-semibold">Geography</h2>
          <div className="mt-3 space-y-3">
            {geography.map((row) => (
              <div key={row.country}>
                <div className="mb-1 flex justify-between text-sm">
                  <span>
                    {toFlagEmoji(row.flag)} {row.country}
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

      <Link className="text-sm underline" href="/dashboard">
        Back to dashboard
      </Link>
    </main>
  );
}
