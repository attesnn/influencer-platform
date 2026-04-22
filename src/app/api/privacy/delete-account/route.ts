import { prisma } from "@/lib/prisma";
import { requireAppUser } from "@/lib/auth";

export async function DELETE() {
  const user = await requireAppUser();
  await prisma.user.delete({ where: { id: user.id } });
  return Response.json({ success: true });
}
