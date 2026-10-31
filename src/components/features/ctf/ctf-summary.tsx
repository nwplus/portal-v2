import { summarizeSolves } from "@/lib/ctf";
import type { CtfSolve } from "@/lib/firebase/types/ctf";

interface CtfSummaryProps {
  solves: CtfSolve[];
  challengeCount: number;
}

export function CtfSummary({ solves, challengeCount }: CtfSummaryProps) {
  const { points, solved } = summarizeSolves(solves);

  return (
    <div className="flex gap-8 rounded-xl border border-border-subtle px-5 py-4 [background:var(--background-translucent-card)]">
      <div className="flex flex-col">
        <span className="text-text-secondary text-xs">Points</span>
        <span className="font-semibold text-2xl text-text-primary">{points}</span>
      </div>
      <div className="flex flex-col">
        <span className="text-text-secondary text-xs">Stamps</span>
        <span className="font-semibold text-2xl text-text-primary">
          {solved}/{challengeCount}
        </span>
      </div>
    </div>
  );
}
