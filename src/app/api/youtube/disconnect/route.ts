import { prisma } from "@/lib/prisma";
import { requireAppUser } from "@/lib/auth";
import { decryptToken } from "@/lib/crypto";
import { requestHasTrustedOrigin } from "@/lib/security";
import { getYoutubeOAuthClient } from "@/lib/youtube";

type StoredYoutubeTokens = {
  access_token?: string;
  refresh_token?: string;
};

export async function POST(request: Request) {
  if (!requestHasTrustedOrigin(request)) {
    return Response.json({ error: "Untrusted origin" }, { status: 403 });
  }

  const user = await requireAppUser();
  if (user.role !== "influencer") {
    return Response.json({ error: "Only influencers can disconnect YouTube" }, { status: 403 });
  }
  const account = await prisma.socialAccount.findUnique({
    where: { userId_platform: { userId: user.id, platform: "youtube" } },
  });
  if (!account) {
    return Response.json({ ok: true });
  }

  if (account.tokenRef) {
    try {
      const parsed = JSON.parse(decryptToken(account.tokenRef)) as StoredYoutubeTokens;
      const oauth = getYoutubeOAuthClient();
      const tokenToRevoke = parsed.refresh_token ?? parsed.access_token;
      if (tokenToRevoke) {
        await oauth.revokeToken(tokenToRevoke);
      }
    } catch {
      // Never block disconnect if token is already invalid or malformed.
    }
  }

  await prisma.socialAccount.update({
    where: { id: account.id },
    data: {
      oauthStatus: "disconnected",
      channelId: null,
      tokenRef: null,
    },
  });

  const origin = process.env.APP_BASE_URL ?? new URL(request.url).origin;
  return Response.redirect(`${origin}/dashboard`, 302);
}
