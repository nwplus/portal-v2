import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";
import { buttonVariants } from "../ui/button";

/**
 * 404 for the public share route.
 *
 * Deliberately separate from `not-found.tsx`: that component calls `useHackathon()`,
 * which reads `/$activeHackathon`'s route context and throws anywhere outside that
 * subtree. `/wrapped/view/$shareId` is top-level and reachable by logged-out visitors,
 * so a bad share id has to land somewhere that assumes no hackathon and no auth.
 */
export default function ShareNotFound() {
  return (
    <div className="flex h-dvh flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="font-semibold text-3xl text-text-primary">This link isn&apos;t working</h1>
      <p className="max-w-md text-text-secondary">
        That Hacker Wrapped link is invalid or has expired. Ask whoever shared it for a new one.
      </p>
      <Link to="/" className={cn(buttonVariants({ variant: "secondary" }))}>
        Go to the portal
      </Link>
    </div>
  );
}
