import { useHackathon } from "@/hooks/use-hackathon";
import { cn } from "@/lib/utils";
import { DevelopingPolaroid } from "./developing-polaroid";

type Step = 1 | 2 | 3 | 4;

interface PolaroidStackProps {
  step: Step;
  className?: string;
}

const POLAROID_NAMES = [
  { name: "basic-info.png", rotation: 0 },
  { name: "skills.png", rotation: 10 },
  { name: "questionnaire.png", rotation: -12 },
  { name: "review.png", rotation: -4 },
] as const;

/**
 * Displays a stack of polaroids that develop as the user progresses through steps
 *
 * @param step - The current step of the application
 * @param className - Additional CSS classes to apply to the polaroid stack
 */
export function PolaroidStack({ step, className }: PolaroidStackProps) {
  const { activeHackathon } = useHackathon();

  const polaroids = POLAROID_NAMES.map((p) => ({
    src: `/assets/${activeHackathon}/polaroids/${p.name}`,
    rotation: p.rotation,
  }));

  return (
    <div className={cn("relative", className)}>
      {polaroids.slice(0, step).map((polaroid, index) => {
        const polaroidStep = index + 1;
        const isCurrentStep = polaroidStep === step;
        const isPreviousStep = polaroidStep < step;

        return (
          <DevelopingPolaroid
            key={polaroid.src}
            src={polaroid.src}
            rotation={polaroid.rotation}
            trigger={isCurrentStep}
            developed={isPreviousStep}
            falling={isCurrentStep}
            delay={isCurrentStep ? 300 : 0}
            className={cn("w-full", index > 0 && "absolute inset-0")}
          />
        );
      })}
    </div>
  );
}
