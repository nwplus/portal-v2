import { FAQGrid } from "@/components/features/faqs/faq-grid";
import { Container } from "@/components/layout/container";
import { GradientBackground } from "@/components/layout/gradient-background";
import { Input } from "@/components/ui/input";
import { fetchFaqs } from "@/services/faqs";
import { createFileRoute } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/$activeHackathon/(information)/faqs")({
  loader: async ({ context }) => {
    const { dbCollectionName } = context;
    if (!dbCollectionName) {
      return { faqs: null };
    }

    const faqs = await fetchFaqs(dbCollectionName);
    return { faqs };
  },
  component: () => <RouteComponent />,
});

function RouteComponent() {
  const { faqs } = Route.useLoaderData();

  const [search, setSearch] = useState<string>("");

  return (
    <GradientBackground gradientPosition="bottomMiddle">
      <Container className="flex flex-col gap-12">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
          <div className="flex flex-col gap-4">
            <h1 className="text-3xl">Frequently asked questions</h1>
            <p className="text-sm">Can't find what you're looking or?</p>
            <p className="pb-2 text-sm">
              Ask <code>#ask-organizers</code> in Discord, find us at the Help Desk, or ask any
              organizer wearing an nwPlus sweater during the hackathon!
            </p>
            <div className="relative">
              <label
                htmlFor="faq-search"
                className="absolute top-0 left-2 flex h-full items-center justify-center opacity-50"
              >
                <Search className="h-4 w-4 " />
              </label>
              <Input
                id="faq-search"
                name="faq-search"
                className="pl-7"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search for a keyword"
                type="text"
              />
            </div>
          </div>
        </div>
        <FAQGrid faqs={faqs} search={search} />
      </Container>
    </GradientBackground>
  );
}
