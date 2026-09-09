"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createProjectAction } from "@/server/actions/projects/create-project";
import { updateProjectAction } from "@/server/actions/projects/update-project";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { FormMessage } from "@/components/ui/FormMessage";

export interface ActiveClientOption {
  id: string;
  name: string;
}

export interface ProjectFormData {
  id: string;
  title: string;
  description: string | null;
  clientId: string | null;
  status: "NOT_STARTED" | "IN_PROGRESS" | "DONE" | "ARCHIVED";
  startDate: string | null;
  dueDate: string | null;
}

export interface ProjectFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  project?: ProjectFormData | null;
  activeClients: ActiveClientOption[];
  defaultClientId?: string;
}

export function ProjectFormModal({
  isOpen,
  onClose,
  project,
  activeClients,
  defaultClientId,
}: ProjectFormModalProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const isEditing = Boolean(project);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const res = isEditing && project
        ? await updateProjectAction(project.id, formData)
        : await createProjectAction(formData);

      if (!res.success) {
        setError(res.error || "Failed to save project.");
        if (res.fieldErrors) {
          setFieldErrors(res.fieldErrors);
        }
      } else {
        onClose();
        router.refresh();
      }
    });
  };

  const initialClientId = project ? (project.clientId || "none") : (defaultClientId || "none");

  return (
    <div className="fh-modal-backdrop" onClick={onClose}>
      <div
        className="fh-modal-card"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="project-modal-title"
      >
        <h2 id="project-modal-title" className="fh-client-modal-title">
          {isEditing ? "Edit Project" : "New Project"}
        </h2>

        <FormMessage type="error" message={error} />

        <form onSubmit={handleSubmit} className="fh-modal-form" noValidate>
          <Input
            label="Project Title"
            name="title"
            defaultValue={project?.title || ""}
            placeholder="e.g. Website Redesign & SEO"
            required
            error={fieldErrors.title}
            autoFocus
            disabled={isPending}
          />

          <div className="fh-input-group">
            <label htmlFor="project-client" className="fh-input-label">
              Client (optional)
            </label>
            <select
              id="project-client"
              name="clientId"
              defaultValue={initialClientId}
              className="fh-input fh-select"
              disabled={isPending}
            >
              <option value="none">No Client</option>
              {activeClients.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            {fieldErrors.clientId ? (
              <span className="fh-input-error-text" role="alert">
                {fieldErrors.clientId}
              </span>
            ) : null}
          </div>

          <div className="fh-input-group">
            <label htmlFor="project-status" className="fh-input-label">
              Status
            </label>
            <select
              id="project-status"
              name="status"
              defaultValue={project?.status || "NOT_STARTED"}
              className="fh-input fh-select"
              disabled={isPending}
            >
              <option value="NOT_STARTED">Not Started</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="DONE">Done</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>

          <div className="fh-form-row">
            <Input
              label="Start Date (optional)"
              name="startDate"
              type="date"
              defaultValue={project?.startDate ? project.startDate.split("T")[0] : ""}
              error={fieldErrors.startDate}
              disabled={isPending}
            />

            <Input
              label="Due Date (optional)"
              name="dueDate"
              type="date"
              defaultValue={project?.dueDate ? project.dueDate.split("T")[0] : ""}
              error={fieldErrors.dueDate}
              disabled={isPending}
            />
          </div>

          <div className="fh-input-group">
            <label htmlFor="project-desc" className="fh-input-label">
              Description (optional)
            </label>
            <textarea
              id="project-desc"
              name="description"
              defaultValue={project?.description || ""}
              placeholder="Scope, deliverables, milestones..."
              rows={3}
              className="fh-textarea"
              disabled={isPending}
            />
            {fieldErrors.description ? (
              <span className="fh-input-error-text" role="alert">
                {fieldErrors.description}
              </span>
            ) : null}
          </div>

          <div className="fh-modal-actions">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isPending}
            >
              {isEditing ? "Save Changes" : "Create Project"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
