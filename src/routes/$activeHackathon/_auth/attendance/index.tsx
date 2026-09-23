import { GradientBackground } from "@/components/layout/gradient-background";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/lib/stores/auth-store";
import { fireSideCannons, getEventName } from "@/lib/utils";
import { markPreHackathonAttendance } from "@/services/attendance";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AlertTriangle, CheckCircle2, Clock3 } from "lucide-react";
import { useEffect } from "react";

type ScanResult = {
  status: "success" | "alreadyMarked" | "missingParams" | "error";
  eventName: string;
};

export const Route = createFileRoute("/$activeHackathon/_auth/attendance/")({
  validateSearch: (search) => ({
    event: typeof search.event === "string" && search.event !== "" ? search.event : undefined,
    name: typeof search.name === "string" && search.name !== "" ? search.name : undefined,
  }),
  loaderDeps: ({ search }) => ({ event: search.event, name: search.name }),
  loader: async ({ context, deps }): Promise<ScanResult> => {
    if (!deps.event || !deps.name) {
      return { status: "missingParams", eventName: "" };
    }

    const { user } = useAuthStore.getState();
    const uid = user?.uid;

    if (!context.dbCollectionName || !uid) {
      return { status: "missingParams", eventName: "" };
    }

    try {
      const result = await markPreHackathonAttendance(
        context.dbCollectionName,
        uid,
        deps.event,
        deps.name,
      );
      return {
        status: result.alreadyMarked ? "alreadyMarked" : "success",
        eventName: result.eventName,
      };
    } catch {
      return { status: "error", eventName: deps.name };
    }
  },
  component: RouteComponent,
});

function RouteComponent() {
  const scan = Route.useLoaderData();
  const { activeHackathon } = Route.useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (scan.status === "success") {
      fireSideCannons(activeHackathon);
    }
  }, [scan, activeHackathon]);

  if (scan.status === "error") {
    return (
      <GradientBackground gradientPosition="bottomMiddle">
        <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
          <AlertTriangle className="size-12 text-text-secondary" />
          <h1 className="font-semibold text-2xl text-text-primary md:text-4xl">
            Couldn&apos;t mark you attended
          </h1>
          <p className="max-w-md text-text-secondary">
            Something went wrong while checking you in for{" "}
            <span className="font-medium">{scan.eventName}</span>. Check your connection and try
            scanning the QR again.
          </p>
        </div>
      </GradientBackground>
    );
  }

  if (scan.status === "missingParams") {
    return (
      <GradientBackground gradientPosition="bottomMiddle">
        <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
          <Clock3 className="size-12 text-text-secondary" />
          <h1 className="font-semibold text-2xl text-text-primary md:text-4xl">
            This link is missing a workshop
          </h1>
          <p className="max-w-md text-text-secondary">
            It looks like this attendance link is incomplete. Scan the QR code at the workshop to
            mark your attendance.
          </p>
        </div>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground gradientPosition="bottomMiddle">
      <div className="flex h-full flex-col items-center justify-center gap-6 px-6 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-bg-button-secondary">
          <CheckCircle2 className="size-10 text-text-accent" />
        </div>

        {scan.status === "alreadyMarked" ? (
          <>
            <h1 className="font-semibold text-2xl text-text-primary md:text-4xl">
              You're already marked attended!
            </h1>
            <p className="max-w-md text-text-secondary">
              You've already been checked in for{" "}
              <span className="font-medium">{scan.eventName}</span>.
            </p>
          </>
        ) : (
          <>
            <h1 className="font-semibold text-2xl text-text-primary md:text-4xl">
              {getEventName("workshops")} attendance confirmed!
            </h1>
            <p className="max-w-md text-text-secondary">
              You've been marked attended for{" "}
              <span className="font-medium text-text-primary">{scan.eventName}</span>. See you
              there!
            </p>
          </>
        )}

        <Button
          variant="primary"
          size="lg"
          onClick={() =>
            navigate({
              to: "/$activeHackathon/my-ticket",
              params: { activeHackathon },
            })
          }
        >
          Go to my ticket
        </Button>
      </div>
    </GradientBackground>
  );
}
