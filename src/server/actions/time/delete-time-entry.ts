"use server";

import { auth } from "@/lib/auth/auth";
import { getScopedPrisma } from "@/lib/db/prisma";
import { revalidatePath } from "next/cache";

export interface DeleteTimeEntryResponse {
  success: boolean;
  error?: string;
}

export async function deleteTimeEntryAction(
  timeEntryId: string,
  projectId: string
): Promise<DeleteTimeEntryResponse> {
  const session = await auth();

  if (!session?.user?.id) {
    return { success: false, error: "You must be signed in to delete a time entry." };
  }

  if (!timeEntryId) {
    return { success: false, error: "Time entry ID is required." };
  }

  const db = getScopedPrisma(session.user.id);

  try {
    const existing = await db.timeEntry.findFirst({
      where: { id: timeEntryId },
    });

    if (!existing) {
      return { success: false, error: "Time entry not found or unauthorized." };
    }

    await db.timeEntry.delete({
      where: { id: timeEntryId },
    });

    revalidatePath(`/projects/${projectId}`);
    revalidatePath("/projects");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (err: unknown) {
    console.error("Delete time entry error:", err);
    return {
      success: false,
      error: "An unexpected error occurred while deleting the time entry.",
    };
  }
}
