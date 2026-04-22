import { NextRequest } from "next/server";
import { roleSchema } from "@/lib/validators";
import { ensureUserInDb } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const payload = await request.json();
  const parsed = roleSchema.safeParse(payload);
  if (!parsed.success) {
    return Response.json({ error: "Invalid role payload" }, { status: 400 });
  }

  const user = await ensureUserInDb(parsed.data.role);
  return Response.json({ user });
}
