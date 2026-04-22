import { auth } from "@clerk/nextjs/server";
import { buildYoutubeAuthUrl } from "@/lib/youtube";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const state = Buffer.from(JSON.stringify({ userId, t: Date.now() })).toString("base64url");
  const authUrl = buildYoutubeAuthUrl(state);
  return Response.redirect(authUrl, 302);
}
