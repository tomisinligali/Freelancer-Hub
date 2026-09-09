import { z } from "zod";

export const paymentStatusEnum = z.enum(["PENDING", "PAID"]);

export type PaymentStatusType = z.infer<typeof paymentStatusEnum>;

export const paymentSchema = z.object({
  projectId: z.string().trim().min(1, "Project ID is required."),
  amount: z
    .string()
    .trim()
    .min(1, "Amount is required.")
    .refine(
      val => /^\d+(\.\d{1,2})?$/.test(val) && parseFloat(val) > 0,
      "Amount must be a positive decimal number with up to 2 decimal places."
    ),
  status: paymentStatusEnum.default("PENDING"),
  dueDate: z
    .string()
    .trim()
    .min(1, "Due date is required.")
    .transform(val => new Date(val)),
  paidDate: z
    .string()
    .optional()
    .nullable()
    .transform(val => (val ? new Date(val) : null)),
});

export type PaymentInput = z.infer<typeof paymentSchema>;

export interface PaymentValidationResult {
  success: boolean;
  data?: PaymentInput;
  error?: string;
  fieldErrors?: Record<string, string>;
}

export function validatePaymentInput(formData: FormData): PaymentValidationResult {
  const raw = {
    projectId: formData.get("projectId"),
    amount: formData.get("amount"),
    status: formData.get("status") || "PENDING",
    dueDate: formData.get("dueDate"),
    paidDate: formData.get("paidDate") || null,
  };

  const parsed = paymentSchema.safeParse(raw);
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
      error: parsed.error.issues[0]?.message || "Invalid payment input.",
      fieldErrors,
    };
  }

  return {
    success: true,
    data: parsed.data,
  };
}

export function formatCurrency(amount: string | number): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(isNaN(num) ? 0 : num);
}
