import { z } from "zod";
import { clean, singleLine, toFieldErrors } from "./shared";

/** Admin form for adding or editing a team member's public profile. */

const line = (label: string, min: number, max: number) =>
  z
    .string({ error: `Please enter the ${label}.` })
    .transform(singleLine)
    .pipe(
      z
        .string()
        .min(min, { error: `Please enter the ${label}.` })
        .max(max, { error: `Please keep the ${label} under ${max} characters.` }),
    );

export const teamMemberSchema = z.object({
  name: line("name", 2, 80),
  role: line("job title", 2, 80),
  focus: line("focus line", 2, 140),
  group: z.enum(["leadership", "engineering"], { error: "Please choose a section." }),
  bio: z
    .string()
    .optional()
    .transform((v) => clean(v ?? "").trim())
    .pipe(z.string().max(500, { error: "Please keep the introduction under 500 characters." }))
    .transform((v) => v || null),
  profileUrl: z
    .string()
    .optional()
    .transform((v) => singleLine(v ?? ""))
    .superRefine((v, ctx) => {
      if (!v) return;
      let url: URL;
      try {
        url = new URL(v);
      } catch {
        return void ctx.addIssue({ code: "custom", message: "Please enter a full link starting with https://" });
      }
      if (url.protocol !== "https:" || url.username || url.password || !url.hostname.includes(".") || v.length > 300) {
        ctx.addIssue({ code: "custom", message: "Please enter a valid https:// profile link." });
      }
    })
    .transform((v) => v || null),
  consent: z.literal("on", { error: "Please confirm this person approved their profile being shown." }),
});

export type TeamMemberInput = z.infer<typeof teamMemberSchema>;
export type TeamMemberField = keyof TeamMemberInput | "photo";
export type TeamMemberErrors = Partial<Record<TeamMemberField, string>>;

export const teamMemberFieldErrors = (e: z.ZodError) => toFieldErrors<TeamMemberField>(e);
