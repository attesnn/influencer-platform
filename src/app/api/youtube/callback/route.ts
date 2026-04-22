import { google } from "googleapis";
import { prisma } from "@/lib/prisma";
import { encryptToken } from "@/lib/crypto";
import { getYoutubeOAuthClient } from "@/lib/youtube";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (!code || !state) {
    return Response.json({ error: "Invalid callback payload" }, { status: 400 });
  }

  const statePayload = JSON.parse(Buffer.from(state, "base64url").toString("utf8")) as {
    userId: string;
  };

  const appUser = await prisma.user.findUnique({
    where: { clerkUserId: statePayload.userId },
  });
  if (!appUser) {
    return Response.json({ error: "No local app user found" }, { status: 404 });
  }

  const oauth = getYoutubeOAuthClient();
  const { tokens } = await oauth.getToken(code);
  oauth.setCredentials(tokens);
  const youtube = google.youtube({ version: "v3", auth: oauth });
  const channelsResponse = await youtube.channels.list({
    part: ["id", "statistics"],
    mine: true,
  });

  const channel = channelsResponse.data.items?.[0];
  const encryptedToken = encryptToken(JSON.stringify(tokens));

  await prisma.socialAccount.upsert({
    where: { userId_platform: { userId: appUser.id, platform: "youtube" } },
    create: {
      userId: appUser.id,
      platform: "youtube",
      oauthStatus: "connected",
      channelId: channel?.id,
      tokenRef: encryptedToken,
    },
    update: {
      oauthStatus: "connected",
      channelId: channel?.id,
      tokenRef: encryptedToken,
    },
  });

  return Response.redirect(`${process.env.APP_BASE_URL}/influencer`, 302);
}
