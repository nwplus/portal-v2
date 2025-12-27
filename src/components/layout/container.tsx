import { cn } from "@/lib/utils";

// In order to maintain consistency of the fixed-width page content
export function Container({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("mx-auto w-full px-6 py-16 md:max-w-3xl md:px-0 lg:max-w-5xl", className)}
      {...props}
    />
  );
}
