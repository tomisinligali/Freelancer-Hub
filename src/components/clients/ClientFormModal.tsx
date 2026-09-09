"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClientAction } from "@/server/actions/clients/create-client";
import { updateClientAction } from "@/server/actions/clients/update-client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { FormMessage } from "@/components/ui/FormMessage";

export interface ClientFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  client?: {
    id: string;
    name: string;
    email: string | null;
    notes: string | null;
  } | null;
}

export function ClientFormModal({ isOpen, onClose, client }: ClientFormModalProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const isEditing = Boolean(client);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const res = isEditing && client
        ? await updateClientAction(client.id, formData)
        : await createClientAction(formData);

      if (!res.success) {
        setError(res.error || "Failed to save client.");
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
        aria-labelledby="client-modal-title"
      >
        <h2 id="client-modal-title" className="fh-client-modal-title">
          {isEditing ? "Edit Client" : "New Client"}
        </h2>

        <FormMessage type="error" message={error} />

        <form onSubmit={handleSubmit} className="fh-modal-form" noValidate>
          <Input
            label="Client Name"
            name="name"
            defaultValue={client?.name || ""}
            placeholder="Acme Inc."
            required
            error={fieldErrors.name}
            autoFocus
            disabled={isPending}
          />

          <Input
            label="Email Address (optional)"
            name="email"
            type="email"
            defaultValue={client?.email || ""}
            placeholder="contact@acme.com"
            error={fieldErrors.email}
            disabled={isPending}
          />

          <div className="fh-input-group">
            <label htmlFor="client-notes" className="fh-input-label">
              Notes (optional)
            </label>
            <textarea
              id="client-notes"
              name="notes"
              defaultValue={client?.notes || ""}
              placeholder="Important client preferences, invoicing details, or contact notes..."
              rows={3}
              className="fh-textarea"
              disabled={isPending}
            />
            {fieldErrors.notes ? (
              <span className="fh-input-error-text" role="alert">
                {fieldErrors.notes}
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
              {isEditing ? "Save Changes" : "Create Client"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
