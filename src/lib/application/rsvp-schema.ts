import { z } from "zod";

export const rsvpSchema = z.object({
  willBeAttendingCheck: z.boolean().refine((val) => val === true, {
    message: "Please confirm to continue",
  }),
  releaseLiabilityCheck: z.boolean().refine((val) => val === true, {
    message: "Please confirm to continue",
  }),
  mediaConsentCheck: z.boolean().optional(),
  safewalkCheck: z.boolean().optional(),
  sponsorEmailConsentCheck: z.boolean().optional(),
  marketingFeatureCheck: z.boolean().optional(),
});

export type RsvpFormValues = z.infer<typeof rsvpSchema>;
