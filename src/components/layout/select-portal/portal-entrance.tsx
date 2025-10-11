import { cn } from "@/lib/utils";
import { SubHeader } from "../../typography";
import { buttonVariants } from "../../ui/button";
import { Lumination } from "../../visual/lumination";

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

export function PortalEntrance({
  logo,
  hackathon,
  href,
  dates,
  isUpNext,
  isPassed,
  website,
  gradients,
  index,
}: PortalEntranceProps) {
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
          "md:-translate-x-1/2 md:-translate-y-1/2 absolute inset-0 top-1/2 left-1/2 z-0 overflow-visible opacity-70 md:scale-100",
          !!isUpNext && "-translate-x-1/2 -translate-y-1/2 scale-80",
          !isUpNext && index === 2 && "-translate-x-[80%] -translate-y-[30%] scale-60",
          !isUpNext && index !== 2 && "-translate-x-[10%] -translate-y-[50%] scale-50",
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

        <div className="flex w-full select-none flex-col items-center">
          <div className="pb-0 md:pb-2">
            {isUpNext ? "Applications open!" : isPassed ? "Portal closed" : "Opening soon"}
          </div>
          {isUpNext ? (
            <a href={href} className={buttonVariants({ variant: "ethereal" })}>
              Enter portal
            </a>
          ) : (
            <></>
          )}
          {website && (
            <a
              href={website}
              target="_blank"
              rel="noreferrer noopener"
              className={cn(buttonVariants({ variant: "link" }), "pb-0 opacity-70")}
            >
              Visit website
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
