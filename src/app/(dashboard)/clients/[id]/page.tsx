import React from "react";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { getScopedPrisma } from "@/lib/db/prisma";
import { ClientDetailClient } from "@/components/clients/ClientDetailClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) return { title: "Client Details | Freelancer Hub" };

  const db = getScopedPrisma(session.user.id);
  const client = await db.client.findFirst({ where: { id } });

  return {
    title: client ? `${client.name} | Freelancer Hub` : "Client Details | Freelancer Hub",
  };
}

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/auth?view=signin");
  }

  const db = getScopedPrisma(session.user.id);

  // Query client with linked projects
  const client = await db.client.findFirst({
    where: { id },
    include: {
      projects: {
        orderBy: { updatedAt: "desc" },
      },
    },
  });

  if (!client) {
    notFound();
  }

  return (
    <ClientDetailClient
      client={{
        id: client.id,
        name: client.name,
        email: client.email,
        notes: client.notes,
        archivedAt: client.archivedAt ? client.archivedAt.toISOString() : null,
        createdAt: client.createdAt.toISOString(),
        updatedAt: client.updatedAt.toISOString(),
      }}
      projects={client.projects.map(p => ({
        id: p.id,
        title: p.title,
        status: p.status,
        dueDate: p.dueDate ? p.dueDate.toISOString() : null,
        startDate: p.startDate ? p.startDate.toISOString() : null,
        completedAt: p.completedAt ? p.completedAt.toISOString() : null,
      }))}
    />
  );
}
