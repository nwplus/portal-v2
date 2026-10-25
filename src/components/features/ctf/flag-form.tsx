import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { type FormEvent, useState } from "react";

interface FlagFormProps {
  submitting: boolean;
  /** resolves true when the flag solved a challenge, so the input can be cleared */
  onSubmit: (flag: string) => Promise<boolean>;
}

export function FlagForm({ submitting, onSubmit }: FlagFormProps) {
  const [flag, setFlag] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!flag.trim() || submitting) return;
    const solved = await onSubmit(flag);
    if (solved) setFlag("");
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
      <Input
        value={flag}
        onChange={(event) => setFlag(event.target.value)}
        placeholder="hc26{...}"
        aria-label="Flag"
        autoComplete="off"
        spellCheck={false}
        maxLength={200}
        disabled={submitting}
      />
      <Button type="submit" variant="primary" disabled={submitting || !flag.trim()}>
        {submitting ? "Checking..." : "Submit flag"}
      </Button>
    </form>
  );
}
