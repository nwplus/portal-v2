import { cmdfPortal } from "@/components/visual/cmdf-portal";
import { HackCampPortal } from "@/components/visual/hackcamp-portal";
import { nwHacksPortal } from "@/components/visual/nwhacks-portal";
import { cn } from "@/lib/utils";
import { SubHeader } from "../../typography";
import { Button } from "../../ui/button";
// import { Lumination } from "../../visual/lumination";

type PortalEntranceProps = {
  logo: React.ComponentType;
  hackathon: string;
  href: string;
  dates: string;
  isUpNext: boolean;
  isPassed: boolean;
  website: string;
  gradients?: string[];
  index?: number;
};

const HACKATHON_TO_GRADIENT: Record<string, React.ComponentType> = {
  "cmd-f": cmdfPortal,
  HackCamp: HackCampPortal,
  nwHacks: nwHacksPortal,
};

export function PortalEntrance({
  logo,
  hackathon,
  href,
  dates,
  isUpNext,
  isPassed,
  website,
  // gradients,
  index,
}: PortalEntranceProps) {
  const LogoComponent = logo;
  const PortalComponent = HACKATHON_TO_GRADIENT[hackathon];

  return (
    <div
      className={cn(
        "group relative z-100 flex w-full flex-col items-center transition-all md:order-0",
        !isUpNext && "order-10 h-[clamp(4rem,12vw,6rem)] md:h-auto",
      )}
    >
      <div
        className={cn(
          "md:-translate-x-1/2 md:-translate-y-1/2 absolute inset-0 top-1/2 left-1/2 z-0 h-full w-full overflow-visible opacity-70 md:scale-100",
          isUpNext && "-translate-x-1/2 -translate-y-1/2 scale-80",
          !isUpNext && "hidden md:block",
          !isUpNext && index === 2 && "-translate-x-[80%] -translate-y-[30%] scale-60",
          !isUpNext && index !== 2 && "-translate-x-[10%] -translate-y-[50%] scale-50",
        )}
      >
        <div className="group relative flex h-full w-full scale-110 items-center justify-center transition-all duration-700 group-hover:scale-120 group-hover:brightness-125 ">
          <PortalComponent />
        </div>
      </div>
      {/* Keeping this here in case we want to go back to dynamic portals */}
      {/* <Lumination
        name={hackathon}
        count={gradients?.length ?? 3}
        colors={gradients ?? ["#AF6D30", "#AF7A30", "#494E1C"]}
        seed={(hackathon?.length ?? 2) + 5}
        width={500}
        height={1000}
        className={cn(
          "md:-translate-x-1/2 md:-translate-y-1/2 absolute inset-0 top-1/2 left-1/2 z-0 overflow-visible opacity-70 md:scale-100",
          !!isUpNext && "-translate-x-1/2 -translate-y-1/2 scale-80",
          !isUpNext && index === 2 && "-translate-x-[80%] -translate-y-[30%] scale-60",
          !isUpNext && index !== 2 && "-translate-x-[10%] -translate-y-[50%] scale-50",
        )}
      /> */}
      <div
        className={cn(
          "relative flex flex-col items-center gap-[clamp(1rem,3vw,1.5rem)]",
          !isUpNext && "w-full flex-row md:w-auto md:flex-col",
        )}
      >
        <div
          className={cn(
            "flex w-full flex-col items-center",
            !isUpNext && "scale-60 opacity-80 md:scale-100 md:opacity-100",
          )}
        >
          <div className="mb-[clamp(0.75rem,3vw,1.5rem)] flex aspect-square h-[clamp(2.5rem,8vw,4.5rem)] scale-90 items-center justify-center">
            <LogoComponent />
          </div>
          <SubHeader className="font-semibold text-[4vh] sm:text-4xl md:text-3xl">{hackathon}</SubHeader>
          <div className="text-center font-medium text-[2.5vh] sm:text-lg">{dates}</div>
        </div>

        <div className="flex w-full select-none flex-col items-center">
          <div className="pb-2 md:pb-2 text-[2vh] sm:text-lg">
            {isUpNext ? "Applications open!" : isPassed ? "Portal closed" : "Opening soon"}
          </div>
          {isUpNext && (
            <Button variant="ethereal" className="z-101" asChild>
              <a href={href}>Enter portal</a>
            </Button>
          )}
          {website && (
            <Button variant="link" className="z-101 pb-0 opacity-70 text-[1.75vh] sm:text-sm" asChild>
              <a href={website} target="_blank" rel="noreferrer noopener">
                Visit website
              </a>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
