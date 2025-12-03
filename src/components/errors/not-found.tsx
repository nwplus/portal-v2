import { Link, useCanGoBack, useRouter } from "@tanstack/react-router";
import { Button } from "../ui/button";

export default function NotFound() {
  const router = useRouter();
  const canGoBack = useCanGoBack(); // true when user navigates here, false when user directly enters a bad URL

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="flex flex-col gap-2 text-center">
        <h1 className="font-semibold text-2xl">Page not found</h1>
        {canGoBack ? (
          // theoretically won't ever be hit because of type safety LOL
          <Button variant="link" onClick={() => router.history.back()}>
            Go back
          </Button>
        ) : (
          <Button asChild variant="link">
            <Link to="/" preload="intent">
              Return to home
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}
