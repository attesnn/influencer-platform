import { requireAppUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await requireAppUser();
  const payload = await prisma.user.findUnique({
    where: { id: user.id },
    include: {
      socialAccounts: true,
      metrics: true,
      campaigns: true,
      campaignMatches: true,
      offersSent: true,
      offersReceived: true,
      auditEvents: true,
    },
  });
  return Response.json({ export: payload });
}
