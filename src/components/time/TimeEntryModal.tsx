"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createTimeEntryAction } from "@/server/actions/time/create-time-entry";
import { updateTimeEntryAction } from "@/server/actions/time/update-time-entry";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { FormMessage } from "@/components/ui/FormMessage";

export interface TimeEntryFormData {
  id: string;
  projectId: string;
  date: string;
  minutes: number;
  note: string | null;
}

export interface TimeEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  entry?: TimeEntryFormData | null;
}

export function TimeEntryModal({
  isOpen,
  onClose,
  projectId,
  entry,
}: TimeEntryModalProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const isEditing = Boolean(entry);

  const initialMinutes = entry ? entry.minutes : 60;
  const [minutesValue, setMinutesValue] = useState<number>(initialMinutes);

  if (!isOpen) return null;

  const hoursDisplay = (minutesValue / 60).toFixed(1);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    const formData = new FormData(e.currentTarget);
    formData.set("projectId", projectId);

    startTransition(async () => {
      const res = isEditing && entry
        ? await updateTimeEntryAction(entry.id, formData)
        : await createTimeEntryAction(formData);

      if (!res.success) {
        setError(res.error || "Failed to save time entry.");
        if (res.fieldErrors) {
          setFieldErrors(res.fieldErrors);
        }
      } else {
        onClose();
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
        aria-labelledby="time-modal-title"
      >
        <h2 id="time-modal-title" className="fh-client-modal-title">
          {isEditing ? "Edit Time Entry" : "Log Time"}
        </h2>

        <FormMessage type="error" message={error} />

        <form onSubmit={handleSubmit} className="fh-modal-form" noValidate>
          <input type="hidden" name="projectId" value={projectId} />

          <Input
            label="Date"
            name="date"
            type="date"
            defaultValue={entry ? entry.date.split("T")[0] : new Date().toISOString().split("T")[0]}
            required
            error={fieldErrors.date}
            disabled={isPending}
          />

          <div className="fh-input-group">
            <div className="fh-duration-label-row">
              <label htmlFor="time-minutes" className="fh-input-label">
                Duration (minutes)
              </label>
              <span className="fh-duration-helper">≈ {hoursDisplay} hrs</span>
            </div>

            <input
              id="time-minutes"
              name="minutes"
              type="number"
              min={1}
              max={1440}
              step={1}
              value={minutesValue}
              onChange={e => setMinutesValue(parseInt(e.target.value) || 0)}
              className="fh-input"
              required
              disabled={isPending}
            />
            {fieldErrors.minutes ? (
              <span className="fh-input-error-text" role="alert">
                {fieldErrors.minutes}
              </span>
            ) : (
              <span className="fh-input-helper-text">
                Enter duration in minutes (max 1,440 min / 24 hrs)
              </span>
            )}
          </div>

          <div className="fh-quick-minutes-row">
            {[15, 30, 45, 60, 90, 120, 180, 240].map(m => (
              <button
                key={m}
                type="button"
                onClick={() => setMinutesValue(m)}
                className={`fh-quick-minute-btn ${minutesValue === m ? "fh-quick-minute-btn--active" : ""}`}
                disabled={isPending}
              >
                {m < 60 ? `${m}m` : `${m / 60}h`}
              </button>
            ))}
          </div>

          <div className="fh-input-group">
            <label htmlFor="time-note" className="fh-input-label">
              Note (optional)
            </label>
            <textarea
              id="time-note"
              name="note"
              defaultValue={entry?.note || ""}
              placeholder="What did you work on? (tasks, revisions, research...)"
              rows={3}
              className="fh-textarea"
              disabled={isPending}
            />
            {fieldErrors.note ? (
              <span className="fh-input-error-text" role="alert">
                {fieldErrors.note}
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
              {isEditing ? "Save Changes" : "Log Time"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
