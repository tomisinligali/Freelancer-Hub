import React from "react";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { getScopedPrisma } from "@/lib/db/prisma";
import { ProjectDetailClient } from "@/components/projects/ProjectDetailClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) return { title: "Project Details | Freelancer Hub" };

  const db = getScopedPrisma(session.user.id);
  const project = await db.project.findFirst({ where: { id } });

  return {
    title: project ? `${project.title} | Freelancer Hub` : "Project Details | Freelancer Hub",
  };
}

export default async function ProjectDetailPage({
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

  const [project, activeClientsRaw] = await Promise.all([
    db.project.findFirst({
      where: { id },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            archivedAt: true,
          },
        },
        timeEntries: {
          orderBy: { date: "desc" },
          select: {
            id: true,
            date: true,
            minutes: true,
            note: true,
          },
        },
        payments: {
          orderBy: { dueDate: "desc" },
          select: {
            id: true,
            amount: true,
            status: true,
            dueDate: true,
            paidDate: true,
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

  if (!project) {
    notFound();
  }

  return (
    <ProjectDetailClient
      project={{
        id: project.id,
        title: project.title,
        description: project.description,
        status: project.status,
        startDate: project.startDate ? project.startDate.toISOString() : null,
        dueDate: project.dueDate ? project.dueDate.toISOString() : null,
        completedAt: project.completedAt ? project.completedAt.toISOString() : null,
        createdAt: project.createdAt.toISOString(),
        updatedAt: project.updatedAt.toISOString(),
        clientId: project.clientId,
        client: project.client
          ? {
              id: project.client.id,
              name: project.client.name,
              email: project.client.email,
              archivedAt: project.client.archivedAt ? project.client.archivedAt.toISOString() : null,
            }
          : null,
        timeEntries: project.timeEntries.map(t => ({
          id: t.id,
          date: t.date.toISOString(),
          minutes: t.minutes,
          note: t.note,
        })),
        payments: project.payments.map(p => ({
          id: p.id,
          amount: p.amount.toString(),
          status: p.status,
          dueDate: p.dueDate.toISOString(),
          paidDate: p.paidDate ? p.paidDate.toISOString() : null,
        })),
      }}
      activeClients={activeClientsRaw}
    />
  );
}
