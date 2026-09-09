import { z } from "zod";

export const projectStatusEnum = z.enum([
  "NOT_STARTED",
  "IN_PROGRESS",
  "DONE",
  "ARCHIVED",
]);

export type ProjectStatusType = z.infer<typeof projectStatusEnum>;

export const projectSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Project title is required.")
    .max(150, "Project title must be at most 150 characters."),
  description: z
    .string()
    .trim()
    .max(2000, "Description must be at most 2000 characters.")
    .optional()
    .nullable()
    .transform(val => (val === "" ? null : val)),
  clientId: z
    .string()
    .trim()
    .optional()
    .nullable()
    .transform(val => (val === "" || val === "none" ? null : val)),
  status: projectStatusEnum.default("NOT_STARTED"),
  startDate: z
    .string()
    .optional()
    .nullable()
    .transform(val => (val ? new Date(val) : null)),
  dueDate: z
    .string()
    .optional()
    .nullable()
    .transform(val => (val ? new Date(val) : null)),
});

export type ProjectInput = z.infer<typeof projectSchema>;

export interface ProjectValidationResult {
  success: boolean;
  data?: ProjectInput;
  error?: string;
  fieldErrors?: Record<string, string>;
}

export function validateProjectInput(formData: FormData): ProjectValidationResult {
  const raw = {
    title: formData.get("title"),
    description: formData.get("description"),
    clientId: formData.get("clientId"),
    status: formData.get("status") || "NOT_STARTED",
    startDate: formData.get("startDate") || null,
    dueDate: formData.get("dueDate") || null,
  };

  const parsed = projectSchema.safeParse(raw);
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
      error: parsed.error.issues[0]?.message || "Invalid project input.",
      fieldErrors,
    };
  }

  return {
    success: true,
    data: parsed.data,
  };
}
