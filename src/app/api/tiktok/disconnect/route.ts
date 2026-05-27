import { prisma } from "@/lib/prisma";
import { requireAppUser } from "@/lib/auth";
import { requestHasTrustedOrigin } from "@/lib/security";

export async function POST(request: Request) {
  if (!requestHasTrustedOrigin(request)) {
    return Response.json({ error: "Untrusted origin" }, { status: 403 });
  }

  const user = await requireAppUser();
  if (user.role !== "influencer") {
    return Response.json({ error: "Only influencers can disconnect TikTok" }, { status: 403 });
  }

  const account = await prisma.socialAccount.findUnique({
    where: { userId_platform: { userId: user.id, platform: "tiktok" } },
  });
  if (account) {
    await prisma.socialAccount.update({
      where: { id: account.id },
      data: {
        oauthStatus: "disconnected",
        channelId: null,
        tokenRef: null,
      },
    });
  }

  const origin = process.env.APP_BASE_URL ?? new URL(request.url).origin;
  return Response.redirect(`${origin}/dashboard`, 302);
}
