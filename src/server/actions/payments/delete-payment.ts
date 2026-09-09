"use server";

import { auth } from "@/lib/auth/auth";
import { getScopedPrisma } from "@/lib/db/prisma";
import { revalidatePath } from "next/cache";

export interface DeletePaymentResponse {
  success: boolean;
  error?: string;
}

export async function deletePaymentAction(
  paymentId: string,
  projectId: string
): Promise<DeletePaymentResponse> {
  const session = await auth();

  if (!session?.user?.id) {
    return { success: false, error: "You must be signed in to delete a payment record." };
  }

  const db = getScopedPrisma(session.user.id);

  try {
    const existing = await db.payment.findFirst({
      where: { id: paymentId },
    });

    if (!existing) {
      return { success: false, error: "Payment record not found or unauthorized." };
    }

    await db.payment.delete({
      where: { id: paymentId },
    });

    revalidatePath(`/projects/${projectId}`);
    revalidatePath("/projects");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (err: unknown) {
    console.error("Delete payment error:", err);
    return {
      success: false,
      error: "An unexpected error occurred while deleting the payment record.",
    };
  }
}
