import Link from "next/link";

type SocialProvider = {
  name: string;
  hint: string;
  badge?: string;
};

type SocialLoginPreviewProps = {
  providers: SocialProvider[];
};

function ProviderIcon({ providerName }: { providerName: string }) {
  if (providerName.includes("Google")) {
    return (
      <span
        aria-hidden="true"
        className="grid h-10 w-10 place-items-center rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-5 w-5"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1 .67-2.28 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
      </span>
    );
  }

  if (providerName.includes("Meta")) {
    return (
      <span
        aria-hidden="true"
        className="grid h-10 w-10 place-items-center rounded-lg border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-950"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5">
          <path
            fill="#0866FF"
            d="M18.2 8.3c-1.1-1.4-2.3-2.1-3.5-2.1-1.3 0-2.3.7-3.4 2.4l-.9 1.4-.8-1.4c-1-1.7-2.1-2.4-3.4-2.4-1.2 0-2.4.7-3.5 2.1C1.6 9.8 1 11.6 1 13.4c0 2.8 1.8 4.8 4.1 4.8 1.4 0 2.5-.7 3.7-2.7l1-1.8 1 1.8c1.1 2 2.2 2.7 3.7 2.7 2.3 0 4.1-2 4.1-4.8 0-1.8-.6-3.6-1.4-5.1Zm-2.7 7.2c-.7 0-1.2-.3-2-1.7l-1.9-3.3a1 1 0 0 0-1.8 0l-1.9 3.3c-.8 1.4-1.3 1.7-2 1.7-1 0-1.8-.9-1.8-2.2 0-1.1.4-2.2 1-3 .5-.7 1-1 1.5-1 .6 0 1.1.4 1.8 1.6l1.8 3.1a1 1 0 0 0 1.8 0l1.8-3.1c.7-1.2 1.2-1.6 1.8-1.6.5 0 1 .3 1.5 1 .6.8 1 1.9 1 3 0 1.3-.8 2.2-1.8 2.2Z"
          />
        </svg>
      </span>
    );
  }

  return (
    <span
      aria-hidden="true"
      className="grid h-10 w-10 place-items-center rounded-lg border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-950"
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5">
        <path
          fill="#000000"
          d="M19.6 8.5c-1.2 0-2.2-.4-3-1.2v6.1c0 3-2.5 5.5-5.5 5.5A5.5 5.5 0 0 1 8 8.8v3.1a2.4 2.4 0 1 0 3.3 2.2V2.9h3.1a4 4 0 0 0 3.2 2.6V8.5Z"
        />
      </svg>
    </span>
  );
}

export default function SocialLoginPreview({ providers }: SocialLoginPreviewProps) {
  return (
    <section
      aria-label="Sign in options preview"
      className="grid gap-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 md:p-6"
    >
      {providers.map((provider) => {
        const isGoogleProvider = provider.name.includes("Google");

        if (isGoogleProvider) {
          return (
            <Link
              key={provider.name}
              href="/sign-in"
              className="flex w-full items-start justify-between rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-left transition hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800"
              aria-label={`${provider.name} (active)`}
            >
              <span className="flex items-start gap-3">
                <ProviderIcon providerName={provider.name} />
                <span className="space-y-1">
                  <span className="block text-sm font-semibold md:text-base">{provider.name}</span>
                  <span className="block text-xs text-zinc-500 dark:text-zinc-400 md:text-sm">
                    {provider.hint}
                  </span>
                </span>
              </span>
              <span className="rounded-full border border-zinc-300 px-2 py-0.5 text-xs text-zinc-500 dark:border-zinc-600 dark:text-zinc-400">
                Continue
              </span>
            </Link>
          );
        }

        return (
          <button
            key={provider.name}
            type="button"
            disabled
            className="flex w-full items-start justify-between rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-left transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-100 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800"
            aria-label={`${provider.name} (UI preview only, not active yet)`}
          >
            <span className="flex items-start gap-3">
              <ProviderIcon providerName={provider.name} />
              <span className="space-y-1">
                <span className="block text-sm font-semibold md:text-base">{provider.name}</span>
                <span className="block text-xs text-zinc-500 dark:text-zinc-400 md:text-sm">
                  {provider.hint}
                </span>
              </span>
            </span>
            <span className="rounded-full border border-zinc-300 px-2 py-0.5 text-xs text-zinc-500 dark:border-zinc-600 dark:text-zinc-400">
              {provider.badge ?? "Soon"}
            </span>
          </button>
        );
      })}

      <Link
        href="/sign-in"
        className="mt-2 w-full rounded-xl border border-dashed border-zinc-300 px-4 py-3 text-center text-sm text-zinc-500 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-900"
        aria-label="Continue with email"
      >
        Prefer email? Continue with email (secondary option)
      </Link>
    </section>
  );
}
