import React from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { getScopedPrisma } from "@/lib/db/prisma";
import { ProjectsListClient, type ProjectListItem } from "@/components/projects/ProjectsListClient";

export const metadata = {
  title: "Projects | Freelancer Hub",
};

export default async function ProjectsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/auth?view=signin");
  }

  const db = getScopedPrisma(session.user.id);

  const [projectsRaw, activeClientsRaw] = await Promise.all([
    db.project.findMany({
      orderBy: { updatedAt: "desc" },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            archivedAt: true,
          },
        },
        _count: {
          select: {
            timeEntries: true,
            payments: true,
          },
        },
      },
    }),
    db.client.findMany({
      where: { archivedAt: null },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
      },
    }),
  ]);

  const projects: ProjectListItem[] = projectsRaw.map(p => ({
    id: p.id,
    title: p.title,
    description: p.description,
    status: p.status,
    startDate: p.startDate ? p.startDate.toISOString() : null,
    dueDate: p.dueDate ? p.dueDate.toISOString() : null,
    completedAt: p.completedAt ? p.completedAt.toISOString() : null,
    updatedAt: p.updatedAt.toISOString(),
    client: p.client
      ? {
          id: p.client.id,
          name: p.client.name,
          archivedAt: p.client.archivedAt ? p.client.archivedAt.toISOString() : null,
        }
      : null,
    _count: p._count,
  }));

  return (
    <ProjectsListClient
      projects={projects}
      activeClients={activeClientsRaw}
    />
  );
}
