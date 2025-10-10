import { VALID_HACKATHONS } from "@/lib/constants";
import type { Hackathon } from "@/lib/firebase/types";
import { useAuthStore } from "@/lib/stores/auth-store";
import { usePortalStore } from "@/lib/stores/portal-store";
import { cn } from "@/lib/utils";
import { parseDbCollectionName, subscribeToHackathons } from "@/services/latest-hackathons";
import { useEffect, useState } from "react";
import {
  CmdFIcon,
  FacebookIcon,
  HackCampIcon,
  InstagramIcon,
  LinkedInIcon,
  NwHacksIcon,
  NwPlusIcon,
} from "../icons";
import { PageHeader, SubHeader } from "../typography";
import { buttonVariants } from "../ui/button";
import Lumination from "../ui/lumination";

const NWPLUS_SOCIALS = [
  {
    icon: FacebookIcon,
    href: "https://www.facebook.com/nwplusubc",
  },
  {
    icon: InstagramIcon,
    href: "https://www.instagram.com/nwplusubc/",
  },
  {
    icon: LinkedInIcon,
    href: "https://www.linkedin.com/company/nwplus",
  },
];

export const generatePortals = (hackathons: Hackathon[]) => {
  const hackathonTypes = VALID_HACKATHONS.options;
  const hackathonNext = usePortalStore((state) => state.upNextHackathon);
  const hackathonWebsites = usePortalStore((state) => state.hackathonWebsite);
  const hackathonDates = usePortalStore((state) => state.hackathonWeekend);
  // TODO: we can add these gradients to the portal doc; waiting for later
  //    features to see what would make the most sense for how these colors
  //    will exist in the doc.
  const hackathonGradients = {
    hackcamp: ["#AF6D30", "#AF7A30", "#494E1C"],
    nwhacks: ["#592463", "#AF4B50", "#551860"],
    "cmd-f": ["#0B6596", "#44855D", "#56BEBE"],
  };

  const getHackathonIcon = (hackathonId: string): React.ComponentType => {
    const lowerName = hackathonId.toLowerCase();
    if (lowerName.includes("nwhacks")) return NwHacksIcon;
    if (lowerName.includes("cmd-f")) return CmdFIcon;
    if (lowerName.includes("hackcamp")) return HackCampIcon;
    return NwHacksIcon;
  };

  const portals = hackathonTypes
    .map(
      (type) =>
        hackathons
          .filter((h) => h._id.toLowerCase().startsWith(type.toLowerCase()))
          .sort((a, b) => {
            const yearA = Number.parseInt(a._id.match(/\d{4}$/)?.[0] || "0");
            const yearB = Number.parseInt(b._id.match(/\d{4}$/)?.[0] || "0");
            return yearB - yearA;
          })[0],
    )
    .filter(Boolean)
    .map((hackathon, index) => {
      const hackathonName = parseDbCollectionName(hackathon._id).displayNameShort;
      const validHackathonName = hackathonName.toLowerCase() as keyof typeof hackathonNext;
      return {
        order: index + 1,
        hackathon: hackathonName,
        href: `/${hackathonName}`,
        id: hackathon._id,
        logo: getHackathonIcon(hackathon._id),
        dates: hackathonDates ? hackathonDates[validHackathonName] : "",
        isUpNext: hackathonNext ? hackathonNext[validHackathonName] : false,
        website: hackathonWebsites ? hackathonWebsites[validHackathonName] : "",
        gradients: hackathonGradients ? hackathonGradients[validHackathonName] : [],
      };
    });

  return portals;
};

