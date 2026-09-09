import { z } from "zod";

export const clientSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Client name is required.")
    .max(100, "Client name must be at most 100 characters."),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .optional()
    .nullable()
    .transform(val => (val === "" ? null : val))
    .refine(
      val => !val || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
      "Please enter a valid email address."
    ),
  notes: z
    .string()
    .trim()
    .max(1000, "Notes must be at most 1000 characters.")
    .optional()
    .nullable()
    .transform(val => (val === "" ? null : val)),
});

export type ClientInput = z.infer<typeof clientSchema>;

export interface ClientValidationResult {
  success: boolean;
  data?: ClientInput;
  error?: string;
  fieldErrors?: Record<string, string>;
}

export function validateClientInput(formData: FormData): ClientValidationResult {
  const raw = {
    name: formData.get("name"),
    email: formData.get("email"),
    notes: formData.get("notes"),
  };

  const parsed = clientSchema.safeParse(raw);
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
      error: parsed.error.issues[0]?.message || "Invalid input.",
      fieldErrors,
    };
  }

  return {
    success: true,
    data: parsed.data,
  };
}
