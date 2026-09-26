import { z } from "zod";

export const profileSchema = z.object({
  name: z.string().trim().min(1, "Enter your name.").max(80, "Name is too long."),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;