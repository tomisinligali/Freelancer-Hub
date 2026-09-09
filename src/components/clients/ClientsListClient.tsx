"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ClientFormModal } from "@/components/clients/ClientFormModal";
import { Button } from "@/components/ui/Button";

export interface ClientItem {
  id: string;
  name: string;
  email: string | null;
  notes: string | null;
  archivedAt: string | null;
  createdAt: string;
  _count: {
    projects: number;
  };
}

export function ClientsListClient({
  activeClients,
  archivedClients,
}: {
  activeClients: ClientItem[];
  archivedClients: ClientItem[];
}) {
  const [tab, setTab] = useState<"active" | "archived">("active");
  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const currentList = tab === "active" ? activeClients : archivedClients;

  const filteredClients = currentList.filter(client => {
    const term = search.toLowerCase().trim();
    if (!term) return true;
    return (
      client.name.toLowerCase().includes(term) ||
      (client.email && client.email.toLowerCase().includes(term))
    );
  });

  return (
    <div className="fh-clients-container">
      <div className="fh-clients-header">
        <div>
          <h1 className="fh-dashboard-title">Clients</h1>
          <p className="fh-dashboard-subtitle">
            Manage your clients and view their project history.
          </p>
        </div>
        <Button variant="primary" onClick={() => setIsCreateOpen(true)}>
          + New Client
        </Button>
      </div>

      <div className="fh-clients-toolbar">
        <div className="fh-clients-tabs">
          <button
            type="button"
            onClick={() => setTab("active")}
            className={`fh-tab-btn ${tab === "active" ? "fh-tab-btn--active" : ""}`}
          >
            Active ({activeClients.length})
          </button>
          <button
            type="button"
            onClick={() => setTab("archived")}
            className={`fh-tab-btn ${tab === "archived" ? "fh-tab-btn--active" : ""}`}
          >
            Archived ({archivedClients.length})
          </button>
        </div>

        <div className="fh-clients-search-box">
          <input
            type="text"
            placeholder="Search clients by name or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="fh-input fh-search-input"
          />
        </div>
      </div>

      {filteredClients.length === 0 ? (
        <div className="fh-empty-state">
          <p className="fh-empty-state-title">
            {search
              ? "No clients found matching your search."
              : tab === "active"
              ? "No active clients yet."
              : "No archived clients."}
          </p>
          {!search && tab === "active" ? (
            <Button
              variant="primary"
              onClick={() => setIsCreateOpen(true)}
              className="fh-empty-state-btn"
            >
              Add your first client
            </Button>
          ) : null}
        </div>
      ) : (
        <div className="fh-clients-grid">
          {filteredClients.map(client => (
            <Link
              key={client.id}
              href={`/clients/${client.id}`}
              className="fh-client-card"
            >
              <div className="fh-client-card-header">
                <h3 className="fh-client-card-name">{client.name}</h3>
                {client.archivedAt ? (
                  <span className="fh-badge fh-badge--archived">Archived</span>
                ) : null}
              </div>

              {client.email ? (
                <p className="fh-client-card-email">{client.email}</p>
              ) : (
                <p className="fh-client-card-email fh-client-card-email--empty">
                  No email provided
                </p>
              )}

              {client.notes ? (
                <p className="fh-client-card-notes">{client.notes}</p>
              ) : null}

              <div className="fh-client-card-footer">
                <span className="fh-client-card-projects">
                  {client._count.projects === 1
                    ? "1 project"
                    : `${client._count.projects} projects`}
                </span>
                <span className="fh-client-card-arrow">View details →</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      <ClientFormModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />
    </div>
  );
}
