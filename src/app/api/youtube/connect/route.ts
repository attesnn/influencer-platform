import { cookies } from "next/headers";
import { buildYoutubeAuthUrlWithPkce } from "@/lib/youtube";
import { requireAppUser } from "@/lib/auth";
import { createPkceChallenge, createPkceVerifier, createSignedYoutubeState } from "@/lib/security";

export async function GET() {
  const user = await requireAppUser();
  if (user.role !== "influencer") {
    return Response.json({ error: "Only influencers can connect YouTube" }, { status: 403 });
  }

  const codeVerifier = createPkceVerifier();
  const codeChallenge = createPkceChallenge(codeVerifier);
  const state = createSignedYoutubeState(user.id);
  const cookieStore = await cookies();
  cookieStore.set("yt_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 10 * 60,
  });
  cookieStore.set("yt_oauth_pkce", codeVerifier, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 10 * 60,
  });

  const authUrl = buildYoutubeAuthUrlWithPkce(state, codeChallenge);
  return Response.redirect(authUrl, 302);
}
