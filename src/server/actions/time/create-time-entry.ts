"use server";

import { auth } from "@/lib/auth/auth";
import { getScopedPrisma } from "@/lib/db/prisma";
import { validateTimeEntryInput } from "@/lib/validation/time";
import { revalidatePath } from "next/cache";

export interface CreateTimeEntryResponse {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
  timeEntryId?: string;
}

export async function createTimeEntryAction(formData: FormData): Promise<CreateTimeEntryResponse> {
  const session = await auth();

  if (!session?.user?.id) {
    return { success: false, error: "You must be signed in to log time." };
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
    // Verify target project belongs to the authenticated user
    const project = await db.project.findFirst({
      where: { id: projectId },
    });

    if (!project) {
      return { success: false, error: "Target project not found or unauthorized." };
    }

    const timeEntry = await db.timeEntry.create({
      data: {
        userId: session.user.id,
        projectId,
        date,
        minutes,
        note: note ?? null,
      },
    });

    revalidatePath(`/projects/${projectId}`);
    revalidatePath("/projects");
    revalidatePath("/dashboard");

    return {
      success: true,
      timeEntryId: timeEntry.id,
    };
  } catch (err: unknown) {
    console.error("Create time entry error:", err);
    return {
      success: false,
      error: "An unexpected error occurred while logging time.",
    };
  }
}
