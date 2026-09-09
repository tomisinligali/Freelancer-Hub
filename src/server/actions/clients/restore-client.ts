"use server";

import { auth } from "@/lib/auth/auth";
import { getScopedPrisma } from "@/lib/db/prisma";
import { revalidatePath } from "next/cache";

export interface RestoreClientResponse {
  success: boolean;
  error?: string;
}

export async function restoreClientAction(clientId: string): Promise<RestoreClientResponse> {
  const session = await auth();

  if (!session?.user?.id) {
    return { success: false, error: "You must be signed in to restore a client." };
  }

  if (!clientId) {
    return { success: false, error: "Client ID is required." };
  }

  try {
    const db = getScopedPrisma(session.user.id);

    // Rule: Restoring a client must clear archivedAt.
    await db.client.update({
      where: { id: clientId },
      data: {
        archivedAt: null,
      },
    });

    revalidatePath("/clients");
    revalidatePath(`/clients/${clientId}`);
    revalidatePath("/dashboard");

    return { success: true };
  } catch (err: unknown) {
    console.error("Restore client error:", err);
    return {
      success: false,
      error: "An unexpected error occurred while restoring the client.",
    };
  }
}
