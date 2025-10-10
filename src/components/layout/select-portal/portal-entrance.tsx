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
  website: string;
  gradients?: string[];
};

export function PortalEntrance({
  logo,
  hackathon,
  href,
  dates,
  isUpNext,
  website,
  gradients,
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
          {website && (
            <a
              href={website}
              target="_blank"
              rel="noreferrer noopener"
              className={buttonVariants({ variant: "ethereal" })}
            >
              Visit website
            </a>
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
