import { type Timestamp, doc, onSnapshot } from "firebase/firestore";
import type z from "zod";
import { create } from "zustand";
import type { VALID_HACKATHONS } from "../constants";
import { db } from "../firebase/client";

type HackathonsFlagMap = Record<z.infer<typeof VALID_HACKATHONS>, boolean>;
type HackathonsInfoMap = Record<z.infer<typeof VALID_HACKATHONS>, string>;
type HackathonsDataMap = Record<z.infer<typeof VALID_HACKATHONS>, Record<string, string>>;

// `InternalWebsites/Portal/` in Firebase
type PortalStore = {
  applicationDeadline?: HackathonsInfoMap;
  hackathonWebsite?: HackathonsInfoMap;
  applicationsOpen?: HackathonsFlagMap;
  hackathonEnd?: HackathonsInfoMap;
  hackathonStart?: HackathonsInfoMap;
  hackathonWeekend?: HackathonsInfoMap;
  hackingEnd?: HackathonsInfoMap;
  hackingStart?: HackathonsInfoMap;
  judgingOpen?: HackathonsFlagMap;
  judgingReleased?: HackathonsFlagMap;
  offWaitlistNotify?: HackathonsInfoMap;
  portalLive?: HackathonsFlagMap;
  rsvpBy?: HackathonsInfoMap;
  sendAcceptancesBy?: HackathonsInfoMap;
  submissionsOpen?: HackathonsFlagMap;
  upNextHackathon?: HackathonsFlagMap;
  visitWebsite?: HackathonsFlagMap;
  notionLinks?: HackathonsDataMap;
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
