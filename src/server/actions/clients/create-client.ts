"use server";

import { auth } from "@/lib/auth/auth";
import { getScopedPrisma } from "@/lib/db/prisma";
import { validateClientInput } from "@/lib/validation/client";
import { revalidatePath } from "next/cache";

export interface CreateClientResponse {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
  clientId?: string;
}

export async function createClientAction(formData: FormData): Promise<CreateClientResponse> {
  const session = await auth();

  if (!session?.user?.id) {
    return { success: false, error: "You must be signed in to create a client." };
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
    const client = await db.client.create({
      data: {
        userId: session.user.id,
        name,
        email: email ?? null,
        notes: notes ?? null,
      },
    });

    revalidatePath("/clients");
    revalidatePath("/dashboard");

    return {
      success: true,
      clientId: client.id,
    };
  } catch (err: unknown) {
    console.error("Create client error:", err);
    return {
      success: false,
      error: "An unexpected error occurred while creating the client.",
    };
  }
}
