import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useAttendance } from "@/hooks/use-attendance";
import { getAttendanceBrands } from "@/lib/attendance";

interface HackathonBadgesProps {
  uid: string;
  size?: "sm" | "md"; // TODO: maybe remove if no other use case
}

const BADGES = [
  { key: "hackcamp" as const, icon: "/assets/profiles/mini-hackcamp.svg", label: "HackCamp" },
  { key: "nwhacks" as const, icon: "/assets/profiles/mini-nwhacks.svg", label: "nwHacks" },
  { key: "cmd-f" as const, icon: "/assets/profiles/mini-cmdf.svg", label: "cmd-f" },
];

export function HackathonBadges({ uid, size = "sm" }: HackathonBadgesProps) {
  const attendance = useAttendance(uid);
  if (attendance.status !== "success") return null;

  const brands = getAttendanceBrands(attendance.records);
  const attendedBadges = BADGES.filter((badge) => brands.has(badge.key));
  if (attendedBadges.length === 0) return null;

  const iconSize = size === "sm" ? "h-5 w-auto" : "h-6 w-auto";

  return (
    <div className="flex items-center gap-1.5">
      {attendedBadges.map((badge) => (
        <Tooltip key={badge.key}>
          <TooltipTrigger asChild>
            <img src={badge.icon} alt={badge.label} className={iconSize} />
          </TooltipTrigger>
          <TooltipContent>Attended {badge.label}</TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}
