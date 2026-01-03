import { type Timestamp, doc, onSnapshot } from "firebase/firestore";
import type z from "zod";
import { create } from "zustand";
import type { VALID_HACKATHONS } from "../constants";
import { db } from "../firebase/client";
import type { HackathonPortalTheme } from "../firebase/types";

type HackathonsFlagMap = Record<z.infer<typeof VALID_HACKATHONS>, boolean>;
type HackathonsInfoMap = Record<z.infer<typeof VALID_HACKATHONS>, string>;
type HackathonsDataMap = Record<z.infer<typeof VALID_HACKATHONS>, Record<string, string>>;

export interface NotionLinks {
  hackerPackageIFrame: string;
  preHackathonWorkshops: string;
}

type HackathonsNotionLinksMap = Record<z.infer<typeof VALID_HACKATHONS>, NotionLinks>;

// `InternalWebsites/Portal/` in Firebase
type PortalStore = {
  applicationDeadline?: HackathonsInfoMap;
  hackathonWebsite?: HackathonsInfoMap;
  applicationsOpen?: HackathonsFlagMap;
  hackathonEnd?: HackathonsInfoMap;
  hackathonStart?: HackathonsInfoMap;
  hackathonWeekend?: HackathonsInfoMap;
  hackathonTheme?: HackathonPortalTheme;
  hackingEnd?: HackathonsInfoMap;
  hackingStart?: HackathonsInfoMap;
  judgingOpen?: HackathonsFlagMap;
  judgingReleased?: HackathonsFlagMap;
  location?: HackathonsInfoMap;
  offWaitlistNotify?: HackathonsInfoMap;
  portalLive?: HackathonsFlagMap;
  rsvpBy?: HackathonsInfoMap;
  rsvpOpen?: HackathonsFlagMap;
  sendAcceptancesBy?: HackathonsInfoMap;
  waitlistSignupDeadline?: HackathonsInfoMap;
  submissionsOpen?: HackathonsFlagMap;
  upNextHackathon?: HackathonsFlagMap;
  visitWebsite?: HackathonsFlagMap;
  notionLinks?: HackathonsNotionLinksMap;
  waiversAndForms?: HackathonsDataMap;
  lastEdited?: Timestamp;
  lastEditedBy?: string;

  loading: boolean;
  subscribeToPortal: () => void;
};

export const usePortalStore = create<PortalStore>((set) => ({
  loading: true,
  subscribeToPortal: () =>
    onSnapshot(
      doc(db, "InternalWebsites", "Portal"),
      (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          set({ ...data, loading: false });
        } else {
          set({ loading: false });
        }
      },
      (error) => {
        alert("Error subscribing to portal config. View console for more details");
        console.error(error);
        set({ loading: false });
      },
    ),
}));
