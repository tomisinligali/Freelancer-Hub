"use client";

import React, { useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateProjectStatusAction } from "@/server/actions/projects/update-status";
import type { ProjectStatusType } from "@/lib/validation/project";

export interface ProjectStatusSelectProps {
  projectId: string;
  currentStatus: ProjectStatusType;
}

export function ProjectStatusSelect({
  projectId,
  currentStatus,
}: ProjectStatusSelectProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value as ProjectStatusType;
    startTransition(async () => {
      await updateProjectStatusAction(projectId, newStatus);
      router.refresh();
    });
  };

  return (
    <div className="fh-status-select-wrapper">
      <select
        value={currentStatus}
        onChange={handleChange}
        disabled={isPending}
        className={`fh-status-select fh-status-select--${currentStatus.toLowerCase()}`}
        aria-label="Change project status"
      >
        <option value="NOT_STARTED">Not Started</option>
        <option value="IN_PROGRESS">In Progress</option>
        <option value="DONE">Done</option>
        <option value="ARCHIVED">Archived</option>
      </select>
      {isPending ? <span className="fh-spinner-inline" /> : null}
    </div>
  );
}
