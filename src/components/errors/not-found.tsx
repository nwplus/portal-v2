import { Link, useCanGoBack, useRouter } from "@tanstack/react-router";

const LINK_STYLES =
  "text-sm text-primary underline hover:text-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export default function NotFound() {
  const router = useRouter();
  const canGoBack = useCanGoBack(); // true when user navigates here, false when user directly enters a bad URL

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="flex flex-col gap-2 text-center">
        <h1 className="font-semibold text-2xl">Page not found</h1>
        {canGoBack ? (
          <button onClick={() => router.history.back()} type="button" className={LINK_STYLES}>
            Go back
          </button>
        ) : (
          <Link to="/" className={LINK_STYLES} preload="intent">
            Return to home
          </Link>
        )}
      </div>
    </div>
  );
}
