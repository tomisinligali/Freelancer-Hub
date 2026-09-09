"use server";

import { auth } from "@/lib/auth/auth";
import { getScopedPrisma } from "@/lib/db/prisma";
import { revalidatePath } from "next/cache";

export interface ArchiveClientResponse {
  success: boolean;
  error?: string;
}

export async function archiveClientAction(clientId: string): Promise<ArchiveClientResponse> {
  const session = await auth();

  if (!session?.user?.id) {
    return { success: false, error: "You must be signed in to archive a client." };
  }

  if (!clientId) {
    return { success: false, error: "Client ID is required." };
  }

  try {
    const db = getScopedPrisma(session.user.id);

    // Rule: Archive client using archivedAt timestamp. Do not delete record or touch projects.
    await db.client.update({
      where: { id: clientId },
      data: {
        archivedAt: new Date(),
      },
    });

    revalidatePath("/clients");
    revalidatePath(`/clients/${clientId}`);
    revalidatePath("/dashboard");

    return { success: true };
  } catch (err: unknown) {
    console.error("Archive client error:", err);
    return {
      success: false,
      error: "An unexpected error occurred while archiving the client.",
    };
  }
}
