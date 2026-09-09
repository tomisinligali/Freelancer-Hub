"use server";

import { auth } from "@/lib/auth/auth";
import { getScopedPrisma } from "@/lib/db/prisma";
import { validateTimeEntryInput } from "@/lib/validation/time";
import { revalidatePath } from "next/cache";

export interface UpdateTimeEntryResponse {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
}

export async function updateTimeEntryAction(
  timeEntryId: string,
  formData: FormData
): Promise<UpdateTimeEntryResponse> {
  const session = await auth();

  if (!session?.user?.id) {
    return { success: false, error: "You must be signed in to update time." };
  }

  if (!timeEntryId) {
    return { success: false, error: "Time entry ID is required." };
  }

  const validation = validateTimeEntryInput(formData);
  if (!validation.success || !validation.data) {
    return {
      success: false,
      error: validation.error,
      fieldErrors: validation.fieldErrors,
    };
  }

  const { projectId, date, minutes, note } = validation.data;
  const db = getScopedPrisma(session.user.id);

  try {
    const existing = await db.timeEntry.findFirst({
      where: { id: timeEntryId },
    });

    if (!existing) {
      return { success: false, error: "Time entry not found or unauthorized." };
    }

    await db.timeEntry.update({
      where: { id: timeEntryId },
      data: {
        date,
        minutes,
        note: note ?? null,
      },
    });

    revalidatePath(`/projects/${projectId}`);
    revalidatePath("/projects");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (err: unknown) {
    console.error("Update time entry error:", err);
    return {
      success: false,
      error: "An unexpected error occurred while updating the time entry.",
    };
  }
}
