import { z } from "zod";

export const timeEntrySchema = z.object({
  projectId: z.string().trim().min(1, "Project ID is required."),
  date: z
    .string()
    .trim()
    .min(1, "Date is required.")
    .transform(val => new Date(val)),
  minutes: z.coerce
    .number()
    .int("Minutes must be a whole integer number.")
    .min(1, "Time duration must be at least 1 minute.")
    .max(1440, "A single time entry cannot exceed 1440 minutes (24 hours)."),
  note: z
    .string()
    .trim()
    .max(500, "Note cannot exceed 500 characters.")
    .optional()
    .nullable()
    .transform(val => (val === "" ? null : val)),
});

export type TimeEntryInput = z.infer<typeof timeEntrySchema>;

export interface TimeEntryValidationResult {
  success: boolean;
  data?: TimeEntryInput;
  error?: string;
  fieldErrors?: Record<string, string>;
}

export function validateTimeEntryInput(formData: FormData): TimeEntryValidationResult {
  const raw = {
    projectId: formData.get("projectId"),
    date: formData.get("date") || new Date().toISOString().split("T")[0],
    minutes: formData.get("minutes"),
    note: formData.get("note"),
  };

  const parsed = timeEntrySchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.join(".");
      if (key && !fieldErrors[key]) {
        fieldErrors[key] = issue.message;
      }
    }
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Invalid time entry input.",
      fieldErrors,
    };
  }

  return {
    success: true,
    data: parsed.data,
  };
}

/**
 * Format minutes into readable hours and minutes (e.g. 150 -> "2h 30m")
 */
export function formatMinutes(minutes: number): string {
  if (minutes <= 0) return "0m";
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours === 0) return `${remainingMinutes}m`;
  if (remainingMinutes === 0) return `${hours}h`;
  return `${hours}h ${remainingMinutes}m`;
}
