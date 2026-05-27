import { prisma } from "@/lib/prisma";
import { requireAppUser } from "@/lib/auth";
import { decryptToken } from "@/lib/crypto";
import { requestHasTrustedOrigin } from "@/lib/security";
import { revokeMetaPermissions } from "@/lib/meta";

type StoredMetaTokens = {
  access_token?: string;
};

export async function POST(request: Request) {
  if (!requestHasTrustedOrigin(request)) {
    return Response.json({ error: "Untrusted origin" }, { status: 403 });
  }

  const user = await requireAppUser();
  if (user.role !== "influencer") {
    return Response.json({ error: "Only influencers can disconnect Meta" }, { status: 403 });
  }

  const account = await prisma.socialAccount.findUnique({
    where: { userId_platform: { userId: user.id, platform: "instagram" } },
  });
  if (!account) {
    return Response.redirect(`${process.env.APP_BASE_URL ?? new URL(request.url).origin}/dashboard`, 302);
  }

  if (account.tokenRef) {
    try {
      const parsed = JSON.parse(decryptToken(account.tokenRef)) as StoredMetaTokens;
      if (parsed.access_token) {
        await revokeMetaPermissions(parsed.access_token);
      }
    } catch {
      // Ignore malformed/stale tokens; local unlink should still proceed.
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
