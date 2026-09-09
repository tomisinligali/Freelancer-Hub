"use server";

import { auth } from "@/lib/auth/auth";
import { getScopedPrisma } from "@/lib/db/prisma";
import { revalidatePath } from "next/cache";

export interface TogglePaymentStatusResponse {
  success: boolean;
  error?: string;
}

export async function togglePaymentStatusAction(
  paymentId: string,
  projectId: string
): Promise<TogglePaymentStatusResponse> {
  const session = await auth();

  if (!session?.user?.id) {
    return { success: false, error: "You must be signed in to change payment status." };
  }

  const db = getScopedPrisma(session.user.id);

  try {
    const existing = await db.payment.findFirst({
      where: { id: paymentId },
    });

    if (!existing) {
      return { success: false, error: "Payment record not found or unauthorized." };
    }

    const nextStatus = existing.status === "PENDING" ? "PAID" : "PENDING";
    const nextPaidDate = nextStatus === "PAID" ? new Date() : null;

    await db.payment.update({
      where: { id: paymentId },
      data: {
        status: nextStatus,
        paidDate: nextPaidDate,
      },
    });

    revalidatePath(`/projects/${projectId}`);
    revalidatePath("/projects");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (err: unknown) {
    console.error("Toggle payment status error:", err);
    return {
      success: false,
      error: "An unexpected error occurred while toggling the payment status.",
    };
  }
}
