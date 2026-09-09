import React from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { getScopedPrisma } from "@/lib/db/prisma";
import { ClientsListClient, type ClientItem } from "@/components/clients/ClientsListClient";

export const metadata = {
  title: "Clients | Freelancer Hub",
};

export default async function ClientsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/auth?view=signin");
  }

  const db = getScopedPrisma(session.user.id);

  const [activeRaw, archivedRaw] = await Promise.all([
    db.client.findMany({
      where: { archivedAt: null },
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { projects: true },
        },
      },
    }),
    db.client.findMany({
      where: { archivedAt: { not: null } },
      orderBy: { archivedAt: "desc" },
      include: {
        _count: {
          select: { projects: true },
        },
      },
    }),
  ]);

  const activeClients: ClientItem[] = activeRaw.map(c => ({
    id: c.id,
    name: c.name,
    email: c.email,
    notes: c.notes,
    archivedAt: c.archivedAt ? c.archivedAt.toISOString() : null,
    createdAt: c.createdAt.toISOString(),
    _count: c._count,
  }));

  const archivedClients: ClientItem[] = archivedRaw.map(c => ({
    id: c.id,
    name: c.name,
    email: c.email,
    notes: c.notes,
    archivedAt: c.archivedAt ? c.archivedAt.toISOString() : null,
    createdAt: c.createdAt.toISOString(),
    _count: c._count,
  }));

  return (
    <ClientsListClient
      activeClients={activeClients}
      archivedClients={archivedClients}
    />
  );
}
