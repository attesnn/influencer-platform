import { prisma } from "@/lib/prisma";
import { requireAppUser } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requestHasTrustedOrigin } from "@/lib/security";

export async function DELETE(request: Request) {
  const user = await requireAppUser();
  if (!requestHasTrustedOrigin(request)) {
    return Response.json({ error: "Untrusted request origin" }, { status: 403 });
  }

  if (user.authUserId) {
    const supabaseAdmin = createSupabaseAdminClient();
    const { error } = await supabaseAdmin.auth.admin.deleteUser(user.authUserId);
    if (error) {
      return Response.json({ error: "Failed to delete auth identity" }, { status: 500 });
    }
  }

  await prisma.user.delete({ where: { id: user.id } });
  return Response.json({ success: true });
}
