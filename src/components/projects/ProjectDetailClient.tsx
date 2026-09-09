"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ProjectFormModal, type ActiveClientOption, type ProjectFormData } from "@/components/projects/ProjectFormModal";
import { DeleteProjectModal } from "@/components/projects/DeleteProjectModal";
import { ProjectStatusSelect } from "@/components/projects/ProjectStatusSelect";
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
    timeEntries: {
      id: string;
      date: string;
      minutes: number;
      note: string | null;
    }[];
    payments: {
      id: string;
      amount: string;
      status: "PENDING" | "PAID";
      dueDate: string;
      paidDate: string | null;
    }[];
  };
  activeClients: ActiveClientOption[];
}

export function ProjectDetailClient({
  project,
  activeClients,
}: ProjectDetailViewProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const totalMinutes = project.timeEntries.reduce((sum, t) => sum + t.minutes, 0);
  const totalHours = (totalMinutes / 60).toFixed(1);

  const totalPayments = project.payments.length;
  const pendingPayments = project.payments.filter(p => p.status === "PENDING").length;

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

      <div className="fh-client-detail-grid">
        {/* Project Info Card */}
        <section className="fh-detail-card">
          <h2 className="fh-detail-card-title">Project Details</h2>
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

        {/* Overview & Activity Card */}
        <section className="fh-detail-card">
          <h2 className="fh-detail-card-title">Activity & Trackers</h2>
          <div className="fh-tracker-preview-grid">
            <div className="fh-tracker-box">
              <span className="fh-tracker-box-label">Logged Time</span>
              <span className="fh-tracker-box-value">{totalHours} hrs</span>
              <span className="fh-tracker-box-sub">
                {project.timeEntries.length} {project.timeEntries.length === 1 ? "entry" : "entries"}
              </span>
            </div>

            <div className="fh-tracker-box">
              <span className="fh-tracker-box-label">Payments</span>
              <span className="fh-tracker-box-value">{totalPayments} records</span>
              <span className="fh-tracker-box-sub">
                {pendingPayments} pending
              </span>
            </div>
          </div>
        </section>
      </div>

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
