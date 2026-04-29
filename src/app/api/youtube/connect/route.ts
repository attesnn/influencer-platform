import { buildYoutubeAuthUrl } from "@/lib/youtube";
import { requireAppUser } from "@/lib/auth";
import { createSignedYoutubeState } from "@/lib/security";

export async function GET() {
  const user = await requireAppUser();

  const state = createSignedYoutubeState(user.id);
  const authUrl = buildYoutubeAuthUrl(state);
  return Response.redirect(authUrl, 302);
}
