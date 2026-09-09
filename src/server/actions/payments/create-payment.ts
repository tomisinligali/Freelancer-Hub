"use server";

import { auth } from "@/lib/auth/auth";
import { getScopedPrisma } from "@/lib/db/prisma";
import { validatePaymentInput } from "@/lib/validation/payment";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";

export interface CreatePaymentResponse {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
  paymentId?: string;
}

export async function createPaymentAction(formData: FormData): Promise<CreatePaymentResponse> {
  const session = await auth();

  if (!session?.user?.id) {
    return { success: false, error: "You must be signed in to create a payment record." };
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
    const project = await db.project.findFirst({
      where: { id: projectId },
    });

    if (!project) {
      return { success: false, error: "Target project not found or unauthorized." };
    }

    const calculatedPaidDate = status === "PAID" ? (paidDate ?? new Date()) : null;

    const payment = await db.payment.create({
      data: {
        userId: session.user.id,
        projectId,
        amount: new Prisma.Decimal(amount),
        status,
        dueDate,
        paidDate: calculatedPaidDate,
      },
    });

    revalidatePath(`/projects/${projectId}`);
    revalidatePath("/projects");
    revalidatePath("/dashboard");

    return {
      success: true,
      paymentId: payment.id,
    };
  } catch (err: unknown) {
    console.error("Create payment error:", err);
    return {
      success: false,
      error: "An unexpected error occurred while creating the payment record.",
    };
  }
}