export function PortalsScreen() {
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);
  const [hackathons, setHackathons] = useState<Hackathon[]>([]);

  useEffect(() => {
    const unsubHackathons = subscribeToHackathons((hackathons: Hackathon[]) => {
      setHackathons(hackathons);
    });
    return () => unsubHackathons();
  }, []);

  const portals = generatePortals(hackathons);

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden">
      <div className="absolute top-0 left-0 z-0 h-full w-full select-none overflow-hidden object-cover opacity-10">
        {/* biome-ignore lint/a11y/noSvgWithoutTitle: to hide browser tooltip */}
        <svg
          className="h-full w-full"
          preserveAspectRatio="none"
          viewBox="0 0 800 800"
          xmlns="http://www.w3.org/2000/svg"
        >
          <filter id="noiseFilter">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="55"
              numOctaves="3"
              stitchTiles="stitch"
            />
          </filter>
          <rect width="100%" height="100%" filter="url(#noiseFilter)" />
        </svg>
      </div>
      <div className="absolute top-0 left-0 z-10 flex w-full justify-between p-6">
        <div className="opacity-50">
          <NwPlusIcon />
        </div>
        <div className="flex items-center gap-2">
          {NWPLUS_SOCIALS.map((s) => {
            const LogoComponent = s.icon;
            return (
              <a
                key={s.href}
                href={s.href}
                target="_blank"
                rel="noreferrer noopener"
                className="opacity-50 transition-all hover:opacity-100"
              >
                <LogoComponent />
              </a>
            );
          })}
        </div>
      </div>

      <div className="absolute top-0 w-full pt-20 md:pt-30">
        <PageHeader className="text-center font-mono font-semibold tracking-tight">
          select a portal
        </PageHeader>
      </div>

      <div className="flex h-full w-full flex-col justify-center overflow-hidden px-0 md:px-6">
        <div className="flex w-full flex-col gap-3 md:flex-row">
          {portals?.map((h) => (
            <PortalEntrance {...h} key={h.hackathon} />
          ))}
        </div>
      </div>

      <div className="absolute bottom-10 flex w-full flex-col items-center opacity-50">
        <div>Signed in as {user?.email}</div>
        <div className="flex gap-1">
          <div>Not you?</div>
          <button type="button" onClick={logout} className="underline">
            Log out
          </button>
        </div>
      </div>
    </div>
  );
}

function PortalEntrance({
  order,
  logo,
  hackathon,
  href,
  dates,
  isUpNext,
  website,
  gradients,
}: {
  order: number;
  logo: React.ComponentType;
  hackathon: string;
  href: string;
  dates: string;
  isUpNext: boolean;
  website: string;
  gradients?: string[];
}) {
  const LogoComponent = logo;

  return (
    <div
      className={cn(
        "group relative z-100 flex w-full flex-col items-center transition-all md:order-0",
        !isUpNext && "order-10 h-[100px] md:h-auto",
      )}
    >
      <Lumination
        name={hackathon}
        count={gradients?.length ?? 3}
        colors={gradients ?? ["#AF6D30", "#AF7A30", "#494E1C"]}
        seed={(hackathon?.length ?? 2) + 7}
        width={500}
        height={500}
        className={cn(
          "-translate-x-1/2 -translate-y-1/2 absolute inset-0 top-1/2 left-1/2 z-0 overflow-visible opacity-70 md:scale-100",
          !isUpNext ? "opacity-0 md:opacity-70" : "scale-80",
        )}
      />
      <div
        className={cn(
          "relative flex flex-col items-center gap-8",
          !isUpNext && "w-full flex-row md:w-auto md:flex-col",
        )}
      >
        <div
          className={cn(
            "flex w-full flex-col items-center",
            !isUpNext && "scale-60 opacity-80 md:scale-100 md:opacity-100",
          )}
        >
          <div className="flex aspect-square h-[80px] scale-90 items-center justify-center">
            <LogoComponent />
          </div>
          <SubHeader className="font-semibold text-3xl">{hackathon}</SubHeader>
          <div className="font-medium text-lg">{dates}</div>
        </div>

        <div className="flex w-full flex-col items-center gap-2">
          <div>{isUpNext ? "Applications open!" : "Portal closed"}</div>
          {website ? (
            <a
              href={website}
              target="_blank"
              rel="noreferrer noopener"
              className={buttonVariants({ variant: "ethereal" })}
            >
              Visit website
            </a>
          ) : (
            <></>
          )}
          {isUpNext ? (
            <a href={href} className={buttonVariants({ variant: "ethereal" })}>
              Enter portal
            </a>
          ) : (
            <></>
          )}
        </div>
      </div>
    </div>
  );
}
