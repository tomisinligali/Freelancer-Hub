"use server";

import { auth } from "@/lib/auth/auth";
import { getScopedPrisma } from "@/lib/db/prisma";
import { validatePaymentInput } from "@/lib/validation/payment";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";

export interface UpdatePaymentResponse {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
}

export async function updatePaymentAction(
  paymentId: string,
  formData: FormData
): Promise<UpdatePaymentResponse> {
  const session = await auth();

  if (!session?.user?.id) {
    return { success: false, error: "You must be signed in to update a payment record." };
  }

  if (!paymentId) {
    return { success: false, error: "Payment ID is required." };
  }

  const validation = validatePaymentInput(formData);
  if (!validation.success || !validation.data) {
    return {
      success: false,
      error: validation.error,
      fieldErrors: validation.fieldErrors,
    };
  }

  const { projectId, amount, status, dueDate, paidDate } = validation.data;
  const db = getScopedPrisma(session.user.id);

  try {
    const existing = await db.payment.findFirst({
      where: { id: paymentId },
    });

    if (!existing) {
      return { success: false, error: "Payment record not found or unauthorized." };
    }

    // Status transition management:
    // PENDING -> PAID: set paidDate (use provided or today)
    // PAID -> PENDING: clear paidDate = null
    // PAID -> PAID: preserve existing/provided paidDate
    let calculatedPaidDate = existing.paidDate;
    if (status === "PAID" && existing.status !== "PAID") {
      calculatedPaidDate = paidDate ?? new Date();
    } else if (status === "PENDING") {
      calculatedPaidDate = null;
    } else if (status === "PAID" && paidDate) {
      calculatedPaidDate = paidDate;
    }

    await db.payment.update({
      where: { id: paymentId },
      data: {
        amount: new Prisma.Decimal(amount),
        status,
        dueDate,
        paidDate: calculatedPaidDate,
      },
    });

    revalidatePath(`/projects/${projectId}`);
    revalidatePath("/projects");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (err: unknown) {
    console.error("Update payment error:", err);
    return {
      success: false,
      error: "An unexpected error occurred while updating the payment record.",
    };
  }
}
