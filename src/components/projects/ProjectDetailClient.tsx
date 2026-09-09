"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ProjectFormModal, type ActiveClientOption, type ProjectFormData } from "@/components/projects/ProjectFormModal";
import { DeleteProjectModal } from "@/components/projects/DeleteProjectModal";
import { ProjectStatusSelect } from "@/components/projects/ProjectStatusSelect";
import { TimeEntriesList, type TimeEntryItem } from "@/components/time/TimeEntriesList";
import { PaymentsList, type PaymentItem } from "@/components/payments/PaymentsList";
import { Button } from "@/components/ui/Button";
import type { ProjectStatusType } from "@/lib/validation/project";

export interface ProjectDetailViewProps {
  project: {
    id: string;
    title: string;
    description: string | null;
    status: ProjectStatusType;
    startDate: string | null;
    dueDate: string | null;
    completedAt: string | null;
    createdAt: string;
    updatedAt: string;
    clientId: string | null;
    client: {
      id: string;
      name: string;
      email: string | null;
      archivedAt: string | null;
    } | null;
    timeEntries: TimeEntryItem[];
    payments: PaymentItem[];
  };
  activeClients: ActiveClientOption[];
}

export function ProjectDetailClient({
  project,
  activeClients,
}: ProjectDetailViewProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"time" | "payments" | "details">("time");

  const projectFormData: ProjectFormData = {
    id: project.id,
    title: project.title,
    description: project.description,
    clientId: project.clientId,
    status: project.status,
    startDate: project.startDate,
    dueDate: project.dueDate,
  };

  return (
    <div className="fh-client-detail-container">
      <div className="fh-breadcrumb">
        <Link href="/projects" className="fh-breadcrumb-link">
          ← Back to Projects
        </Link>
      </div>

      <header className="fh-client-detail-header">
        <div className="fh-client-detail-title-group">
          <div className="fh-client-name-row">
            <h1 className="fh-dashboard-title">{project.title}</h1>
            <ProjectStatusSelect
              projectId={project.id}
              currentStatus={project.status}
            />
          </div>

          <div className="fh-project-meta-row">
            {project.client ? (
              <span className="fh-project-client-link-wrapper">
                Client:{" "}
                <Link
                  href={`/clients/${project.client.id}`}
                  className="fh-auth-link"
                >
                  {project.client.name}
                </Link>
                {project.client.archivedAt ? (
                  <span className="fh-badge fh-badge--warning" style={{ marginLeft: "8px" }}>
                    Client archived
                  </span>
                ) : null}
              </span>
            ) : (
              <span className="fh-text-muted">No client linked</span>
            )}
          </div>
        </div>

        <div className="fh-client-detail-actions">
          <Button variant="secondary" onClick={() => setIsEditOpen(true)}>
            Edit Project
          </Button>
          <button
            type="button"
            onClick={() => setIsDeleteOpen(true)}
            className="fh-btn-danger-outline"
          >
            Delete Project
          </button>
        </div>
      </header>

      {/* Tabs for Time Log, Payments, and Project Info */}
      <div className="fh-detail-tabs-wrapper">
        <div className="fh-clients-tabs">
          <button
            type="button"
            onClick={() => setActiveTab("time")}
            className={`fh-tab-btn ${activeTab === "time" ? "fh-tab-btn--active" : ""}`}
          >
            Time Log ({project.timeEntries.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("payments")}
            className={`fh-tab-btn ${activeTab === "payments" ? "fh-tab-btn--active" : ""}`}
          >
            Payments ({project.payments.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("details")}
            className={`fh-tab-btn ${activeTab === "details" ? "fh-tab-btn--active" : ""}`}
          >
            Project Details
          </button>
        </div>
      </div>

      {activeTab === "time" ? (
        <TimeEntriesList
          projectId={project.id}
          entries={project.timeEntries}
        />
      ) : activeTab === "payments" ? (
        <PaymentsList
          projectId={project.id}
          payments={project.payments}
        />
      ) : (
        <div className="fh-client-detail-grid">
          <section className="fh-detail-card">
            <h2 className="fh-detail-card-title">Project Scope & Notes</h2>
            <div className="fh-detail-info-list">
              <div className="fh-detail-info-item">
                <span className="fh-detail-info-label">Description</span>
                <p className="fh-detail-info-notes">
                  {project.description || <span className="fh-text-muted">No description provided.</span>}
                </p>
              </div>

              <div className="fh-form-row">
                <div className="fh-detail-info-item">
                  <span className="fh-detail-info-label">Start Date</span>
                  <span className="fh-detail-info-value">
                    {project.startDate
                      ? new Date(project.startDate).toLocaleDateString()
                      : <span className="fh-text-muted">Not set</span>}
                  </span>
                </div>

                <div className="fh-detail-info-item">
                  <span className="fh-detail-info-label">Due Date</span>
                  <span className="fh-detail-info-value">
                    {project.dueDate
                      ? new Date(project.dueDate).toLocaleDateString()
                      : <span className="fh-text-muted">Not set</span>}
                  </span>
                </div>
              </div>

              {project.completedAt ? (
                <div className="fh-detail-info-item">
                  <span className="fh-detail-info-label">Completed Date</span>
                  <span className="fh-detail-info-value" style={{ color: "var(--color-success)" }}>
                    {new Date(project.completedAt).toLocaleDateString()}
                  </span>
                </div>
              ) : null}
            </div>
          </section>
        </div>
      )}

      <ProjectFormModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        project={projectFormData}
        activeClients={activeClients}
      />

      <DeleteProjectModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        projectId={project.id}
        projectTitle={project.title}
      />
    </div>
  );
}
