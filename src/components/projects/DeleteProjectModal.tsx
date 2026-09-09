"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteProjectAction } from "@/server/actions/projects/delete-project";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { FormMessage } from "@/components/ui/FormMessage";

export interface DeleteProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectTitle: string;
}

export function DeleteProjectModal({
  isOpen,
  onClose,
  projectId,
  projectTitle,
}: DeleteProjectModalProps) {
  const router = useRouter();
  const [confirmationInput, setConfirmationInput] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const isMatch = confirmationInput.trim() === projectTitle.trim();

  const handleDelete = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isMatch) {
      setError("Entered title does not match the project title.");
      return;
    }

    startTransition(async () => {
      const res = await deleteProjectAction(projectId, confirmationInput);
      if (!res.success) {
        setError(res.error || "Failed to delete project.");
      } else {
        onClose();
        router.push("/projects");
        router.refresh();
      }
    });
  };

  return (
    <div className="fh-modal-backdrop" onClick={onClose}>
      <div
        className="fh-modal-card"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-project-title"
      >
        <h2 id="delete-project-title" className="fh-modal-title">
          Delete Project
        </h2>

        <p className="fh-modal-description">
          This action will permanently delete <strong>{projectTitle}</strong> and all of its associated time entries and payment records. This action cannot be undone.
        </p>

        <FormMessage type="error" message={error} />

        <form onSubmit={handleDelete} className="fh-modal-form">
          <Input
            label={`To confirm, type "${projectTitle}" below:`}
            value={confirmationInput}
            onChange={e => setConfirmationInput(e.target.value)}
            placeholder={projectTitle}
            autoFocus
            disabled={isPending}
          />

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
              disabled={!isMatch || isPending}
              className="fh-button--danger"
            >
              Delete Project
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
