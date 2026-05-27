import { cookies } from "next/headers";
import { requireAppUser } from "@/lib/auth";
import { createSignedTiktokState } from "@/lib/security";
import { buildTiktokAuthUrl } from "@/lib/tiktok";

export async function GET() {
  const user = await requireAppUser();
  if (user.role !== "influencer") {
    return Response.json({ error: "Only influencers can connect TikTok" }, { status: 403 });
  }

  const state = createSignedTiktokState(user.id);
  const cookieStore = await cookies();
  cookieStore.set("tiktok_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 10 * 60,
  });

  return Response.redirect(buildTiktokAuthUrl(state), 302);
}
