import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import { useHackathon } from "@/hooks/use-hackathon";
import { useHackathonInfo } from "@/hooks/use-hackathon-info";
import { usePortalStore } from "@/lib/stores/portal-store";

export function ApplicationFaqs() {
  const { activeHackathon } = useHackathon();
  const { displayNameFull } = useHackathonInfo();
  const sendAcceptancesBy = usePortalStore((state) => state.sendAcceptancesBy?.[activeHackathon]);
  const hackathonStart = usePortalStore((state) => state.hackathonStart?.[activeHackathon]);
  const hackathonMonth = hackathonStart
    ? new Date(hackathonStart).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : null;
  return (
    <>
      <Separator className="w-full bg-border-subtle" />
      <div className="w-full">
        <h2 className="mb-2 font-medium text-lg">FAQs</h2>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="hear-back">
            <AccordionTrigger>When and how will I hear back?</AccordionTrigger>
            <AccordionContent>
              We will send out all acceptances by {sendAcceptancesBy} via email. Make sure to check
              your inbox (and spam folder) regularly for updates from us!
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="qualifications">
            <AccordionTrigger>What are the qualifications to hack?</AccordionTrigger>
            <AccordionContent>
              You must be a current student or have graduated within one year of{" "}
              {hackathonMonth ?? displayNameFull}. All skill levels are welcome — from first-time
              hackers to experienced developers!
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="questions">
            <AccordionTrigger>I still have questions, who can I reach out to?</AccordionTrigger>
            <AccordionContent>
              Please reach out to{" "}
              <a href={`mailto:${activeHackathon}@nwplus.io`} className="offset-4 underline">
                {activeHackathon}@nwplus.io
              </a>{" "}
              and we will be happy to help you out!
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </>
  );
}
