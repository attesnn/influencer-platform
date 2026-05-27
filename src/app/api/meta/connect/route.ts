import { cookies } from "next/headers";
import { requireAppUser } from "@/lib/auth";
import { createSignedMetaState } from "@/lib/security";
import { buildMetaAuthUrl } from "@/lib/meta";

export async function GET() {
  const user = await requireAppUser();
  if (user.role !== "influencer") {
    return Response.json({ error: "Only influencers can connect Meta" }, { status: 403 });
  }

  const state = createSignedMetaState(user.id);
  const cookieStore = await cookies();
  cookieStore.set("meta_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 10 * 60,
  });

  return Response.redirect(buildMetaAuthUrl(state), 302);
}
