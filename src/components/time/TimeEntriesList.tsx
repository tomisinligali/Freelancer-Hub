"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteTimeEntryAction } from "@/server/actions/time/delete-time-entry";
import { TimeEntryModal, type TimeEntryFormData } from "@/components/time/TimeEntryModal";
import { formatMinutes } from "@/lib/validation/time";
import { Button } from "@/components/ui/Button";

export interface TimeEntryItem {
  id: string;
  projectId: string;
  date: string;
  minutes: number;
  note: string | null;
}

export function TimeEntriesList({
  projectId,
  entries,
}: {
  projectId: string;
  entries: TimeEntryItem[];
}) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimeEntryFormData | null>(null);
  const [isPending, startTransition] = useTransition();

  const totalMinutes = entries.reduce((acc, curr) => acc + curr.minutes, 0);

  const handleEdit = (entry: TimeEntryItem) => {
    setEditingEntry(entry);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setEditingEntry(null);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this time entry?")) {
      startTransition(async () => {
        await deleteTimeEntryAction(id, projectId);
        router.refresh();
      });
    }
  };

  return (
    <div className="fh-tracker-section">
      <div className="fh-tracker-header">
        <div>
          <h3 className="fh-tracker-title">Time Log</h3>
          <p className="fh-tracker-subtitle">
            Total logged: <strong>{formatMinutes(totalMinutes)}</strong> ({((totalMinutes / 60)).toFixed(1)} hours)
          </p>
        </div>
        <Button variant="primary" onClick={handleCreate}>
          + Log Time
        </Button>
      </div>

      {entries.length === 0 ? (
        <div className="fh-empty-state">
          <p className="fh-empty-state-title">No time logged for this project yet.</p>
          <Button variant="primary" onClick={handleCreate} className="fh-empty-state-btn">
            Log your first entry
          </Button>
        </div>
      ) : (
        <div className="fh-table-wrapper">
          <table className="fh-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Duration</th>
                <th>Note</th>
                <th className="fh-table-actions-header">Actions</th>
              </tr>
            </thead>
            <tbody>
              {entries.map(entry => (
                <tr key={entry.id}>
                  <td className="fh-table-date">
                    {new Date(entry.date).toLocaleDateString()}
                  </td>
                  <td className="fh-table-duration">
                    <span className="fh-duration-pill">{formatMinutes(entry.minutes)}</span>
                  </td>
                  <td className="fh-table-note">
                    {entry.note || <span className="fh-text-muted">—</span>}
                  </td>
                  <td className="fh-table-actions">
                    <button
                      type="button"
                      onClick={() => handleEdit(entry)}
                      className="fh-table-action-btn"
                      disabled={isPending}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(entry.id)}
                      className="fh-table-action-btn fh-table-action-btn--delete"
                      disabled={isPending}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <TimeEntryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        projectId={projectId}
        entry={editingEntry}
      />
    </div>
  );
}
