import { buildYoutubeAuthUrl } from "@/lib/youtube";
import { requireAppUser } from "@/lib/auth";

export async function GET() {
  const user = await requireAppUser();

  const state = Buffer.from(JSON.stringify({ appUserId: user.id, t: Date.now() })).toString("base64url");
  const authUrl = buildYoutubeAuthUrl(state);
  return Response.redirect(authUrl, 302);
}
