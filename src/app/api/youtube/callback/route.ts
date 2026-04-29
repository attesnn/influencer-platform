import { google } from "googleapis";
import { prisma } from "@/lib/prisma";
import { encryptToken } from "@/lib/crypto";
import { getYoutubeOAuthClient } from "@/lib/youtube";
import { verifySignedYoutubeState } from "@/lib/security";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (!code || !state) {
    return Response.json({ error: "Invalid callback payload" }, { status: 400 });
  }

  const statePayload = verifySignedYoutubeState(state);
  if (!statePayload) {
    return Response.json({ error: "Invalid callback state" }, { status: 400 });
  }

  const appUser = await prisma.user.findUnique({
    where: { id: statePayload.appUserId },
  });
  if (!appUser) {
    return Response.json({ error: "No local app user found" }, { status: 404 });
  }

  const oauth = getYoutubeOAuthClient();
  let tokens;
  try {
    ({ tokens } = await oauth.getToken(code));
  } catch {
    return Response.json({ error: "Failed to exchange authorization code" }, { status: 400 });
  }
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
