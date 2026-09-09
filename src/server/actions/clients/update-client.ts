"use server";

import { auth } from "@/lib/auth/auth";
import { getScopedPrisma } from "@/lib/db/prisma";
import { validateClientInput } from "@/lib/validation/client";
import { revalidatePath } from "next/cache";

export interface UpdateClientResponse {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
}

export async function updateClientAction(
  clientId: string,
  formData: FormData
): Promise<UpdateClientResponse> {
  const session = await auth();

  if (!session?.user?.id) {
    return { success: false, error: "You must be signed in to update a client." };
  }

  if (!clientId) {
    return { success: false, error: "Client ID is required." };
  }

  const validation = validateClientInput(formData);
  if (!validation.success || !validation.data) {
    return {
      success: false,
      error: validation.error,
      fieldErrors: validation.fieldErrors,
    };
  }

  const { name, email, notes } = validation.data;

  try {
    const db = getScopedPrisma(session.user.id);

    await db.client.update({
      where: { id: clientId },
      data: {
        name,
        email: email ?? null,
        notes: notes ?? null,
      },
    });

    revalidatePath("/clients");
    revalidatePath(`/clients/${clientId}`);
    revalidatePath("/dashboard");

    return { success: true };
  } catch (err: unknown) {
    console.error("Update client error:", err);
    return {
      success: false,
      error: "An unexpected error occurred while updating the client.",
    };
  }
}
