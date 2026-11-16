import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Plus, Search, FolderKanban, PlayCircle, CheckCircle, IndianRupee,
  AlertTriangle, CheckCircle2, XCircle,
} from "lucide-react";
import { projectApi } from "../projectApi";
import { customerApi } from "../../customers/customerApi";
import type { Customer } from "../../customers/customerTypes";
import { PROJECT_STATUSES, resolveCustomer, type Project, type ProjectPayload } from "../projectTypes";
import ProjectTable from "../components/ProjectTable";
import ProjectForm from "../components/ProjectForm";
import { formatCurrency, getErrorMessage } from "../../../utils/helpers";
import "../../customers/CustomerManagement.css"; // shared drawer/table/card styles
import "../ProjectManagement.css";

type Filter = "All" | (typeof PROJECT_STATUSES)[number];

export default function ProjectManagement() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("All");

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [deleting, setDeleting] = useState<Project | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const notify = (type: "success" | "error", text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 3500);
  };

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [p, c] = await Promise.all([projectApi.getAll(), customerApi.getAll()]);
      setProjects(p);
      setCustomers(c);
    } catch (e) {
      notify("error", getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const stats = useMemo(
    () => ({
      total: projects.length,
      inProgress: projects.filter((p) => p.projectStatus === "In Progress").length,
      completed: projects.filter((p) => p.projectStatus === "Completed").length,
      value: projects.reduce((sum, p) => sum + (p.poValue || 0), 0),
    }),
    [projects]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return projects.filter((p) => {
      if (filter !== "All" && p.projectStatus !== filter) return false;
      if (!q) return true;
      const customer = resolveCustomer(p, customers);
      return [
        p.projectCode,
        p.projectName,
        p.customerPONumber,
        p.siteLocation,
        customer?.customerLegalName,
        customer?.customerCode,
      ]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [projects, customers, search, filter]);

  // next code like PRJ-004
  const nextCode = useMemo(() => {
    const nums = projects
      .map((p) => parseInt(p.projectCode.replace(/\D/g, ""), 10))
      .filter((n) => !isNaN(n));
    const next = (nums.length ? Math.max(...nums) : 0) + 1;
    return `PRJ-${String(next).padStart(3, "0")}`;
  }, [projects]);

  const openAdd = () => {
    setEditing(null);
    setDrawerOpen(true);
  };
  const openEdit = (p: Project) => {
    setEditing(p);
    setDrawerOpen(true);
  };
  const closeDrawer = () => {
    setDrawerOpen(false);
    setEditing(null);
  };

  const handleSave = async (payload: ProjectPayload) => {
    try {
      setSaving(true);
      if (editing) {
        await projectApi.update(editing._id, payload);
        notify("success", "Project updated successfully");
      } else {
        await projectApi.create(payload);
        notify("success", "Project created successfully");
      }
      closeDrawer();
      await load();
    } catch (e) {
      notify("error", getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await projectApi.remove(deleting._id);
      notify("success", "Project deleted");
      setDeleting(null);
      await load();
    } catch (e) {
      notify("error", getErrorMessage(e));
    }
  };

  return (
    <div className="cm-page">
      <div className="cm-header">
        <div>
          <h2>Projects</h2>
          <p>Track customer projects, purchase orders and schedules</p>
        </div>
        <button className="cm-btn primary" onClick={openAdd}>
          <Plus size={18} /> Add project
        </button>
      </div>

      <div className="cm-stats">
        <div className="cm-stat">
          <div className="cm-stat-icon"><FolderKanban size={22} /></div>
          <div><span>Total projects</span><strong>{stats.total}</strong></div>
        </div>
        <div className="cm-stat">
          <div className="cm-stat-icon warn"><PlayCircle size={22} /></div>
          <div><span>In progress</span><strong>{stats.inProgress}</strong></div>
        </div>
        <div className="cm-stat">
          <div className="cm-stat-icon ok"><CheckCircle size={22} /></div>
          <div><span>Completed</span><strong>{stats.completed}</strong></div>
        </div>
        <div className="cm-stat">
          <div className="cm-stat-icon"><IndianRupee size={22} /></div>
          <div><span>Total PO value</span><strong className="pm-stat-money">{formatCurrency(stats.value)}</strong></div>
        </div>
      </div>

      <div className="cm-card">
        <div className="cm-toolbar">
          <div className="cm-search">
            <Search size={18} />
            <input
              placeholder="Search by project, customer, PO number, location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="cm-tabs pm-tabs">
            {(["All", ...PROJECT_STATUSES] as Filter[]).map((f) => (
              <button key={f} className={filter === f ? "on" : ""} onClick={() => setFilter(f)}>
                {f}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="cm-state"><div className="cm-spinner" />Loading projects...</div>
        ) : filtered.length === 0 ? (
          <div className="cm-state">
            <FolderKanban size={40} />
            <strong>No projects found</strong>
            <span>
              {projects.length === 0
                ? "Create your first project to get started."
                : "Try a different search or status filter."}
            </span>
            {projects.length === 0 && (
              <button className="cm-btn primary" onClick={openAdd}>
                <Plus size={18} /> Add project
              </button>
            )}
          </div>
        ) : (
          <ProjectTable
            projects={filtered}
            customers={customers}
            onEdit={openEdit}
            onDelete={setDeleting}
          />
        )}
      </div>

      {drawerOpen && (
        <ProjectForm
          key={editing?._id ?? "new"}
          project={editing}
          customers={customers}
          nextCode={nextCode}
          saving={saving}
          onSubmit={handleSave}
          onClose={closeDrawer}
        />
      )}

      {deleting && (
        <>
          <div className="cm-overlay" onClick={() => setDeleting(null)} />
          <div className="cm-modal">
            <div className="cm-modal-icon"><AlertTriangle size={26} /></div>
            <h3>Delete project?</h3>
            <p>
              <strong>{deleting.projectName}</strong> will be permanently removed.
              This cannot be undone.
            </p>
            <div className="cm-modal-actions">
              <button className="cm-btn ghost" onClick={() => setDeleting(null)}>Cancel</button>
              <button className="cm-btn danger" onClick={handleDelete}>Delete</button>
            </div>
          </div>
        </>
      )}

      {toast && (
        <div className={`cm-toast ${toast.type}`}>
          {toast.type === "success" ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
          {toast.text}
        </div>
      )}
    </div>
  );
}