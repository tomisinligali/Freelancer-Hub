"use server";

import { auth } from "@/lib/auth/auth";
import { getScopedPrisma } from "@/lib/db/prisma";
import { revalidatePath } from "next/cache";

export interface DeleteProjectResponse {
  success: boolean;
  error?: string;
}

export async function deleteProjectAction(
  projectId: string,
  confirmationTitle: string
): Promise<DeleteProjectResponse> {
  const session = await auth();

  if (!session?.user?.id) {
    return { success: false, error: "You must be signed in to delete a project." };
  }

  const db = getScopedPrisma(session.user.id);

  try {
    const existing = await db.project.findFirst({
      where: { id: projectId },
    });

    if (!existing) {
      return { success: false, error: "Project not found or unauthorized." };
    }

    // Rule: Require the user to type the exact project title before hard deletion (PRJ-04).
    if (confirmationTitle.trim() !== existing.title.trim()) {
      return {
        success: false,
        error: "Confirmation title does not match the project title.",
      };
    }

    // Prisma cascades deletion to owned TimeEntries and Payments
    await db.project.delete({
      where: { id: projectId },
    });

    revalidatePath("/projects");
    revalidatePath("/dashboard");
    if (existing.clientId) {
      revalidatePath(`/clients/${existing.clientId}`);
    }

    return { success: true };
  } catch (err: unknown) {
    console.error("Delete project error:", err);
    return {
      success: false,
      error: "An unexpected error occurred while deleting the project.",
    };
  }
}
