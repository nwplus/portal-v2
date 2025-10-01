import type { Hackathon } from "@/lib/firebase/types";
import { useAuthStore } from "@/lib/stores/auth-store";
import { subscribeToHackathons } from "@/services/latest-hackathons";
import { useEffect, useState } from "react";
import { CmdFIcon, HackCampIcon, NwHacksIcon } from "../icons";
import { PageHeader, SubHeader } from "../typography";

export const generatePortals = (hackathons: Hackathon[]) => {
  const hackathonTypes = ["HackCamp", "nwHacks", "cmd-f"];

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
      const hackathonName = hackathon._id.replace(/\d{4}$/, "");
      return {
        hackathon: hackathonName,
        href: `/${hackathonName}`,
        id: hackathon._id,
        logo: getHackathonIcon(hackathon._id),
        dates: "",
        // TODO: seems like open status has been moved to a separate www hackathon collection (why?) -- this line needs to be changed
        isOpen: hackathon.featureFlags?.registrationOpen ?? hackathon.featureFlags?.isOpen ?? false,
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
    <div className="relative h-screen w-full">
      <img
        src="/noise.svg"
        alt="White noise for texturing background"
        className="absolute top-0 left-0 z-0 h-full w-full select-none object-cover opacity-40"
        draggable={false}
      />

      <div className="absolute top-0 left-0 flex w-full justify-between p-6">
        <div>Logo here</div>
        <div className="flex items-center gap-2">
          <div>Socials here</div>
          <button
            type="button"
            onClick={logout}
            className="rounded bg-red-500 px-4 py-2 text-white hover:bg-red-600"
          >
            Logout {user?.email}
          </button>
        </div>
      </div>

      <div className="flex h-full w-full flex-col justify-center px-6">
        <PageHeader className="pb-12 text-center">Select a portal</PageHeader>
        <div className="grid grid-cols-3 gap-3 pb-12">
          {portals?.map((h) => (
            <PortalEntrance {...h} key={h.hackathon} />
          ))}
        </div>
      </div>
    </div>
  );
}

function PortalEntrance({
  logo,
  hackathon,
  href,
  dates,
  isOpen,
}: {
  logo: React.ComponentType;
  hackathon: string;
  href: string;
  dates: string;
  isOpen: boolean;
}) {
  const LogoComponent = logo;

  return (
    <a href={href} className="z-100 flex flex-col items-center">
      <div className="flex flex-col items-center gap-2">
        <div className="flex aspect-square max-w-[100px] scale-90 items-center justify-center">
          <LogoComponent />
        </div>
        <SubHeader>{hackathon}</SubHeader>
        <div>{dates}</div>
      </div>
      <div>Portal here</div>
      {isOpen ? <div>open</div> : <></>}
    </a>
  );
}
