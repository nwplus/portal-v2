import { Badge } from "@/components/ui/badge";
import { Ticket } from "@/components/visual/ticket";
import type { Applicant } from "@/lib/firebase/types/applicants";
import { cn } from "@/lib/utils";
import QRCode from "react-qr-code";

const formatFullname = (first?: string, last?: string) => {
  if (!first && !last) return "Hacker";
  return first && last ? `${first} ${last}` : `${first || last}`;
};

export function HackerTicket({
  applicant,
}: {
  applicant: Applicant | null;
}) {
  const qrData = applicant?._id;

  return (
    <div className="flex flex-col items-center">
      <Ticket>
        <div className="flex h-full items-center">
          <img
            className="hidden h-full md:block"
            draggable={false}
            src="/assets/ticket/ticket-decal.svg"
          />
          <div className="flex flex-col gap-2 self-end p-10 font-mono md:self-center md:p-0">
            <Badge className="border-[#E4E4E730] bg-[#693F61] uppercase">Hacker</Badge>
            <div className="flex flex-col">
              <div className={cn("font-bold text-3xl md:text-4xl")}>
                {formatFullname(
                  applicant?.basicInfo?.legalFirstName,
                  applicant?.basicInfo?.legalLastName,
                )}
              </div>
              <div>{applicant?.basicInfo?.pronouns ?? "No pronouns"}</div>
            </div>
            <div>{applicant?.basicInfo?.email ?? "No email"}</div>
          </div>
        </div>
        <div className="absolute top-0 right-0 flex aspect-square h-auto w-full items-center justify-center p-10 md:h-full md:w-auto md:p-14">
          <QRCode
            size={256}
            style={{ height: "auto", maxWidth: "100%", width: "100%" }}
            viewBox="0 0 256 256"
            value={qrData ?? ""}
            bgColor="rgba(0,0,0,0)"
            fgColor="white"
          />
        </div>
      </Ticket>
    </div>
  );
}
