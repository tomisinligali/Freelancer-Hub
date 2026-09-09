"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createPaymentAction } from "@/server/actions/payments/create-payment";
import { updatePaymentAction } from "@/server/actions/payments/update-payment";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { FormMessage } from "@/components/ui/FormMessage";

export interface PaymentFormData {
  id: string;
  projectId: string;
  amount: string;
  status: "PENDING" | "PAID";
  dueDate: string;
  paidDate: string | null;
}

export interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  payment?: PaymentFormData | null;
}

export function PaymentModal({
  isOpen,
  onClose,
  projectId,
  payment,
}: PaymentModalProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const isEditing = Boolean(payment);
  const [statusValue, setStatusValue] = useState<"PENDING" | "PAID">(
    payment ? payment.status : "PENDING"
  );

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    const formData = new FormData(e.currentTarget);
    formData.set("projectId", projectId);

    startTransition(async () => {
      const res = isEditing && payment
        ? await updatePaymentAction(payment.id, formData)
        : await createPaymentAction(formData);

      if (!res.success) {
        setError(res.error || "Failed to save payment record.");
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
        aria-labelledby="payment-modal-title"
      >
        <h2 id="payment-modal-title" className="fh-client-modal-title">
          {isEditing ? "Edit Payment Record" : "Record Payment"}
        </h2>

        <FormMessage type="error" message={error} />

        <form onSubmit={handleSubmit} className="fh-modal-form" noValidate>
          <input type="hidden" name="projectId" value={projectId} />

          <Input
            label="Amount (USD)"
            name="amount"
            type="number"
            step="0.01"
            min="0.01"
            defaultValue={payment ? payment.amount : ""}
            placeholder="500.00"
            required
            error={fieldErrors.amount}
            autoFocus
            disabled={isPending}
          />

          <div className="fh-input-group">
            <label htmlFor="payment-status" className="fh-input-label">
              Payment Status
            </label>
            <select
              id="payment-status"
              name="status"
              value={statusValue}
              onChange={e => setStatusValue(e.target.value as "PENDING" | "PAID")}
              className="fh-input fh-select"
              disabled={isPending}
            >
              <option value="PENDING">Pending</option>
              <option value="PAID">Paid</option>
            </select>
          </div>

          <div className="fh-form-row">
            <Input
              label="Due Date"
              name="dueDate"
              type="date"
              defaultValue={payment ? payment.dueDate.split("T")[0] : new Date().toISOString().split("T")[0]}
              required
              error={fieldErrors.dueDate}
              disabled={isPending}
            />

            {statusValue === "PAID" ? (
              <Input
                label="Paid Date"
                name="paidDate"
                type="date"
                defaultValue={
                  payment?.paidDate
                    ? payment.paidDate.split("T")[0]
                    : new Date().toISOString().split("T")[0]
                }
                error={fieldErrors.paidDate}
                disabled={isPending}
              />
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
              {isEditing ? "Save Changes" : "Record Payment"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
