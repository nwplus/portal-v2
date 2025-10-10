import { z } from "zod";

// used for URL routing validation
export const VALID_HACKATHONS = z.enum(["hackcamp", "nwhacks", "cmd-f"]);
