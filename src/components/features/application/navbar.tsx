import { Button } from "@/components/ui/button";
import { useHackathon } from "@/hooks/use-hackathon";
import { useApplicantStore } from "@/lib/stores/applicant-store";
import { useAuthStore } from "@/lib/stores/auth-store";
import { getHackathonIcon } from "@/lib/utils";
import { Link, useNavigate } from "@tanstack/react-router";

interface ApplicationNavbarProps {
  saving?: boolean;
  variant: "application-step" | "index";
}

export function Navbar({ saving = false, variant }: ApplicationNavbarProps) {
  const { activeHackathon } = useHackathon();
  const LogoIcon = getHackathonIcon(activeHackathon);
  const dirty = useApplicantStore((s) => s.dirty);
  const lastLocalSaveAt = useApplicantStore((s) => s.lastLocalSaveAt);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate({ to: "/" });
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  };

  const statusText = saving
    ? "Saving…"
    : dirty
      ? "Unsaved changes"
      : lastLocalSaveAt
        ? `✓ Autosaved on ${formatTime(lastLocalSaveAt)}`
        : "Autosaved";

  if (variant === "index") {
    return (
      <nav className="mx-auto mb-6 flex w-full items-center">
        <div className="flex-1">
          <Button
            variant="ghost"
            asChild
            className="text-text-secondary hover:text-text-secondary/80"
          >
            <Link to="/">
              &lt; Back to Portal
            </Link>
          </Button>
        </div>

        <div className="flex-1 text-right">
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="text-text-secondary hover:text-text-secondary/80"
          >
            Logout
          </Button>
        </div>
      </nav>
    );
  }

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
