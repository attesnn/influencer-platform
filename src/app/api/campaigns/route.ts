import { campaignSchema } from "@/lib/validators";
import { prisma } from "@/lib/prisma";
import { requireAppUser } from "@/lib/auth";
import { calculateCampaignScore } from "@/lib/scoring";

export async function GET() {
  const user = await requireAppUser();
  if (user.role !== "agency") {
    return Response.json({ error: "Only agencies can list campaigns" }, { status: 403 });
  }
  const campaigns = await prisma.campaign.findMany({
    where: { agencyUserId: user.id },
    include: { criteria: true, matches: true },
    orderBy: { createdAt: "desc" },
  });
  return Response.json({ campaigns });
}

export async function POST(request: Request) {
  const user = await requireAppUser();
  if (user.role !== "agency") {
    return Response.json({ error: "Only agencies can create campaigns" }, { status: 403 });
  }

  const payload = await request.json();
  const parsed = campaignSchema.safeParse(payload);
  if (!parsed.success) {
    return Response.json({ error: "Invalid campaign payload" }, { status: 400 });
  }

  const campaign = await prisma.campaign.create({
    data: {
      agencyUserId: user.id,
      name: parsed.data.name,
      budgetRange: parsed.data.budgetRange,
      targetGeo: parsed.data.targetGeo,
      targetNiche: parsed.data.targetNiche,
      criteria: {
        create: {
          minSubscribers: parsed.data.minSubscribers,
          minViews30d: parsed.data.minViews30d,
          preferredGeo: parsed.data.targetGeo,
          preferredNiche: parsed.data.targetNiche,
        },
      },
    },
    include: { criteria: true },
  });

  const influencers = await prisma.user.findMany({
    where: { role: "influencer" },
    include: { metrics: { orderBy: { snapshotDate: "desc" }, take: 1 } },
  });

  for (const influencer of influencers) {
    const latestMetric = influencer.metrics[0];
    if (!latestMetric) continue;

    const { score, breakdown } = calculateCampaignScore({
      subscribers: latestMetric.subscribers,
      views30d: latestMetric.views30d,
      retentionProxy: latestMetric.retentionProxy ?? 0,
      nicheMatch: 0.7,
      geoMatch: 0.7,
      minSubscribers: campaign.criteria?.minSubscribers,
      minViews30d: campaign.criteria?.minViews30d,
    });

    await prisma.campaignMatch.upsert({
      where: {
        campaignId_influencerUserId: {
          campaignId: campaign.id,
          influencerUserId: influencer.id,
        },
      },
      create: {
        campaignId: campaign.id,
        influencerUserId: influencer.id,
        score,
        scoreBreakdownJson: breakdown,
      },
      update: {
        score,
        scoreBreakdownJson: breakdown,
      },
    });
  }

  return Response.json({ campaign });
}
