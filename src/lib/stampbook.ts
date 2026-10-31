export function pointsLabel(points: number): string {
  return `${points} ${points === 1 ? "point" : "points"}`;
}

export function raffleEntriesLabel(points: number): string {
  return `${points} raffle ${points === 1 ? "entry" : "entries"}`;
}

/**
 * The value shown on a stamp. 0-point stamps show nothing, and so do past stampbooks, which don't
 * set `pointValue`
 */
export function stampValueLabel(pointValue: number | undefined): string | undefined {
  if (!pointValue) return undefined;
  return `${pointValue} ${pointValue === 1 ? "pt" : "pts"}`;
}
