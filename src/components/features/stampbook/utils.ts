import type { StampWithUnlockState } from "@/lib/firebase/types/stamps";

/**
 * Represents a spread (two pages shown together) in the stampbook
 * Each page can contain up to 4 stamps except for the title page, which holds one.
 */
export interface StampbookSpread {
  leftPage: StampWithUnlockState[];
  rightPage: StampWithUnlockState[];
  isTitleSpread: boolean;
}

/**
 * Organizes stamps into spreads for the stampbook display.
 * 
 * First spread: Hackathon stamp on left (title page), first 4 stamps on right
 * Subsequent spreads: 4 stamps per page, 8 stamps per spread
 * 
 * @param stamps - Array of stamps to organize
 * @param hackathonStamp - Optional dedicated hackathon stamp for the title page
 * @returns array of spreads
 */
export function organizeIntoSpreads(
  stamps: StampWithUnlockState[],
  hackathonStamp?: StampWithUnlockState
): StampbookSpread[] {
  if (stamps.length === 0 && !hackathonStamp) {
    return [];
  }

  const spreads: StampbookSpread[] = [];
  
  let titleStamp = hackathonStamp;
  let remainingStamps = stamps;
  
  if (!titleStamp && stamps.length > 0) {
    titleStamp = stamps[0];
    remainingStamps = stamps.slice(1);
  }

  const firstRightPageStamps = remainingStamps.slice(0, 4);
  spreads.push({
    leftPage: titleStamp ? [titleStamp] : [],
    rightPage: firstRightPageStamps,
    isTitleSpread: true,
  });

  const afterFirstPage = remainingStamps.slice(4);
  
  for (let i = 0; i < afterFirstPage.length; i += 8) {
    const leftPageStamps = afterFirstPage.slice(i, i + 4);
    const rightPageStamps = afterFirstPage.slice(i + 4, i + 8);
    
    if (leftPageStamps.length > 0 || rightPageStamps.length > 0) {
      spreads.push({
        leftPage: leftPageStamps,
        rightPage: rightPageStamps,
        isTitleSpread: false,
      });
    }
  }

  return spreads;
}

/**
 * Gets the total number of stamps across all spreads
 */
export function getTotalStampSlots(spreads: StampbookSpread[]): number {
  return spreads.reduce((total, spread) => {
    return total + spread.leftPage.length + spread.rightPage.length;
  }, 0);
}

