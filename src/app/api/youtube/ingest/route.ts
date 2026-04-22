import { google } from "googleapis";
import { requireAppUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { decryptToken } from "@/lib/crypto";
import { getYoutubeOAuthClient } from "@/lib/youtube";

export async function POST() {
  const user = await requireAppUser();
  if (user.role !== "influencer") {
    return Response.json({ error: "Only influencers can ingest metrics" }, { status: 403 });
  }

  const account = await prisma.socialAccount.findUnique({
    where: { userId_platform: { userId: user.id, platform: "youtube" } },
  });
  if (!account?.tokenRef) {
    return Response.json({ error: "YouTube not connected" }, { status: 400 });
  }

  const oauth = getYoutubeOAuthClient();
  oauth.setCredentials(JSON.parse(decryptToken(account.tokenRef)));
  const youtube = google.youtube({ version: "v3", auth: oauth });
  const channelsResponse = await youtube.channels.list({
    part: ["statistics"],
    id: account.channelId ? [account.channelId] : undefined,
    // Google API rejects mine=false; omit it unless explicitly true.
    mine: account.channelId ? undefined : true,
  });
  const stats = channelsResponse.data.items?.[0]?.statistics;
  const subscribers = Number(stats?.subscriberCount ?? 0);
  const views30d = Number(stats?.viewCount ?? 0);
  const avgViewDuration = null;
  const retentionProxy = views30d > 0 ? Math.min(0.65, 0.1 + subscribers / (views30d + 1)) : 0;

  const metric = await prisma.influencerMetric.create({
    data: {
      userId: user.id,
      subscribers,
      views30d,
      avgViewDuration,
      retentionProxy,
    },
  });

  return Response.json({ metric });
}
