import { google } from "googleapis";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { encryptToken } from "@/lib/crypto";
import { getYoutubeOAuthClient } from "@/lib/youtube";
import { verifySignedYoutubeState } from "@/lib/security";
import { ingestYoutubeMetricsForUser } from "@/lib/youtube-ingest";

const REQUIRED_YOUTUBE_SCOPES = [
  "https://www.googleapis.com/auth/youtube.readonly",
  "https://www.googleapis.com/auth/yt-analytics.readonly",
];

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
  const cookieStore = await cookies();
  const expectedState = cookieStore.get("yt_oauth_state")?.value;
  const codeVerifier = cookieStore.get("yt_oauth_pkce")?.value;
  cookieStore.delete("yt_oauth_state");
  cookieStore.delete("yt_oauth_pkce");
  if (!expectedState || expectedState !== state || !codeVerifier) {
    return Response.json({ error: "State or PKCE validation failed" }, { status: 400 });
  }

  const appUser = await prisma.user.findUnique({
    where: { id: statePayload.appUserId },
  });
  if (!appUser) {
    return Response.json({ error: "No local app user found" }, { status: 404 });
  }
  if (appUser.role !== "influencer") {
    return Response.json({ error: "Only influencers can connect YouTube" }, { status: 403 });
  }

  const oauth = getYoutubeOAuthClient();
  let tokens;
  try {
    ({ tokens } = await oauth.getToken({ code, codeVerifier }));
  } catch {
    return Response.json({ error: "Failed to exchange authorization code" }, { status: 400 });
  }
  const grantedScopeSet = new Set((tokens.scope ?? "").split(" ").filter(Boolean));
  const missingScopes = REQUIRED_YOUTUBE_SCOPES.filter((scope) => !grantedScopeSet.has(scope));
  if (missingScopes.length > 0) {
    return Response.json(
      { error: "Missing required YouTube scopes", missingScopes },
      { status: 400 },
    );
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

  const syncResult = await ingestYoutubeMetricsForUser(appUser.id);
  const syncFlag = syncResult.ok ? "?youtubeSync=success" : "?youtubeSync=first-sync-failed";

  const origin = process.env.APP_BASE_URL ?? new URL(request.url).origin;
  return Response.redirect(`${origin}/influencer${syncFlag}`, 302);
}
