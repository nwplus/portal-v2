import { GradientBackground } from "@/components/layout/gradient-background";
import { Button } from "@/components/ui/button";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/$activeHackathon/_auth/(internal)/charcuterie")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <GradientBackground gradientPosition="bottomMiddle">
      <div className="container mx-auto space-y-12 py-12">
        <div>
          <h1 className="mb-2 font-bold text-4xl">Components Charcuterie</h1>
          <p className="text-lg text-muted-foreground">
            A collection of all common UI components and their variants
          </p>
        </div>

        {/* Buttons Section */}
        <section className="space-y-8">
          <div>
            <h2 className="mb-1 font-semibold text-2xl">Buttons</h2>
            <p className="text-muted-foreground">All button variants and sizes</p>
          </div>

          {/* Variants */}
          <div className="space-y-4">
            <h3 className="font-medium text-lg">Variants</h3>
            <div className="flex flex-wrap items-center gap-4">
              <Button variant="primary">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="tertiary">Tertiary</Button>
              <Button variant="error">Error</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="ghost-error">Ghost Error</Button>
              <Button variant="link">Link</Button>
              <Button variant="ethereal">Ethereal</Button>
            </div>
          </div>

          {/* Sizes */}
          <div className="space-y-4">
            <h3 className="font-medium text-lg">Sizes</h3>
            <div className="flex flex-wrap items-center gap-4">
              <Button size="sm">Small</Button>
              <Button size="default">Default</Button>
              <Button size="lg">Large</Button>
              <Button size="icon" aria-label="Add item">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </Button>
            </div>
          </div>

          {/* Disabled States */}
          <div className="space-y-4">
            <h3 className="font-medium text-lg">Disabled States</h3>
            <div className="flex flex-wrap items-center gap-4">
              <Button variant="primary" disabled>
                Primary
              </Button>
              <Button variant="secondary" disabled>
                Secondary
              </Button>
              <Button variant="tertiary" disabled>
                Tertiary
              </Button>
              <Button variant="ghost" disabled>
                Ghost
              </Button>
            </div>
          </div>
        </section>
      </div>
    </GradientBackground>
  );
}
