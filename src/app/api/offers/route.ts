import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAppUser } from "@/lib/auth";
import { offerSchema } from "@/lib/validators";

const updateOfferSchema = z.object({
  offerId: z.string(),
  status: z.enum(["accepted", "rejected"]),
});

export async function GET() {
  const user = await requireAppUser();
  const offers =
    user.role === "agency"
      ? await prisma.offer.findMany({ where: { agencyUserId: user.id }, orderBy: { createdAt: "desc" } })
      : await prisma.offer.findMany({
          where: { influencerUserId: user.id },
          orderBy: { createdAt: "desc" },
        });
  return Response.json({ offers });
}

export async function POST(request: Request) {
  const user = await requireAppUser();
  if (user.role !== "agency") {
    return Response.json({ error: "Only agencies can send offers" }, { status: 403 });
  }

  const payload = await request.json();
  const parsed = offerSchema.safeParse(payload);
  if (!parsed.success) {
    return Response.json({ error: "Invalid offer payload" }, { status: 400 });
  }

  const offer = await prisma.offer.create({
    data: {
      campaignId: parsed.data.campaignId,
      agencyUserId: user.id,
      influencerUserId: parsed.data.influencerUserId,
      message: parsed.data.message,
      proposedValue: parsed.data.proposedValue,
    },
  });

  return Response.json({ offer });
}

export async function PATCH(request: Request) {
  const user = await requireAppUser();
  if (user.role !== "influencer") {
    return Response.json({ error: "Only influencers can respond" }, { status: 403 });
  }

  const payload = await request.json();
  const parsed = updateOfferSchema.safeParse(payload);
  if (!parsed.success) {
    return Response.json({ error: "Invalid offer status payload" }, { status: 400 });
  }

  const updateResult = await prisma.offer.updateMany({
    where: { id: parsed.data.offerId, influencerUserId: user.id },
    data: { status: parsed.data.status },
  });
  if (updateResult.count === 0) {
    return Response.json({ error: "Offer not found" }, { status: 404 });
  }

  const offer = await prisma.offer.findUnique({ where: { id: parsed.data.offerId } });

  return Response.json({ offer });
}
