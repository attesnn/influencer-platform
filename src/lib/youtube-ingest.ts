import type { InfluencerMetric } from "@prisma/client";
import { google } from "googleapis";
import { prisma } from "@/lib/prisma";
import { decryptToken, encryptToken } from "@/lib/crypto";
import { getYoutubeOAuthClient } from "@/lib/youtube";

type StoredYoutubeTokens = {
  access_token?: string;
  refresh_token?: string;
  expiry_date?: number;
  scope?: string;
  token_type?: string;
};

/**
 * Fetch channel statistics from YouTube and persist InfluencerMetric for the user.
 * Used after OAuth link and from manual sync.
 */
export async function ingestYoutubeMetricsForUser(
  userId: string,
): Promise<{ ok: true; metric: InfluencerMetric } | { ok: false; error: string }> {
  const account = await prisma.socialAccount.findUnique({
    where: { userId_platform: { userId, platform: "youtube" } },
  });
  if (!account?.tokenRef) {
    return { ok: false, error: "YouTube not connected" };
  }

  let storedTokens: StoredYoutubeTokens;
  try {
    storedTokens = JSON.parse(decryptToken(account.tokenRef)) as StoredYoutubeTokens;
  } catch {
    return { ok: false, error: "Invalid stored token" };
  }

  const oauth = getYoutubeOAuthClient();
  oauth.setCredentials(storedTokens);
  try {
    await oauth.getAccessToken();
  } catch {
    return { ok: false, error: "Failed to refresh access token" };
  }

  const refreshedTokens = oauth.credentials;
  if (refreshedTokens?.access_token) {
    await prisma.socialAccount.update({
      where: { id: account.id },
      data: {
        tokenRef: encryptToken(
          JSON.stringify({
            ...storedTokens,
            ...refreshedTokens,
            refresh_token: refreshedTokens.refresh_token ?? storedTokens.refresh_token,
          }),
        ),
      },
    });
  }

  const youtube = google.youtube({ version: "v3", auth: oauth });
  const channelsResponse = await youtube.channels.list({
    part: ["statistics"],
    id: account.channelId ? [account.channelId] : undefined,
    mine: account.channelId ? undefined : true,
  });
  const stats = channelsResponse.data.items?.[0]?.statistics;
  const subscribers = Number(stats?.subscriberCount ?? 0);
  const views30d = Number(stats?.viewCount ?? 0);
  const avgViewDuration = null;
  const retentionProxy = views30d > 0 ? Math.min(0.65, 0.1 + subscribers / (views30d + 1)) : 0;

  const metric = await prisma.influencerMetric.create({
    data: {
      userId,
      subscribers,
      views30d,
      avgViewDuration,
      retentionProxy,
    },
  });

  return { ok: true, metric };
}
