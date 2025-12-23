import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface GradientBackgroundProps {
  gradientPosition: "bottomMiddle" | "bottomRight" | "topMiddle" | "topLeft";
  children: ReactNode;
  className?: string;
}

const GRADIENTS = {
  bottomMiddle: "bg-radial-gradient-bottom-middle",
  topMiddle: "bg-radial-gradient-top-middle",
  bottomRight: "bg-radial-gradient-bottom-right",
  topLeft: "bg-radial-gradient-top-left",
};

/**
 * Creates the background with various gradient positions
 * - bottomMiddle: default background
 * - bottomRight: application pages
 * - topMiddle: rsvp page
 * - topLeft: schedule page
 * @param gradientPosition - The position of the gradient (there are 4 positions)
 * @param children - The children to render
 * @returns
 */
export function GradientBackground({
  gradientPosition,
  children,
  className,
}: GradientBackgroundProps) {
  return <div className={cn("h-full", GRADIENTS[gradientPosition], className)}>{children}</div>;
}
