import { useHackathon } from "@/hooks/use-hackathon";
import { useApplicantStore } from "@/lib/stores/applicant-store";
import { getHackathonIcon } from "@/lib/utils";
import { Link } from "@tanstack/react-router";

interface ApplicationNavbarProps {
  saving: boolean;
}

export function Navbar({ saving }: ApplicationNavbarProps) {
  const { activeHackathon } = useHackathon();
  const LogoIcon = getHackathonIcon(activeHackathon);
  const dirty = useApplicantStore((s) => s.dirty);
  const lastLocalSaveAt = useApplicantStore((s) => s.lastLocalSaveAt);

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  };

  const statusText = saving
    ? "Saving…"
    : dirty
      ? "Unsaved changes"
      : lastLocalSaveAt
        ? `Autosaved at ${formatTime(lastLocalSaveAt)}`
        : "Autosaved";

  return (
    <nav className="mx-auto mb-6 flex w-[95%] items-center">
      <div className="flex-1">
        <Link
          to="/$activeHackathon/application"
          params={{ activeHackathon }}
          className="text-sm text-text-secondary transition-colors hover:text-text-secondary/80"
        >
          &lt; Exit application
        </Link>
      </div>

      <div className="size-6">
        <LogoIcon />
      </div>

      <div className="flex-1 text-right text-sm">{statusText}</div>
    </nav>
  );
}
