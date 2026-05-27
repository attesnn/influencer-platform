import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { encryptToken } from "@/lib/crypto";
import { verifySignedMetaState } from "@/lib/security";
import { exchangeMetaCodeForToken, fetchMetaMe } from "@/lib/meta";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (!code || !state) {
    return Response.json({ error: "Invalid callback payload" }, { status: 400 });
  }

  const payload = verifySignedMetaState(state);
  if (!payload) {
    return Response.json({ error: "Invalid callback state" }, { status: 400 });
  }

  const cookieStore = await cookies();
  const expectedState = cookieStore.get("meta_oauth_state")?.value;
  cookieStore.delete("meta_oauth_state");
  if (!expectedState || expectedState !== state) {
    return Response.json({ error: "State validation failed" }, { status: 400 });
  }

  const appUser = await prisma.user.findUnique({ where: { id: payload.appUserId } });
  if (!appUser) {
    return Response.json({ error: "No local app user found" }, { status: 404 });
  }
  if (appUser.role !== "influencer") {
    return Response.json({ error: "Only influencers can connect Meta" }, { status: 403 });
  }

  let token;
  try {
    token = await exchangeMetaCodeForToken(code);
  } catch {
    return Response.json({ error: "Failed to exchange Meta authorization code" }, { status: 400 });
  }

  let me;
  try {
    me = await fetchMetaMe(token.access_token);
  } catch {
    return Response.json({ error: "Failed to fetch Meta profile" }, { status: 400 });
  }

  const encrypted = encryptToken(
    JSON.stringify({
      access_token: token.access_token,
      token_type: token.token_type,
      expires_in: token.expires_in,
      meta_user_id: me.id,
      meta_name: me.name,
    }),
  );

  await prisma.socialAccount.upsert({
    where: { userId_platform: { userId: appUser.id, platform: "instagram" } },
    create: {
      userId: appUser.id,
      platform: "instagram",
      oauthStatus: "connected",
      channelId: me.id,
      tokenRef: encrypted,
    },
    update: {
      oauthStatus: "connected",
      channelId: me.id,
      tokenRef: encrypted,
    },
  });

  const origin = process.env.APP_BASE_URL ?? url.origin;
  return Response.redirect(`${origin}/influencer?metaLink=success`, 302);
}
