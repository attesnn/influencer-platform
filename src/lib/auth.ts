import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type AuthenticatedIdentity = {
  id: string;
  email: string;
};

export async function getAuthenticatedIdentity(): Promise<AuthenticatedIdentity> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user || !user.email) {
    throw new Error("Unauthorized");
  }

  return { id: user.id, email: user.email };
}

export async function requireAppUser() {
  const identity = await getAuthenticatedIdentity();

  const dbUser = await prisma.user.findFirst({
    where: {
      OR: [{ authUserId: identity.id }, { clerkUserId: identity.id }],
    },
  });
  if (!dbUser) {
    throw new Error("App user not initialized");
  }

  if (dbUser.authUserId !== identity.id) {
    return prisma.user.update({
      where: { id: dbUser.id },
      data: { authUserId: identity.id, email: identity.email },
    });
  }

  return dbUser;
}

export async function ensureUserInDb(role?: UserRole) {
  const identity = await getAuthenticatedIdentity();

  const existing = await prisma.user.findFirst({
    where: {
      OR: [
        { authUserId: identity.id },
        { email: identity.email },
        // During migration, some rows may still be keyed by legacy clerkUserId.
        { clerkUserId: identity.id },
      ],
    },
  });

  if (existing) {
    return prisma.user.update({
      where: { id: existing.id },
      data: {
        authUserId: identity.id,
        email: identity.email,
        ...(role ? { role } : {}),
      },
    });
  }

  return prisma.user.create({
    data: {
      authUserId: identity.id,
      // Keep legacy non-null column unique without colliding with old Clerk IDs.
      clerkUserId: `supabase:${identity.id}`,
      email: identity.email,
      role: role ?? UserRole.influencer,
    },
  });
}
