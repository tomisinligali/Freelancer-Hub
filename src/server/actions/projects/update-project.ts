"use server";

import { auth } from "@/lib/auth/auth";
import { getScopedPrisma } from "@/lib/db/prisma";
import { validateProjectInput } from "@/lib/validation/project";
import { revalidatePath } from "next/cache";

export interface UpdateProjectResponse {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
}

export async function updateProjectAction(
  projectId: string,
  formData: FormData
): Promise<UpdateProjectResponse> {
  const session = await auth();

  if (!session?.user?.id) {
    return { success: false, error: "You must be signed in to update a project." };
  }

  if (!projectId) {
    return { success: false, error: "Project ID is required." };
  }

  const validation = validateProjectInput(formData);
  if (!validation.success || !validation.data) {
    return {
      success: false,
      error: validation.error,
      fieldErrors: validation.fieldErrors,
    };
  }

  const { title, description, clientId, status, startDate, dueDate } = validation.data;
  const db = getScopedPrisma(session.user.id);

  try {
    const existing = await db.project.findFirst({
      where: { id: projectId },
    });

    if (!existing) {
      return { success: false, error: "Project not found or unauthorized." };
    }

    if (clientId && clientId !== existing.clientId) {
      const client = await db.client.findFirst({
        where: { id: clientId },
      });
      if (!client) {
        return { success: false, error: "Selected client was not found." };
      }
      if (client.archivedAt) {
        return {
          success: false,
          error: "Cannot assign project to an archived client.",
          fieldErrors: { clientId: "Archived clients cannot be selected." },
        };
      }
    }

    // Rule: When a project transitions into DONE, set completedAt.
    // When a project leaves DONE, clear completedAt.
    // Unrelated edits must preserve existing completedAt.
    let completedAt = existing.completedAt;
    if (status === "DONE" && existing.status !== "DONE") {
      completedAt = new Date();
    } else if (status !== "DONE" && existing.status === "DONE") {
      completedAt = null;
    }

    await db.project.update({
      where: { id: projectId },
      data: {
        title,
        description: description ?? null,
        clientId: clientId ?? null,
        status,
        startDate: startDate ?? null,
        dueDate: dueDate ?? null,
        completedAt,
      },
    });

    revalidatePath("/projects");
    revalidatePath(`/projects/${projectId}`);
    revalidatePath("/dashboard");
    if (existing.clientId) {
      revalidatePath(`/clients/${existing.clientId}`);
    }
    if (clientId && clientId !== existing.clientId) {
      revalidatePath(`/clients/${clientId}`);
    }

    return { success: true };
  } catch (err: unknown) {
    console.error("Update project error:", err);
    return {
      success: false,
      error: "An unexpected error occurred while updating the project.",
    };
  }
}
