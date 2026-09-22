import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import { OUTAGE_LABELS } from "../lib/constants";
import type {
  AdminOverview,
  AdminReport,
  AdminUser,
  Incident,
  IncidentStatus,
  OutageType,
} from "../types";

type Tab = "users" | "reports" | "incidents";

const EMPTY_OVERVIEW: AdminOverview = {
  users: 0,
  reports: 0,
  activeIncidents: 0,
  resolvedIncidents: 0,
  admins: 0,
};

export default function AdminPage() {
  const { profile, loading } = useAuth();
  const [tab, setTab] = useState<Tab>("reports");
  const [overview, setOverview] = useState<AdminOverview>(EMPTY_OVERVIEW);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  async function reload() {
    const [nextOverview, nextUsers, nextReports, nextIncidents] = await Promise.all([
      api.adminOverview() as Promise<AdminOverview>,
      api.adminUsers() as Promise<AdminUser[]>,
      api.adminReports() as Promise<AdminReport[]>,
      api.adminIncidents() as Promise<Incident[]>,
    ]);
    setOverview(nextOverview);
    setUsers(nextUsers);
    setReports(nextReports);
    setIncidents(nextIncidents);
  }

  useEffect(() => {
    if (!profile?.isAdmin) return;
    reload().catch((err) =>
      setError(err instanceof Error ? err.message : "Failed to load admin data")
    );
  }, [profile?.isAdmin]);

  if (loading) return <p className="text-stone-500">Loading...</p>;
  if (!profile?.isAdmin) return <Navigate to="/" replace />;

  async function run(label: string, task: () => Promise<void>) {
    setBusy(label);
    setError(null);
    try {
      await task();
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="stamp text-[var(--cedar-green)]">Watch command</p>
        <h1 className="font-display mt-2 text-3xl text-[var(--cedar-dark)] sm:text-4xl">
          Admin
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-stone-600">
          See who filed each report, edit or delete records, and manage lookout
          accounts.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Stat label="Accounts" value={overview.users} />
        <Stat label="Reports" value={overview.reports} />
        <Stat label="Active" value={overview.activeIncidents} />
        <Stat label="Resolved" value={overview.resolvedIncidents} />
        <Stat label="Admins" value={overview.admins} />
      </div>

      <div className="flex flex-wrap gap-2">
        {(["reports", "users", "incidents"] as Tab[]).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setTab(item)}
            className={`min-h-11 rounded-full px-4 text-sm font-semibold capitalize ${
              tab === item
                ? "bg-[var(--cedar-dark)] text-[#fff8e7]"
                : "border border-[var(--cedar-dark)]/15"
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      {error && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>
      )}

      {tab === "reports" && (
        <ReportsPanel
          reports={reports}
          busy={busy}
          onSave={(id, payload) =>
            run(`report-${id}`, async () => {
              await api.adminUpdateReport(id, payload);
            })
          }
          onDelete={(id) =>
            run(`del-report-${id}`, async () => {
              await api.adminDeleteReport(id);
            })
          }
        />
      )}
      {tab === "users" && (
        <UsersPanel
          users={users}
          busy={busy}
          onSave={(id, payload) =>
            run(`user-${id}`, async () => {
              await api.adminUpdateUser(id, payload);
            })
          }
          onDelete={(id) =>
            run(`del-user-${id}`, async () => {
              await api.adminDeleteUser(id);
            })
          }
        />
      )}
      {tab === "incidents" && (
        <IncidentsPanel
          incidents={incidents}
          busy={busy}
          onSave={(id, payload) =>
            run(`incident-${id}`, async () => {
              await api.adminUpdateIncident(id, payload);
            })
          }
          onDelete={(id) =>
            run(`del-incident-${id}`, async () => {
              await api.adminDeleteIncident(id);
            })
          }
        />
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="ticket px-4 py-4">
      <p className="pl-3 text-xs uppercase tracking-[0.16em] text-stone-500">{label}</p>
      <p className="font-display mt-1 pl-3 text-3xl">{value}</p>
    </div>
  );
}

function ReportsPanel({
  reports,
  busy,
  onSave,
  onDelete,
}: {
  reports: AdminReport[];
  busy: string | null;
  onSave: (id: number, payload: Partial<AdminReport>) => void;
  onDelete: (id: number) => void;
}) {
  if (reports.length === 0) {
    return <p className="panel p-6 text-sm text-stone-500">No reports yet.</p>;
  }
  return (
    <div className="space-y-3">
      {reports.map((report) => (
        <ReportEditor
          key={report.id}
          report={report}
          busy={busy}
          onSave={onSave}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}

function ReportEditor({
  report,
  busy,
  onSave,
  onDelete,
}: {
  report: AdminReport;
  busy: string | null;
  onSave: (id: number, payload: Partial<AdminReport>) => void;
  onDelete: (id: number) => void;
}) {
  const [area, setArea] = useState(report.area ?? "");
  const [description, setDescription] = useState(report.description ?? "");
  const [type, setType] = useState<OutageType>(report.type);

  useEffect(() => {
    setArea(report.area ?? "");
    setDescription(report.description ?? "");
    setType(report.type);
  }, [report]);

  const reporter =
    report.reporterName || report.reporterEmail || report.userId || "Unknown reporter";

  return (
    <article className="ticket p-4 pl-5">
      <p className="text-xs uppercase tracking-[0.16em] text-stone-500">
        Report #{report.id} · incident {report.incidentId ?? "—"}
      </p>
      <p className="mt-1 text-sm">
        Filed by <span className="font-semibold">{reporter}</span>
        {report.reporterEmail && report.reporterName ? ` · ${report.reporterEmail}` : ""}
      </p>
      <p className="mt-1 text-xs text-stone-500">
        {new Date(report.createdAt).toLocaleString()} · {report.confirmationCount}{" "}
        confirmations
      </p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <select
          className="field"
          value={type}
          onChange={(e) => setType(e.target.value as OutageType)}
        >
          {(Object.keys(OUTAGE_LABELS) as OutageType[]).map((item) => (
            <option key={item} value={item}>
              {OUTAGE_LABELS[item]}
            </option>
          ))}
        </select>
        <input
          className="field"
          value={area}
          onChange={(e) => setArea(e.target.value)}
          placeholder="Area"
        />
      </div>
      <textarea
        className="field mt-2"
        rows={2}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description"
      />
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy !== null}
          className="btn-primary disabled:opacity-60"
          onClick={() => onSave(report.id, { type, area, description })}
        >
          {busy === `report-${report.id}` ? "Saving..." : "Save"}
        </button>
        <button
          type="button"
          disabled={busy !== null}
          className="min-h-11 rounded-full border border-red-300 px-4 text-sm font-medium text-red-800 disabled:opacity-60"
          onClick={() => {
            if (confirm(`Delete report #${report.id}?`)) onDelete(report.id);
          }}
        >
          Delete
        </button>
      </div>
    </article>
  );
}

