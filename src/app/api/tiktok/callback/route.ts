import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { encryptToken } from "@/lib/crypto";
import { verifySignedTiktokState } from "@/lib/security";
import { exchangeTiktokCodeForToken, fetchTiktokUserInfo } from "@/lib/tiktok";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (!code || !state) {
    return Response.json({ error: "Invalid callback payload" }, { status: 400 });
  }

  const payload = verifySignedTiktokState(state);
  if (!payload) {
    return Response.json({ error: "Invalid callback state" }, { status: 400 });
  }

  const cookieStore = await cookies();
  const expectedState = cookieStore.get("tiktok_oauth_state")?.value;
  cookieStore.delete("tiktok_oauth_state");
  if (!expectedState || expectedState !== state) {
    return Response.json({ error: "State validation failed" }, { status: 400 });
  }

  const appUser = await prisma.user.findUnique({ where: { id: payload.appUserId } });
  if (!appUser) {
    return Response.json({ error: "No local app user found" }, { status: 404 });
  }
  if (appUser.role !== "influencer") {
    return Response.json({ error: "Only influencers can connect TikTok" }, { status: 403 });
  }

  let token;
  try {
    token = await exchangeTiktokCodeForToken(code);
  } catch {
    return Response.json({ error: "Failed to exchange TikTok authorization code" }, { status: 400 });
  }

  let profileOpenId = token.open_id;
  try {
    const userInfo = await fetchTiktokUserInfo(token.access_token);
    profileOpenId = userInfo.data?.user?.open_id ?? profileOpenId;
  } catch {
    // Keep auth success even if profile fetch fails; open_id from token is enough for linking.
  }

  const encrypted = encryptToken(
    JSON.stringify({
      access_token: token.access_token,
      refresh_token: token.refresh_token,
      expires_in: token.expires_in,
      refresh_expires_in: token.refresh_expires_in,
      scope: token.scope,
      token_type: token.token_type,
      open_id: profileOpenId,
    }),
  );

  await prisma.socialAccount.upsert({
    where: { userId_platform: { userId: appUser.id, platform: "tiktok" } },
    create: {
      userId: appUser.id,
      platform: "tiktok",
      oauthStatus: "connected",
      channelId: profileOpenId,
      tokenRef: encrypted,
    },
    update: {
      oauthStatus: "connected",
      channelId: profileOpenId,
      tokenRef: encrypted,
    },
  });

  const origin = process.env.APP_BASE_URL ?? url.origin;
  return Response.redirect(`${origin}/influencer?tiktokLink=success`, 302);
}
