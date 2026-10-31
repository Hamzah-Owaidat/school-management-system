import { z } from "zod";

/** Response of GET /api/health, shared by the API and the web app. */
export const HealthResponseSchema = z.object({
  status: z.literal("ok"),
  service: z.string(),
  time: z.iso.datetime(),
});

export type HealthResponse = z.infer<typeof HealthResponseSchema>;
