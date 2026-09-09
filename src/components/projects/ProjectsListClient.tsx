"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ProjectFormModal, type ActiveClientOption } from "@/components/projects/ProjectFormModal";
import { ProjectStatusSelect } from "@/components/projects/ProjectStatusSelect";
import { Button } from "@/components/ui/Button";
import type { ProjectStatusType } from "@/lib/validation/project";

export interface ProjectListItem {
  id: string;
  title: string;
  description: string | null;
  status: ProjectStatusType;
  startDate: string | null;
  dueDate: string | null;
  completedAt: string | null;
  updatedAt: string;
  client: {
    id: string;
    name: string;
    archivedAt: string | null;
  } | null;
  _count: {
    timeEntries: number;
    payments: number;
  };
}

export function ProjectsListClient({
  projects,
  activeClients,
}: {
  projects: ProjectListItem[];
  activeClients: ActiveClientOption[];
}) {
  const [statusTab, setStatusTab] = useState<"ALL" | ProjectStatusType>("ALL");
  const [selectedClient, setSelectedClient] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const filteredProjects = projects.filter(p => {
    // Status filter
    if (statusTab !== "ALL" && p.status !== statusTab) {
      return false;
    }
    // Client filter
    if (selectedClient !== "ALL") {
      if (selectedClient === "NO_CLIENT" && p.client !== null) return false;
      if (selectedClient !== "NO_CLIENT" && p.client?.id !== selectedClient) return false;
    }
    // Search term
    if (search.trim()) {
      const term = search.toLowerCase();
      const matchTitle = p.title.toLowerCase().includes(term);
      const matchClient = p.client?.name.toLowerCase().includes(term);
      return matchTitle || matchClient;
    }
    return true;
  });

  const counts = {
    ALL: projects.length,
    IN_PROGRESS: projects.filter(p => p.status === "IN_PROGRESS").length,
    NOT_STARTED: projects.filter(p => p.status === "NOT_STARTED").length,
    DONE: projects.filter(p => p.status === "DONE").length,
    ARCHIVED: projects.filter(p => p.status === "ARCHIVED").length,
  };

  return (
    <div className="fh-projects-container">
      <div className="fh-clients-header">
        <div>
          <h1 className="fh-dashboard-title">Projects</h1>
          <p className="fh-dashboard-subtitle">
            Track client work, timelines, and deliverables.
          </p>
        </div>
        <Button variant="primary" onClick={() => setIsCreateOpen(true)}>
          + New Project
        </Button>
      </div>

      <div className="fh-projects-toolbar">
        <div className="fh-clients-tabs">
          <button
            type="button"
            onClick={() => setStatusTab("ALL")}
            className={`fh-tab-btn ${statusTab === "ALL" ? "fh-tab-btn--active" : ""}`}
          >
            All ({counts.ALL})
          </button>
          <button
            type="button"
            onClick={() => setStatusTab("IN_PROGRESS")}
            className={`fh-tab-btn ${statusTab === "IN_PROGRESS" ? "fh-tab-btn--active" : ""}`}
          >
            In Progress ({counts.IN_PROGRESS})
          </button>
          <button
            type="button"
            onClick={() => setStatusTab("NOT_STARTED")}
            className={`fh-tab-btn ${statusTab === "NOT_STARTED" ? "fh-tab-btn--active" : ""}`}
          >
            Not Started ({counts.NOT_STARTED})
          </button>
          <button
            type="button"
            onClick={() => setStatusTab("DONE")}
            className={`fh-tab-btn ${statusTab === "DONE" ? "fh-tab-btn--active" : ""}`}
          >
            Done ({counts.DONE})
          </button>
          <button
            type="button"
            onClick={() => setStatusTab("ARCHIVED")}
            className={`fh-tab-btn ${statusTab === "ARCHIVED" ? "fh-tab-btn--active" : ""}`}
          >
            Archived ({counts.ARCHIVED})
          </button>
        </div>

        <div className="fh-projects-filters">
          <select
            value={selectedClient}
            onChange={e => setSelectedClient(e.target.value)}
            className="fh-input fh-select fh-select-compact"
          >
            <option value="ALL">All Clients</option>
            <option value="NO_CLIENT">No Client Assigned</option>
            {activeClients.map(c => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Search projects..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="fh-input fh-search-input"
          />
        </div>
      </div>

      {filteredProjects.length === 0 ? (
        <div className="fh-empty-state">
          <p className="fh-empty-state-title">
            {search || statusTab !== "ALL" || selectedClient !== "ALL"
              ? "No projects found matching the selected filters."
              : "No projects created yet."}
          </p>
          {!search && statusTab === "ALL" && selectedClient === "ALL" ? (
            <Button
              variant="primary"
              onClick={() => setIsCreateOpen(true)}
              className="fh-empty-state-btn"
            >
              Create your first project
            </Button>
          ) : null}
        </div>
      ) : (
        <div className="fh-projects-grid">
          {filteredProjects.map(project => (
            <div key={project.id} className="fh-project-card">
              <div className="fh-project-card-top">
                <div className="fh-project-card-heading">
                  <Link
                    href={`/projects/${project.id}`}
                    className="fh-project-card-title-link"
                  >
                    <h3 className="fh-project-card-title">{project.title}</h3>
                  </Link>

                  <div className="fh-project-card-client-row">
                    {project.client ? (
                      <Link
                        href={`/clients/${project.client.id}`}
                        className="fh-project-card-client"
                      >
                        {project.client.name}
                      </Link>
                    ) : (
                      <span className="fh-project-card-no-client">No Client</span>
                    )}

                    {project.client?.archivedAt ? (
                      <span className="fh-badge fh-badge--warning" title="Client relationship is archived">
                        Client archived
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="fh-project-card-status">
                  <ProjectStatusSelect
                    projectId={project.id}
                    currentStatus={project.status}
                  />
                </div>
              </div>

              {project.description ? (
                <p className="fh-project-card-desc">{project.description}</p>
              ) : null}

              <div className="fh-project-card-bottom">
                <div className="fh-project-card-dates">
                  {project.dueDate ? (
                    <span className="fh-project-card-due">
                      Due: {new Date(project.dueDate).toLocaleDateString()}
                    </span>
                  ) : (
                    <span className="fh-project-card-no-due">No due date</span>
                  )}
                </div>

                <Link
                  href={`/projects/${project.id}`}
                  className="fh-project-card-view-link"
                >
                  View details →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      <ProjectFormModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        activeClients={activeClients}
      />
    </div>
  );
}
