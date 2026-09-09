"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ClientFormModal } from "@/components/clients/ClientFormModal";
import { ArchiveClientButton } from "@/components/clients/ArchiveClientButton";
import { Button } from "@/components/ui/Button";

export interface ProjectSummary {
  id: string;
  title: string;
  status: "NOT_STARTED" | "IN_PROGRESS" | "DONE" | "ARCHIVED";
  dueDate: string | null;
  startDate: string | null;
  completedAt: string | null;
}

export interface ClientDetailProps {
  client: {
    id: string;
    name: string;
    email: string | null;
    notes: string | null;
    archivedAt: string | null;
    createdAt: string;
    updatedAt: string;
  };
  projects: ProjectSummary[];
}

const STATUS_LABELS: Record<ProjectSummary["status"], string> = {
  NOT_STARTED: "Not Started",
  IN_PROGRESS: "In Progress",
  DONE: "Done",
  ARCHIVED: "Archived",
};

export function ClientDetailClient({ client, projects }: ClientDetailProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);

  const isArchived = Boolean(client.archivedAt);

  return (
    <div className="fh-client-detail-container">
      <div className="fh-breadcrumb">
        <Link href="/clients" className="fh-breadcrumb-link">
          ← Back to Clients
        </Link>
      </div>

      <header className="fh-client-detail-header">
        <div className="fh-client-detail-title-group">
          <div className="fh-client-name-row">
            <h1 className="fh-dashboard-title">{client.name}</h1>
            {isArchived ? (
              <span className="fh-badge fh-badge--archived">Client archived</span>
            ) : (
              <span className="fh-badge fh-badge--active">Active</span>
            )}
          </div>
          <p className="fh-client-created-date">
            Client added on {new Date(client.createdAt).toLocaleDateString()}
          </p>
        </div>

        <div className="fh-client-detail-actions">
          <Button variant="secondary" onClick={() => setIsEditOpen(true)}>
            Edit Client
          </Button>
          <ArchiveClientButton
            clientId={client.id}
            isArchived={isArchived}
            clientName={client.name}
          />
        </div>
      </header>

      <div className="fh-client-detail-grid">
        {/* Client Info Card */}
        <section className="fh-detail-card">
          <h2 className="fh-detail-card-title">Contact & Notes</h2>
          <div className="fh-detail-info-list">
            <div className="fh-detail-info-item">
              <span className="fh-detail-info-label">Email Address</span>
              <span className="fh-detail-info-value">
                {client.email ? (
                  <a href={`mailto:${client.email}`} className="fh-auth-link">
                    {client.email}
                  </a>
                ) : (
                  <span className="fh-text-muted">Not provided</span>
                )}
              </span>
            </div>

            <div className="fh-detail-info-item">
              <span className="fh-detail-info-label">Notes</span>
              <p className="fh-detail-info-notes">
                {client.notes || <span className="fh-text-muted">No notes added.</span>}
              </p>
            </div>
          </div>
        </section>

        {/* Linked Projects Card */}
        <section className="fh-detail-card">
          <div className="fh-card-header-row">
            <h2 className="fh-detail-card-title">
              Projects ({projects.length})
            </h2>
          </div>

          {projects.length === 0 ? (
            <div className="fh-empty-projects">
              <p className="fh-text-muted">
                No projects linked to this client yet.
              </p>
            </div>
          ) : (
            <div className="fh-projects-list">
              {projects.map(project => (
                <div key={project.id} className="fh-project-row">
                  <div className="fh-project-row-info">
                    <span className="fh-project-row-title">{project.title}</span>
                    {project.dueDate ? (
                      <span className="fh-project-row-due">
                        Due: {new Date(project.dueDate).toLocaleDateString()}
                      </span>
                    ) : null}
                  </div>

                  <div className="fh-project-row-badges">
                    <span className={`fh-badge fh-badge--status-${project.status.toLowerCase()}`}>
                      {STATUS_LABELS[project.status]}
                    </span>
                    {isArchived ? (
                      <span className="fh-badge fh-badge--warning" title="Client relationship is archived">
                        Client archived
                      </span>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <ClientFormModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        client={client}
      />
    </div>
  );
}
