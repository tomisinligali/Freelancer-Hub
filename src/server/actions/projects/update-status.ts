"use server";

import { auth } from "@/lib/auth/auth";
import { getScopedPrisma } from "@/lib/db/prisma";
import { projectStatusEnum, type ProjectStatusType } from "@/lib/validation/project";
import { revalidatePath } from "next/cache";

export interface UpdateStatusResponse {
  success: boolean;
  error?: string;
}

export async function updateProjectStatusAction(
  projectId: string,
  newStatus: ProjectStatusType
): Promise<UpdateStatusResponse> {
  const session = await auth();

  if (!session?.user?.id) {
    return { success: false, error: "You must be signed in to update status." };
  }

  const parseResult = projectStatusEnum.safeParse(newStatus);
  if (!parseResult.success) {
    return { success: false, error: "Invalid project status." };
  }

  const db = getScopedPrisma(session.user.id);

  try {
    const existing = await db.project.findFirst({
      where: { id: projectId },
    });

    if (!existing) {
      return { success: false, error: "Project not found or unauthorized." };
    }

    let completedAt = existing.completedAt;
    if (newStatus === "DONE" && existing.status !== "DONE") {
      completedAt = new Date();
    } else if (newStatus !== "DONE" && existing.status === "DONE") {
      completedAt = null;
    }

    await db.project.update({
      where: { id: projectId },
      data: {
        status: newStatus,
        completedAt,
      },
    });

    revalidatePath("/projects");
    revalidatePath(`/projects/${projectId}`);
    revalidatePath("/dashboard");
    if (existing.clientId) {
      revalidatePath(`/clients/${existing.clientId}`);
    }

    return { success: true };
  } catch (err: unknown) {
    console.error("Update project status error:", err);
    return {
      success: false,
      error: "An unexpected error occurred while updating the status.",
    };
  }
}
