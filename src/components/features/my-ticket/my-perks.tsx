import { Button } from "@/components/ui/button";
import { type Perk, sponsorName } from "@/lib/promotions";
import { cn } from "@/lib/utils";
import { Check, Copy, ExternalLink, Gift } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface MyPerksProps {
  perks: Perk[];
  /** the promotion id currently being claimed, if any */
  claimingId: string | null;
  onClaim: (perk: Perk) => void;
}

/**
 * Sponsor perks under the ticket. Renders nothing when there is nothing to show;
 * the parent decides that via getPerks()
 */
export function MyPerks({ perks, claimingId, onClaim }: MyPerksProps) {
  if (perks.length === 0) return null;

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-6">
      <div className="flex items-center gap-2">
        <Gift size={20} aria-hidden="true" />
        <h2 className="font-semibold text-text-primary text-xl">My perks</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {perks.map((perk) => (
          <PerkCard
            key={perk.promotionId}
            perk={perk}
            claiming={claimingId === perk.promotionId}
            onClaim={() => onClaim(perk)}
          />
        ))}
      </div>
    </section>
  );
}

function PerkCard({
  perk,
  claiming,
  onClaim,
}: {
  perk: Perk;
  claiming: boolean;
  onClaim: () => void;
}) {
  const { promotion, claim } = perk;

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-xl border border-border-subtle p-5 [background:var(--background-translucent-card)]",
        claim && "border-border-active",
      )}
    >
      <div className="flex flex-col gap-1">
        <p className="text-text-secondary text-xs">Sponsor perk</p>
        <h3 className="font-semibold text-lg text-text-primary">{sponsorName(promotion)}</h3>
      </div>
      {promotion.instructions && (
        <p className="whitespace-pre-line text-sm text-text-secondary">{promotion.instructions}</p>
      )}
      {claim ? (
        <ClaimedCode code={claim.code} redemptionUrl={claim.redemption_url} />
      ) : (
        <Button
          type="button"
          variant="primary"
          className="w-fit"
          disabled={claiming}
          onClick={onClaim}
        >
          {claiming ? "Claiming..." : "Claim code"}
        </Button>
      )}
    </div>
  );
}

function ClaimedCode({ code, redemptionUrl }: { code: string; redemptionUrl: string }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timeout = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timeout);
  }, [copied]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
    } catch {
      toast.error("Couldn't copy. Select the code and copy it manually.");
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3 rounded-lg border border-border-subtle bg-bg-dropdown-selected px-4 py-3">
        <code className="select-all break-all font-mono text-base text-text-primary">{code}</code>
        <button
          type="button"
          onClick={copy}
          aria-label={copied ? "Copied" : "Copy code"}
          className="shrink-0 cursor-pointer text-text-secondary transition-colors hover:text-text-primary"
        >
          {copied ? <Check size={18} /> : <Copy size={18} />}
        </button>
      </div>
      {redemptionUrl && (
        <a
          href={redemptionUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex w-fit items-center gap-1 text-sm text-text-accent hover:underline"
        >
          Redeem <ExternalLink size={14} aria-hidden="true" />
        </a>
      )}
    </div>
  );
}
