import { requireAppUser } from "@/lib/auth";
import { ingestYoutubeMetricsForUser } from "@/lib/youtube-ingest";
import { requestHasTrustedOrigin } from "@/lib/security";

export async function POST(request: Request) {
  const requestUrl = new URL(request.url);
  const responseMode = requestUrl.searchParams.get("response");
  const shouldReturnJson = responseMode === "json";
  const origin = process.env.APP_BASE_URL ?? requestUrl.origin;

  if (!requestHasTrustedOrigin(request)) {
    if (!shouldReturnJson) {
      return Response.redirect(`${origin}/dashboard?youtubeSync=forbidden`, 302);
    }
    return Response.json({ error: "Untrusted origin" }, { status: 403 });
  }

  const user = await requireAppUser();
  if (user.role !== "influencer") {
    if (!shouldReturnJson) {
      return Response.redirect(`${origin}/dashboard?youtubeSync=forbidden`, 302);
    }
    return Response.json({ error: "Only influencers can ingest metrics" }, { status: 403 });
  }

  const result = await ingestYoutubeMetricsForUser(user.id);

  if (!result.ok) {
    if (!shouldReturnJson) {
      const code =
        result.error === "YouTube not connected" ? "not-connected" : "sync-failed";
      return Response.redirect(`${origin}/dashboard?youtubeSync=${code}`, 302);
    }
    return Response.json(
      { error: result.error },
      { status: result.error === "YouTube not connected" ? 400 : 502 },
    );
  }

  if (!shouldReturnJson) {
    return Response.redirect(`${origin}/influencer?youtubeSync=success`, 302);
  }

  return Response.json({ metric: result.metric });
}
