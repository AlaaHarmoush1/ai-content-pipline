import { z } from "zod";

export const ResearcherSchema = z.object({
  facts: z.array(z.string()),
  sources: z.array(z.string())
});