import { describeCardStatus, getChallengeCardState } from "@/lib/ctf";
import type { CtfChallenge, CtfSolve } from "@/lib/firebase/types/ctf";
import { cn } from "@/lib/utils";

interface ChallengeCardProps {
  challenge: CtfChallenge;
  solve?: CtfSolve;
  stampImgURL?: string;
}

export function ChallengeCard({ challenge, solve, stampImgURL }: ChallengeCardProps) {
  const state = getChallengeCardState(challenge, Boolean(solve));
  const status = describeCardStatus(state, challenge, solve);

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-xl border border-border-subtle p-5 [background:var(--background-translucent-card)]",
        state === "solved" && "border-border-active",
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <p className="text-text-secondary text-xs">Day {challenge.order}</p>
          <h2 className="font-semibold text-lg text-text-primary">
            {challenge.title ?? "Coming soon"}
          </h2>
        </div>
        {state === "solved" && stampImgURL && (
          <img src={stampImgURL} alt="" className="size-12 object-contain" />
        )}
      </div>
      {challenge.description && (
        <p className="whitespace-pre-line text-sm text-text-secondary">{challenge.description}</p>
      )}
      {challenge.link && (
        <a
          href={challenge.link}
          target="_blank"
          rel="noreferrer"
          className="text-sm text-text-accent hover:underline"
        >
          Open challenge →
        </a>
      )}
      {state !== "comingSoon" && <p className="font-medium text-sm text-text-primary">{status}</p>}
    </div>
  );
}
