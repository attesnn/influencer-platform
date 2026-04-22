import { requireAppUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const user = await requireAppUser();
  if (user.role !== "agency") {
    return Response.json({ error: "Only agencies can view matches" }, { status: 403 });
  }

  const url = new URL(request.url);
  const campaignId = url.searchParams.get("campaignId");
  if (!campaignId) {
    return Response.json({ error: "campaignId is required" }, { status: 400 });
  }

  const matches = await prisma.campaignMatch.findMany({
    where: {
      campaignId,
      campaign: { agencyUserId: user.id },
    },
    include: {
      influencerUser: { select: { id: true, email: true } },
    },
    orderBy: { score: "desc" },
  });
  return Response.json({ matches });
}
