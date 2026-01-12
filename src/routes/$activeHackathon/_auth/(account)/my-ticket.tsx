import { Countdown } from "@/components/features/my-ticket/countdown";
import { Message } from "@/components/features/my-ticket/message";
import { Ticket } from "@/components/features/my-ticket/ticket";
import { GradientBackground } from "@/components/layout/gradient-background";
import { useHackerStore } from "@/lib/stores/hacker-store";
import { createFileRoute } from "@tanstack/react-router";
import { toPng } from "html-to-image";
import { Download } from "lucide-react";
import { useRef } from "react";

export const Route = createFileRoute("/$activeHackathon/_auth/(account)/my-ticket")({
  component: RouteComponent,
});

function RouteComponent() {
  const hacker = useHackerStore((state) => state.hacker);
  const ticketRef = useRef<HTMLDivElement>(null);

  if (!hacker) return null;

  const downloadTicket = async () => {
    if (!ticketRef.current) return;

    const dataUrl = await toPng(ticketRef.current);
    const link = document.createElement("a");
    link.download = `${hacker.basicInfo.preferredName || hacker.basicInfo.legalFirstName}${hacker.basicInfo.legalLastName}-QRCode.png`;
    link.href = dataUrl;
    link.click();
  };

  return (
    <GradientBackground gradientPosition="bottomMiddle">
      <div className="flex flex-col gap-10 py-10 md:py-12">
        <Countdown />
        <Message applicant={hacker} />
        <div className="flex flex-col items-center justify-center gap-10 xl:flex-row">
          <div ref={ticketRef}>
            <Ticket applicant={hacker} />
          </div>
          <div className="flex flex-col items-center">
            <button
              type="button"
              onClick={downloadTicket}
              className="h-[46px] w-[46px] rounded-lg border border-[#E4E4E740] bg-[#262626] px-3 py-2"
            >
              <Download size={22} />
            </button>
          </div>
        </div>
      </div>
    </GradientBackground>
  );
}
