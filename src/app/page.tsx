import SocialLoginPreview from "@/components/SocialLoginPreview";

export default function Home() {
  const providers = [
    {
      name: "Continue with Google / YouTube",
      hint: "Fast start for creators and channel analytics",
      badge: "Primary",
    },
    {
      name: "Continue with Meta",
      hint: "Connect Instagram/Facebook data in one profile",
    },
    {
      name: "Continue with TikTok",
      hint: "Include short-form audience and growth signals",
    },
  ];

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-10 px-6 py-12 md:py-16">
      <section className="max-w-3xl space-y-4">
        <p className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Social-first onboarding
        </p>
        <h1 className="text-3xl font-bold leading-tight md:text-5xl">
          Connect your social accounts in one flow.
        </h1>
        <p className="text-base text-zinc-600 dark:text-zinc-300 md:text-lg">
          Start with the platform you already use. Then link additional accounts to
          unify your creator data and improve campaign matching quality.
        </p>
      </section>

      <SocialLoginPreview providers={providers} />

      <section className="grid gap-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-900/40 md:grid-cols-2 md:gap-6 md:p-6">
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">Link more accounts after signup</h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-300">
            Users can start with one provider, then connect YouTube, Meta, and TikTok
            profiles in settings to build a complete cross-platform view.
          </p>
        </div>
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">Why this helps the dataset</h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-300">
            Multi-platform links reduce duplicate profiles, enrich audience insights,
            and improve downstream matching and analytics quality.
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 p-5 dark:border-zinc-800 md:p-6">
        <h2 className="text-lg font-semibold">What happens next</h2>
        <ol className="mt-3 grid gap-2 text-sm text-zinc-600 dark:text-zinc-300">
          <li>1. Start with one social account.</li>
          <li>2. Finish role setup and workspace onboarding.</li>
          <li>3. Link additional platforms to enrich your profile data.</li>
        </ol>
      </section>
    </main>
  );
}
