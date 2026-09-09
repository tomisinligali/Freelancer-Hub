"use server";

import { auth } from "@/lib/auth/auth";
import { getScopedPrisma } from "@/lib/db/prisma";
import { validateProjectInput } from "@/lib/validation/project";
import { revalidatePath } from "next/cache";

export interface CreateProjectResponse {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
  projectId?: string;
}

export async function createProjectAction(formData: FormData): Promise<CreateProjectResponse> {
  const session = await auth();

  if (!session?.user?.id) {
    return { success: false, error: "You must be signed in to create a project." };
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
    // Rule: An archived client must not be selectable when creating a new project.
    if (clientId) {
      const client = await db.client.findFirst({
        where: { id: clientId },
      });

      if (!client) {
        return {
          success: false,
          error: "Selected client was not found.",
          fieldErrors: { clientId: "Client not found." },
        };
      }

      if (client.archivedAt) {
        return {
          success: false,
          error: "Cannot assign project to an archived client. Please restore the client first.",
          fieldErrors: { clientId: "Archived clients cannot be selected for new projects." },
        };
      }
    }

    const completedAt = status === "DONE" ? new Date() : null;

    const project = await db.project.create({
      data: {
        userId: session.user.id,
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
    revalidatePath("/dashboard");
    if (clientId) {
      revalidatePath(`/clients/${clientId}`);
    }

    return {
      success: true,
      projectId: project.id,
    };
  } catch (err: unknown) {
    console.error("Create project error:", err);
    return {
      success: false,
      error: "An unexpected error occurred while creating the project.",
    };
  }
}
