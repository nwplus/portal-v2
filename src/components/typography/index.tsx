import { cn } from "@/lib/utils";

function PageHeader({ className, ...props }: React.ComponentProps<"h1">) {
  return <h1 className={cn("font-bold text-3xl", className)} {...props} />;
}

function SubHeader({ className, ...props }: React.ComponentProps<"h1">) {
  return <h2 className={cn("font-bold text-2xl", className)} {...props} />;
}

export { PageHeader, SubHeader };
