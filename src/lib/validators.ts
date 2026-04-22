import { z } from "zod";

export const campaignSchema = z.object({
  name: z.string().min(2),
  budgetRange: z.string().min(2),
  targetGeo: z.string().min(2),
  targetNiche: z.string().min(2),
  minSubscribers: z.number().int().nonnegative().optional(),
  minViews30d: z.number().int().nonnegative().optional(),
});

export const offerSchema = z.object({
  campaignId: z.string().min(1),
  influencerUserId: z.string().min(1),
  message: z.string().min(5),
  proposedValue: z.number().int().positive(),
});
