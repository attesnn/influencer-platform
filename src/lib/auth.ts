import { UserRole } from "@prisma/client";
import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function requireAppUser() {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  const dbUser = await prisma.user.findUnique({ where: { clerkUserId: userId } });
  if (!dbUser) {
    throw new Error("App user not initialized");
  }
  return dbUser;
}

export async function ensureUserInDb(role?: UserRole) {
  const clerkUser = await currentUser();
  if (!clerkUser || !clerkUser.id || !clerkUser.emailAddresses[0]?.emailAddress) {
    throw new Error("Missing authenticated user");
  }

  const email = clerkUser.emailAddresses[0].emailAddress;
  return prisma.user.upsert({
    where: { clerkUserId: clerkUser.id },
    update: role ? { role } : {},
    create: {
      clerkUserId: clerkUser.id,
      email,
      role: role ?? UserRole.influencer,
    },
  });
}
