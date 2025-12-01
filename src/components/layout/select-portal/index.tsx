import { usePortalTheme } from "@/hooks/use-portal-theme";
import { VALID_HACKATHONS } from "@/lib/constants";
import type { Hackathon } from "@/lib/firebase/types";
import { useAuthStore } from "@/lib/stores/auth-store";
import { usePortalStore } from "@/lib/stores/portal-store";
import { getHackathonIcon } from "@/lib/utils";
import { parseDbCollectionName, subscribeToHackathons } from "@/services/latest-hackathons";
import { useEffect, useState } from "react";
import { FacebookIcon, InstagramIcon, LinkedInIcon, NwPlusIcon } from "../../icons";
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
  const titleGradientStyle = usePortalTextGradientStyle();

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden">
      <div className="absolute top-0 left-0 z-10 flex w-full justify-between p-[clamp(1rem,4vw,1.5rem)]">
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
      <div className="absolute top-[clamp(1.5rem,4vw,2.5rem)] w-full pt-[clamp(3rem,8vw,7.5rem)]">
        <PageHeader className="select-none text-center font-mono font-semibold tracking-tight">
          select a <span style={titleGradientStyle}>portal</span>
        </PageHeader>
      </div>
      <div className="select-portal flex h-full w-full flex-col justify-center overflow-hidden px-0 pt-[clamp(2rem,5vw,5rem)] md:px-6 md:pt-0">
        <div className="portals flex w-full flex-col gap-[clamp(3rem,6vh,4rem)] sm:gap-[clamp(1.5rem,4vw,2.5rem)] md:flex-row md:gap-3">
          {portals?.map((h) => (
            <PortalEntrance {...h} key={h.hackathon} />
          ))}
        </div>
      </div>
      {!!user && (
        <div className="absolute bottom-[clamp(1.5rem,4vw,2.5rem)] z-100 flex w-full select-none flex-col items-center text-xs opacity-50 sm:text-lg">
          <div>Signed in as {user?.email}</div>
          <div className="flex gap-1">
            <div>Not you?</div>
            <button type="button" onClick={logout} className="cursor-pointer hover:underline">
              Log out
            </button>
          </div>
        </div>
      )}
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
  const hackathonWeekend = usePortalStore((state) => state.hackathonWeekend);
  const hackathonStart = usePortalStore((state) => state.hackathonStart);
  const upNextHackathon = usePortalStore((state) => state.upNextHackathon);
  const portalTheme = usePortalTheme();

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
      const hackathonId = hackathonName.toLowerCase() as keyof typeof upNextHackathon;

      const hackathonStartDate = hackathonStart ? new Date(hackathonStart[hackathonId]) : null;
      const dates =
        hackathonWeekend && hackathonStartDate
          ? `${hackathonWeekend ? hackathonWeekend[hackathonId] : ""}, ${hackathonStartDate.getFullYear()}`
          : "";
      const isPassed = hackathonStartDate ? hackathonStartDate.getTime() < Date.now() : false;

      return {
        hackathon: hackathonName,
        href: `/${hackathonName.toLowerCase()}`,
        id: hackathon._id,
        logo: getHackathonIcon(hackathon._id),
        dates,
        website: hackathonWebsites ? hackathonWebsites[hackathonId] : "",
        gradients: portalTheme ? portalTheme[hackathonId].portalGradient : [],
        portalSvg: portalTheme ? portalTheme[hackathonId].portalSvg : "",
        isUpNext: upNextHackathon ? upNextHackathon[hackathonId] : false,
        isPassed,
        index,
      };
    });

  return portals;
};

/**
 * Used to turn a text glowy and gradient using first color of
 *  each hackathon gradients. For glow to work properly, the
 *  gradient color must be in hex format.
 *
 * @returns an inline style object to turn a text gradient
 */
const usePortalTextGradientStyle = () => {
  const portalTheme = usePortalTheme();
  if (!portalTheme) return undefined;
  const hackathons = VALID_HACKATHONS.options;
  const gradients = [];
  for (let i = 0; i < 3; i++) {
    const hackathon = hackathons[i];
    gradients.push((portalTheme[hackathon].portalGradient ?? ["#FFFFFF"])[0]);
  }
  return {
    background: `linear-gradient(135deg, ${gradients[0]} 0%, ${gradients[1]} 50%, ${gradients[2]} 100%)`,
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    WebkitTextFillColor: "transparent",
    color: "transparent",
    filter: "brightness(1.5)",
    textShadow: `0 0 10px ${gradients[1]}50, 0 0 20px ${gradients[1]}50, 0 0 30px ${gradients[1]}50`,
  };
};
