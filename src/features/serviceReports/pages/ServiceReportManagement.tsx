import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Plus, Search, Wrench, FileText, Clock, ClipboardCheck,
  AlertTriangle, CheckCircle2, XCircle,
} from "lucide-react";
import { serviceReportApi } from "../serviceReportApi";
import { customerApi } from "../../customers/customerApi";
import { projectApi } from "../../projects/projectApi";
import { deliveryChallanApi } from "../../deliveryChallans/deliveryChallanApi";
import type { Customer } from "../../customers/customerTypes";
import type { Project } from "../../projects/projectTypes";
import type { DeliveryChallan } from "../../deliveryChallans/deliveryChallanTypes";
import {
  REPORT_STATUSES,
  isEditable,
  type ServiceReport,
  type ServiceReportPayload,
} from "../serviceReportTypes";
import ServiceReportTable, {
  challanNumberOf,
  customerNameOf,
  projectNameOf,
} from "../components/ServiceReportTable";
import ServiceReportForm from "../components/ServiceReportForm";
import ServiceReportView from "../components/ServiceReportView";
import { getErrorMessage } from "../../../utils/helpers";
import "../../customers/CustomerManagement.css"; // shared drawer/table/card styles
import "../ServiceReportManagement.css";

type Filter = "All" | (typeof REPORT_STATUSES)[number];

export default function ServiceReportManagement() {
  const [reports, setReports] = useState<ServiceReport[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [challans, setChallans] = useState<DeliveryChallan[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("All");

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<ServiceReport | null>(null);
  const [viewing, setViewing] = useState<ServiceReport | null>(null);
  const [deleting, setDeleting] = useState<ServiceReport | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const notify = (type: "success" | "error", text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 3500);
  };

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [r, c, p, d] = await Promise.all([
        serviceReportApi.getAll(),
        customerApi.getAll(),
        projectApi.getAll(),
        deliveryChallanApi.getAll(),
      ]);
      setReports(r);
      setCustomers(c);
      setProjects(p);
      setChallans(d);
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
      total: reports.length,
      draft: reports.filter((r) => r.status === "Draft").length,
      inProgress: reports.filter((r) => r.status === "In Progress").length,
      completed: reports.filter((r) => r.status === "Completed").length,
    }),
    [reports]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return reports.filter((r) => {
      if (filter !== "All" && r.status !== filter) return false;
      if (!q) return true;
      return [
        r.serviceReportNumber,
        r.serviceEngineer,
        r.siteLocation,
        customerNameOf(r, customers),
        projectNameOf(r, projects),
        challanNumberOf(r, challans),
      ]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [reports, customers, projects, challans, search, filter]);

  // next number like SR-2026-004
  const nextNumber = useMemo(() => {
    const prefix = `SR-${new Date().getFullYear()}-`;
    const nums = reports
      .map((r) => r.serviceReportNumber)
      .filter((n) => n?.startsWith(prefix))
      .map((n) => parseInt(n.slice(prefix.length), 10))
      .filter((n) => !isNaN(n));
    const next = (nums.length ? Math.max(...nums) : 0) + 1;
    return `${prefix}${String(next).padStart(3, "0")}`;
  }, [reports]);

  const openAdd = () => {
    setEditing(null);
    setDrawerOpen(true);
  };
  const openEdit = (r: ServiceReport) => {
    if (!isEditable(r.status)) return;
    setEditing(r);
    setDrawerOpen(true);
  };
  const closeDrawer = () => {
    setDrawerOpen(false);
    setEditing(null);
  };

  const handleSave = async (payload: ServiceReportPayload) => {
    try {
      setSaving(true);
      if (editing) {
        await serviceReportApi.update(editing._id, payload);
        notify("success", "Service report updated successfully");
      } else {
        await serviceReportApi.create(payload);
        notify("success", "Service report created successfully");
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
      await serviceReportApi.remove(deleting._id);
      notify("success", "Service report deleted");
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
          <h2>Service reports</h2>
          <p>Record site visits, work done and materials used</p>
        </div>
        <button className="cm-btn primary" onClick={openAdd}>
          <Plus size={18} /> New report
        </button>
      </div>

      <div className="cm-stats">
        <div className="cm-stat">
          <div className="cm-stat-icon"><Wrench size={22} /></div>
          <div><span>Total reports</span><strong>{stats.total}</strong></div>
        </div>
        <div className="cm-stat">
          <div className="cm-stat-icon grey"><FileText size={22} /></div>
          <div><span>Draft</span><strong>{stats.draft}</strong></div>
        </div>
        <div className="cm-stat">
          <div className="cm-stat-icon warn"><Clock size={22} /></div>
          <div><span>In progress</span><strong>{stats.inProgress}</strong></div>
        </div>
        <div className="cm-stat">
          <div className="cm-stat-icon ok"><ClipboardCheck size={22} /></div>
          <div><span>Completed</span><strong>{stats.completed}</strong></div>
        </div>
      </div>

      <div className="cm-card">
        <div className="cm-toolbar">
          <div className="cm-search">
            <Search size={18} />
            <input
              placeholder="Search by report no, customer, project, engineer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="cm-tabs sr-tabs">
            {(["All", ...REPORT_STATUSES] as Filter[]).map((f) => (
              <button key={f} className={filter === f ? "on" : ""} onClick={() => setFilter(f)}>
                {f}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="cm-state"><div className="cm-spinner" />Loading service reports...</div>
        ) : filtered.length === 0 ? (
          <div className="cm-state">
            <Wrench size={40} />
            <strong>No service reports found</strong>
            <span>
              {reports.length === 0
                ? "Create your first service report to get started."
                : "Try a different search or status filter."}
            </span>
            {reports.length === 0 && (
              <button className="cm-btn primary" onClick={openAdd}>
                <Plus size={18} /> New report
              </button>
            )}
          </div>
        ) : (
          <ServiceReportTable
            reports={filtered}
            customers={customers}
            projects={projects}
            challans={challans}
            onView={setViewing}
            onEdit={openEdit}
            onDelete={setDeleting}
          />
        )}
      </div>

      {drawerOpen && (
        <ServiceReportForm
          key={editing?._id ?? "new"}
          report={editing}
          customers={customers}
          projects={projects}
          challans={challans}
          nextNumber={nextNumber}
          saving={saving}
          onSubmit={handleSave}
          onClose={closeDrawer}
        />
      )}

      {viewing && (
        <ServiceReportView
          report={viewing}
          customers={customers}
          projects={projects}
          challans={challans}
          onClose={() => setViewing(null)}
        />
      )}

      {deleting && (
        <>
          <div className="cm-overlay" onClick={() => setDeleting(null)} />
          <div className="cm-modal">
            <div className="cm-modal-icon"><AlertTriangle size={26} /></div>
            <h3>Delete service report?</h3>
            <p>
              <strong>{deleting.serviceReportNumber}</strong> will be permanently removed.
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