"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { togglePaymentStatusAction } from "@/server/actions/payments/toggle-payment-status";
import { deletePaymentAction } from "@/server/actions/payments/delete-payment";
import { PaymentModal, type PaymentFormData } from "@/components/payments/PaymentModal";
import { formatCurrency } from "@/lib/validation/payment";
import { Button } from "@/components/ui/Button";

export interface PaymentItem {
  id: string;
  projectId: string;
  amount: string;
  status: "PENDING" | "PAID";
  dueDate: string;
  paidDate: string | null;
}

export function PaymentsList({
  projectId,
  payments,
}: {
  projectId: string;
  payments: PaymentItem[];
}) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<PaymentFormData | null>(null);
  const [isPending, startTransition] = useTransition();

  const totalOutstanding = payments
    .filter(p => p.status === "PENDING")
    .reduce((sum, p) => sum + parseFloat(p.amount), 0);

  const totalPaid = payments
    .filter(p => p.status === "PAID")
    .reduce((sum, p) => sum + parseFloat(p.amount), 0);

  const handleEdit = (payment: PaymentItem) => {
    setEditingPayment(payment);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setEditingPayment(null);
    setIsModalOpen(true);
  };

  const handleToggle = (paymentId: string) => {
    startTransition(async () => {
      await togglePaymentStatusAction(paymentId, projectId);
      router.refresh();
    });
  };

  const handleDelete = (paymentId: string) => {
    if (confirm("Are you sure you want to delete this payment record?")) {
      startTransition(async () => {
        await deletePaymentAction(paymentId, projectId);
        router.refresh();
      });
    }
  };

  return (
    <div className="fh-tracker-section">
      <div className="fh-tracker-header">
        <div className="fh-ledger-totals-summary">
          <div>
            <h3 className="fh-tracker-title">Payment Ledger</h3>
            <p className="fh-tracker-subtitle">
              {payments.length} {payments.length === 1 ? "record" : "records"} recorded
            </p>
          </div>
          <div className="fh-ledger-stats-pills">
            <span className="fh-stat-pill fh-stat-pill--pending">
              Outstanding: <strong>{formatCurrency(totalOutstanding)}</strong>
            </span>
            <span className="fh-stat-pill fh-stat-pill--paid">
              Paid: <strong>{formatCurrency(totalPaid)}</strong>
            </span>
          </div>
        </div>

        <Button variant="primary" onClick={handleCreate}>
          + Record Payment
        </Button>
      </div>

      {payments.length === 0 ? (
        <div className="fh-empty-state">
          <p className="fh-empty-state-title">No payment records for this project yet.</p>
          <Button variant="primary" onClick={handleCreate} className="fh-empty-state-btn">
            Record your first payment
          </Button>
        </div>
      ) : (
        <div className="fh-table-wrapper">
          <table className="fh-table">
            <thead>
              <tr>
                <th>Amount</th>
                <th>Status</th>
                <th>Due Date</th>
                <th>Paid Date</th>
                <th className="fh-table-actions-header">Actions</th>
              </tr>
            </thead>
            <tbody>
              {payments.map(payment => {
                const isPaid = payment.status === "PAID";
                return (
                  <tr key={payment.id}>
                    <td className="fh-table-amount">
                      <strong>{formatCurrency(payment.amount)}</strong>
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={() => handleToggle(payment.id)}
                        disabled={isPending}
                        className={`fh-badge fh-badge--interactive ${
                          isPaid ? "fh-badge--active" : "fh-badge--warning"
                        }`}
                        title="Click to toggle payment status"
                      >
                        {isPaid ? "✓ PAID" : "⏳ PENDING"}
                      </button>
                    </td>
                    <td className="fh-table-date">
                      {new Date(payment.dueDate).toLocaleDateString()}
                    </td>
                    <td className="fh-table-date">
                      {payment.paidDate ? (
                        <span style={{ color: "var(--color-success)" }}>
                          {new Date(payment.paidDate).toLocaleDateString()}
                        </span>
                      ) : (
                        <span className="fh-text-muted">—</span>
                      )}
                    </td>
                    <td className="fh-table-actions">
                      <button
                        type="button"
                        onClick={() => handleEdit(payment)}
                        className="fh-table-action-btn"
                        disabled={isPending}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(payment.id)}
                        className="fh-table-action-btn fh-table-action-btn--delete"
                        disabled={isPending}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <PaymentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        projectId={projectId}
        payment={editingPayment}
      />
    </div>
  );
}
