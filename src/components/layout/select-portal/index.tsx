import { VALID_HACKATHONS } from "@/lib/constants";
import type { Hackathon } from "@/lib/firebase/types";
import { useAuthStore } from "@/lib/stores/auth-store";
import { usePortalStore } from "@/lib/stores/portal-store";
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
} from "../../icons";
import { PageHeader } from "../../typography";
import { PortalEntrance } from "./portal-entrance";

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

export function SelectPortal() {
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);
  const [hackathons, setHackathons] = useState<Hackathon[]>([]);

  useEffect(() => {
    const unsubHackathons = subscribeToHackathons((hackathons: Hackathon[]) => {
      setHackathons(hackathons);
    });
    return () => unsubHackathons();
  }, []);

  const portals = useGeneratedPortals(hackathons);

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

/**
 * A utility function that fetches necessary data used to
 *  present the three nwPlus hackathons of the current season.
 *
 * @param hackathons - hackathons from firestore
 * @returns the current season's three hackathons
 */
const useGeneratedPortals = (hackathons: Hackathon[]) => {
  const hackathonTypes = VALID_HACKATHONS.options;
  const hackathonWebsites = usePortalStore((state) => state.hackathonWebsite);
  const hackathonDates = usePortalStore((state) => state.hackathonWeekend);
  const upNextHackathon = usePortalStore((state) => state.upNextHackathon);
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
    .map((hackathon) => {
      const hackathonName = parseDbCollectionName(hackathon._id).displayNameShort;
      const validHackathonName = hackathonName.toLowerCase() as keyof typeof upNextHackathon;
      return {
        hackathon: hackathonName,
        href: `/${hackathonName}`,
        id: hackathon._id,
        logo: getHackathonIcon(hackathon._id),
        dates: hackathonDates ? hackathonDates[validHackathonName] : "",
        website: hackathonWebsites ? hackathonWebsites[validHackathonName] : "",
        gradients: hackathonGradients ? hackathonGradients[validHackathonName] : [],
        isUpNext: upNextHackathon ? upNextHackathon[validHackathonName] : false,
      };
    });

  return portals;
};
