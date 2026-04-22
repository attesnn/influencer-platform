import { NextRequest, NextResponse } from "next/server";
import { refreshSupabaseSession } from "@/lib/supabase/middleware";

const protectedPrefixes = ["/dashboard", "/influencer", "/agency", "/api"];
const publicApiPrefixes = ["/api/youtube/callback"];

export default async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const shouldProtect = protectedPrefixes.some((prefix) => path.startsWith(prefix));
  const isPublicApi = publicApiPrefixes.some((prefix) => path.startsWith(prefix));

  const { response, user } = await refreshSupabaseSession(request);

  if (!shouldProtect || isPublicApi) {
    return response;
  }

  if (!user) {
    if (path.startsWith("/api")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const signInUrl = new URL("/sign-in", request.url);
    signInUrl.searchParams.set("redirect", path);
    return NextResponse.redirect(signInUrl);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)", "/", "/(api|trpc)(.*)"],
};
