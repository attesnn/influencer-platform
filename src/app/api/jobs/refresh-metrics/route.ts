import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const secret = request.headers.get("x-job-secret");
  if (!secret || secret !== process.env.JOB_SECRET) {
    return Response.json({ error: "Unauthorized job call" }, { status: 401 });
  }

  const influencers = await prisma.user.findMany({ where: { role: "influencer" } });
  return Response.json({
    queuedUsers: influencers.length,
    note: "Use a queue runner (Trigger.dev/cron worker) to call /api/youtube/ingest per influencer with service auth.",
  });
}