function UsersPanel({
  users,
  busy,
  onSave,
  onDelete,
}: {
  users: AdminUser[];
  busy: string | null;
  onSave: (id: string, payload: { displayName?: string; area?: string; isAdmin?: boolean }) => void;
  onDelete: (id: string) => void;
}) {
  if (users.length === 0) {
    return (
      <p className="panel p-6 text-sm text-stone-500">
        No profiles yet. Accounts appear after someone signs in.
      </p>
    );
  }
  return (
    <div className="space-y-3">
      {users.map((user) => (
        <UserEditor
          key={user.id}
          user={user}
          busy={busy}
          onSave={onSave}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}

function UserEditor({
  user,
  busy,
  onSave,
  onDelete,
}: {
  user: AdminUser;
  busy: string | null;
  onSave: (id: string, payload: { displayName?: string; area?: string; isAdmin?: boolean }) => void;
  onDelete: (id: string) => void;
}) {
  const [displayName, setDisplayName] = useState(user.displayName ?? "");
  const [area, setArea] = useState(user.area ?? "");

  useEffect(() => {
    setDisplayName(user.displayName ?? "");
    setArea(user.area ?? "");
  }, [user]);

  return (
    <article className="ticket p-4 pl-5">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="font-display text-xl">{user.displayName || user.email || user.id}</h3>
        {user.isAdmin && <span className="stamp text-[var(--cedar-green)]">Admin</span>}
      </div>
      <p className="mt-1 text-sm text-stone-600">{user.email ?? "No email on file"}</p>
      <p className="mt-1 text-xs text-stone-500">
        {user.reportCount} reports · {user.confirmationCount} confirmations
      </p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <input
          className="field"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Display name"
        />
        <input
          className="field"
          value={area}
          onChange={(e) => setArea(e.target.value)}
          placeholder="Neighborhood"
        />
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy !== null}
          className="btn-primary disabled:opacity-60"
          onClick={() => onSave(user.id, { displayName, area })}
        >
          Save
        </button>
        {!user.bootstrapAdmin && (
          <button
            type="button"
            disabled={busy !== null}
            className="min-h-11 rounded-full border border-[var(--cedar-dark)]/20 px-4 text-sm font-medium disabled:opacity-60"
            onClick={() => onSave(user.id, { isAdmin: !user.isAdmin })}
          >
            {user.isAdmin ? "Remove admin" : "Make admin"}
          </button>
        )}
        {!user.bootstrapAdmin && (
          <button
            type="button"
            disabled={busy !== null}
            className="min-h-11 rounded-full border border-red-300 px-4 text-sm font-medium text-red-800 disabled:opacity-60"
            onClick={() => {
              if (confirm(`Delete account ${user.email ?? user.id}?`)) onDelete(user.id);
            }}
          >
            Delete
          </button>
        )}
      </div>
    </article>
  );
}

function IncidentsPanel({
  incidents,
  busy,
  onSave,
  onDelete,
}: {
  incidents: Incident[];
  busy: string | null;
  onSave: (id: number, payload: { status?: IncidentStatus; area?: string }) => void;
  onDelete: (id: number) => void;
}) {
  if (incidents.length === 0) {
    return <p className="panel p-6 text-sm text-stone-500">No incidents yet.</p>;
  }
  return (
    <div className="space-y-3">
      {incidents.map((incident) => (
        <article key={incident.id} className="ticket p-4 pl-5">
          <p className="text-xs uppercase tracking-[0.16em] text-stone-500">
            Incident #{incident.id} · {OUTAGE_LABELS[incident.type]}
          </p>
          <h3 className="font-display mt-1 text-xl">{incident.area ?? "Unknown area"}</h3>
          <p className="mt-1 text-xs text-stone-500">
            {incident.status} · {incident.confidence} · {incident.reportCount} reports
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy !== null}
              className="min-h-11 rounded-full border border-[var(--cedar-dark)]/20 px-4 text-sm font-medium disabled:opacity-60"
              onClick={() =>
                onSave(incident.id, {
                  status: incident.status === "ACTIVE" ? "RESOLVED" : "ACTIVE",
                })
              }
            >
              {incident.status === "ACTIVE" ? "Mark resolved" : "Reopen"}
            </button>
            <button
              type="button"
              disabled={busy !== null}
              className="min-h-11 rounded-full border border-red-300 px-4 text-sm font-medium text-red-800 disabled:opacity-60"
              onClick={() => {
                if (confirm(`Delete incident #${incident.id} and its reports?`)) {
                  onDelete(incident.id);
                }
              }}
            >
              Delete
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}
