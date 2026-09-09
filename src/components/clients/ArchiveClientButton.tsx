"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { archiveClientAction } from "@/server/actions/clients/archive-client";
import { restoreClientAction } from "@/server/actions/clients/restore-client";
import { Button } from "@/components/ui/Button";

export interface ArchiveClientButtonProps {
  clientId: string;
  isArchived: boolean;
  clientName: string;
}

export function ArchiveClientButton({
  clientId,
  isArchived,
  clientName,
}: ArchiveClientButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showConfirm, setShowConfirm] = useState(false);

  const handleAction = () => {
    startTransition(async () => {
      if (isArchived) {
        await restoreClientAction(clientId);
      } else {
        await archiveClientAction(clientId);
      }
      setShowConfirm(false);
      router.refresh();
    });
  };

  if (isArchived) {
    return (
      <Button
        variant="secondary"
        onClick={handleAction}
        isLoading={isPending}
        className="fh-btn-restore"
      >
        Restore Client
      </Button>
    );
  }

  return (
    <>
      <Button
        variant="secondary"
        onClick={() => setShowConfirm(true)}
        disabled={isPending}
        className="fh-btn-archive"
      >
        Archive Client
      </Button>

      {showConfirm ? (
        <div className="fh-modal-backdrop" onClick={() => setShowConfirm(false)}>
          <div
            className="fh-modal-card"
            onClick={e => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="archive-modal-title"
          >
            <h2 id="archive-modal-title" className="fh-modal-title" style={{ color: "var(--color-on-surface)" }}>
              Archive Client
            </h2>
            <p className="fh-modal-description">
              Are you sure you want to archive <strong>{clientName}</strong>?
            </p>
            <p className="fh-modal-description" style={{ fontSize: "13px", color: "var(--color-on-surface-varaint)" }}>
              • All existing linked projects remain active and completely intact.<br />
              • You can restore this client at any time.<br />
              • Archived clients will not appear in the new project client selector.
            </p>

            <div className="fh-modal-actions">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowConfirm(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={handleAction}
                isLoading={isPending}
              >
                Confirm Archive
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
