import { GradientBackground } from "@/components/layout/gradient-background";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dropdown } from "@/components/ui/dropdown";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/$activeHackathon/_auth/(internal)/charcuterie")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <GradientBackground gradientPosition="bottomMiddle" className="px-10">
      <div className="container mx-auto space-y-12 py-12">
        <div>
          <h1 className="mb-2 font-bold text-4xl">Charcuterie</h1>
          <p className="text-lg text-text-secondary">
            A collection of all common UI components and their variants
          </p>
        </div>

        {/* Buttons Section */}
        <section className="space-y-8">
          <div>
            <h2 className="mb-1 font-semibold text-2xl">Buttons</h2>
            <p className="text-text-secondary">All button variants and sizes</p>
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

        {/* Inputs Section */}
        <section className="space-y-8">
          <div>
            <h2 className="mb-1 font-semibold text-2xl">Inputs</h2>
            <p className="text-text-secondary">Common states and configurations</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="input-default" className="font-medium text-sm text-text-primary">
                Default
              </label>
              <Input id="input-default" placeholder="Enter text" />
              <p className="text-sm text-text-secondary">Standard input with placeholder text.</p>
            </div>

            <div className="space-y-2">
              <label htmlFor="input-disabled" className="font-medium text-sm text-text-primary">
                Disabled
              </label>
              <Input id="input-disabled" placeholder="Cannot edit" disabled />
              <p className="text-sm text-text-secondary">
                Use for read-only or unavailable fields.
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="input-error" className="font-medium text-sm text-text-primary">
                Error
              </label>
              <Input
                id="input-error"
                placeholder="Email address"
                type="email"
                defaultValue="invalid@email"
                aria-invalid="true"
              />
              <p className="text-sm text-text-error">Please provide a valid email.</p>
            </div>

            <div className="space-y-2">
              <label htmlFor="input-password" className="font-medium text-sm text-text-primary">
                Password
              </label>
              <Input id="input-password" placeholder="Enter password" type="password" />
              <p className="text-sm text-text-secondary">Password input with hidden characters.</p>
            </div>
          </div>
        </section>

        {/* Tooltips Section */}
        <section className="space-y-8">
          <div>
            <h2 className="mb-1 font-semibold text-2xl">Tooltips</h2>
            <p className="text-text-secondary">Tooltip styling and variants</p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="secondary">Hover me</Button>
              </TooltipTrigger>
              <TooltipContent>Tooltip content</TooltipContent>
            </Tooltip>
          </div>
        </section>

        {/* Checkboxes Section */}
        <section className="space-y-8">
          <div>
            <h2 className="mb-1 font-semibold text-2xl">Checkboxes</h2>
            <p className="text-text-secondary">Checkbox states and configurations</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <div className="font-medium text-sm text-text-primary">Default</div>
              <div className="flex items-center gap-2">
                <Checkbox id="checkbox-default" />
                <label htmlFor="checkbox-default" className="text-sm">
                  Unchecked checkbox
                </label>
              </div>
              <p className="text-sm text-text-secondary">Standard unchecked checkbox.</p>
            </div>

            <div className="space-y-2">
              <div className="font-medium text-sm text-text-primary">Checked</div>
              <div className="flex items-center gap-2">
                <Checkbox id="checkbox-checked" defaultChecked />
                <label htmlFor="checkbox-checked" className="text-sm">
                  Checked checkbox
                </label>
              </div>
              <p className="text-sm text-text-secondary">Checkbox in checked state.</p>
            </div>

            <div className="space-y-2">
              <div className="font-medium text-sm text-text-primary">Disabled</div>
              <div className="flex items-center gap-2">
                <Checkbox id="checkbox-disabled" disabled />
                <label htmlFor="checkbox-disabled" className="text-sm text-text-secondary">
                  Disabled checkbox
                </label>
              </div>
              <p className="text-sm text-text-secondary">Use for unavailable options.</p>
            </div>

            <div className="space-y-2">
              <div className="font-medium text-sm text-text-primary">Error State</div>
              <div className="flex items-center gap-2">
                <Checkbox id="checkbox-error" aria-invalid="true" />
                <label htmlFor="checkbox-error" className="text-sm text-text-secondary">
                  Accept terms and conditions
                </label>
              </div>
              <p className="text-sm text-text-error">Please accept the terms to continue.</p>
            </div>
          </div>
        </section>

        {/* Combobox Section */}
        <section className="space-y-8 pb-96">
          <div>
            <h2 className="mb-1 font-semibold text-2xl">Combobox</h2>
            <p className="text-text-secondary">Searchable select dropdown</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <DropdownExample />
            <DropdownErrorExample />
          </div>
        </section>
      </div>
    </GradientBackground>
  );
}

function DropdownExample() {
  const [selectedFruit, setSelectedFruit] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      <Dropdown
        label="Choose a fruit"
        items={[
          "Apple",
          "Banana",
          "Orange",
          "Pineapple",
          "Grape",
          "Mango",
          "Strawberry",
          "Blueberry",
          "Raspberry",
          "Blackberry",
        ]}
        value={selectedFruit}
        onValueChange={setSelectedFruit}
      />
      <p className="text-sm text-text-secondary">Simple string array with search functionality.</p>
    </div>
  );
}

function DropdownErrorExample() {
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [hasError, setHasError] = useState(true);

  useEffect(() => {
    if (selectedCountry) {
      setHasError(false);
    }
  }, [selectedCountry]);

  return (
    <div className="space-y-2">
      <div className={hasError ? "[&_input]:!border-border-danger" : ""}>
        <Dropdown
          label="Select your country"
          items={["Canada", "United States", "Mexico", "United Kingdom", "France", "Germany"]}
          value={selectedCountry}
          onValueChange={setSelectedCountry}
        />
      </div>
      {hasError && <p className="text-sm text-text-error">Please select a country.</p>}
      {!hasError && (
        <p className="text-sm text-text-secondary">Error state clears when a selection is made.</p>
      )}
    </div>
  );
}
