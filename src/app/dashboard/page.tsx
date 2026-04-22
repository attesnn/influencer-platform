import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { RoleSetup } from "@/components/RoleSetup";

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) {
    return <main className="p-8">Unauthorized</main>;
  }

  const user = await prisma.user.findUnique({ where: { clerkUserId: userId } });

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-4 px-6 py-8">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      {!user ? (
        <RoleSetup />
      ) : (
        <>
          <p className="text-zinc-600 dark:text-zinc-300">
            Logged in as <span className="font-semibold">{user.role}</span>
          </p>
          <div className="flex gap-3">
            {user.role === "influencer" ? (
              <Link className="rounded bg-black px-3 py-2 text-white" href="/influencer">
                Influencer workspace
              </Link>
            ) : (
              <Link className="rounded bg-black px-3 py-2 text-white" href="/agency">
                Agency workspace
              </Link>
            )}
          </div>
        </>
      )}
    </main>
  );
}
