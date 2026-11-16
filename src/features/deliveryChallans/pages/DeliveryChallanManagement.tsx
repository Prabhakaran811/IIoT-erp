import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Plus, Search, Truck, FileText, Send, PackageCheck,
  AlertTriangle, CheckCircle2, XCircle,
} from "lucide-react";
import { deliveryChallanApi } from "../deliveryChallanApi";
import { customerApi } from "../../customers/customerApi";
import { projectApi } from "../../projects/projectApi";
import type { Customer } from "../../customers/customerTypes";
import type { Project } from "../../projects/projectTypes";
import {
  CHALLAN_STATUSES,
  type DeliveryChallan,
  type DeliveryChallanPayload,
} from "../deliveryChallanTypes";
import DeliveryChallanTable, {
  customerNameOf,
  projectOf,
} from "../components/DeliveryChallanTable";
import DeliveryChallanForm from "../components/DeliveryChallanForm";
import DeliveryChallanView from "../components/DeliveryChallanView";
import { getErrorMessage } from "../../../utils/helpers";
import "../../customers/CustomerManagement.css"; // shared drawer/table/card styles
import "../DeliveryChallanManagement.css";

type Filter = "All" | (typeof CHALLAN_STATUSES)[number];

export default function DeliveryChallanManagement() {
  const [challans, setChallans] = useState<DeliveryChallan[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("All");

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<DeliveryChallan | null>(null);
  const [viewing, setViewing] = useState<DeliveryChallan | null>(null);
  const [deleting, setDeleting] = useState<DeliveryChallan | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const notify = (type: "success" | "error", text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 3500);
  };

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [d, c, p] = await Promise.all([
        deliveryChallanApi.getAll(),
        customerApi.getAll(),
        projectApi.getAll(),
      ]);
      setChallans(d);
      setCustomers(c);
      setProjects(p);
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
      total: challans.length,
      draft: challans.filter((c) => c.status === "Draft").length,
      issued: challans.filter((c) => c.status === "Issued").length,
      delivered: challans.filter((c) => c.status === "Delivered").length,
    }),
    [challans]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return challans.filter((c) => {
      if (filter !== "All" && c.status !== filter) return false;
      if (!q) return true;
      return [
        c.challanNumber,
        c.vehicleNumber,
        c.transporterName,
        c.poWorkOrderReference,
        c.deliverySiteLocation,
        customerNameOf(c, customers),
        projectOf(c, projects).name,
      ]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [challans, customers, projects, search, filter]);

  // next number like DC-2026-004
  const nextNumber = useMemo(() => {
    const prefix = `DC-${new Date().getFullYear()}-`;
    const nums = challans
      .map((c) => c.challanNumber)
      .filter((n) => n?.startsWith(prefix))
      .map((n) => parseInt(n.slice(prefix.length), 10))
      .filter((n) => !isNaN(n));
    const next = (nums.length ? Math.max(...nums) : 0) + 1;
    return `${prefix}${String(next).padStart(3, "0")}`;
  }, [challans]);

  const openAdd = () => {
    setEditing(null);
    setDrawerOpen(true);
  };
  const openEdit = (c: DeliveryChallan) => {
    setViewing(null);
    setEditing(c);
    setDrawerOpen(true);
  };
  const closeDrawer = () => {
    setDrawerOpen(false);
    setEditing(null);
  };

  const handleSave = async (payload: DeliveryChallanPayload) => {
    try {
      setSaving(true);
      if (editing) {
        await deliveryChallanApi.update(editing._id, payload);
        notify("success", "Delivery challan updated successfully");
      } else {
        await deliveryChallanApi.create(payload);
        notify("success", "Delivery challan created successfully");
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
      await deliveryChallanApi.remove(deleting._id);
      notify("success", "Delivery challan deleted");
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
          <h2>Delivery challans</h2>
          <p>Create, track and print material delivery challans</p>
        </div>
        <button className="cm-btn primary" onClick={openAdd}>
          <Plus size={18} /> New challan
        </button>
      </div>

      <div className="cm-stats">
        <div className="cm-stat">
          <div className="cm-stat-icon"><Truck size={22} /></div>
          <div><span>Total challans</span><strong>{stats.total}</strong></div>
        </div>
        <div className="cm-stat">
          <div className="cm-stat-icon grey"><FileText size={22} /></div>
          <div><span>Draft</span><strong>{stats.draft}</strong></div>
        </div>
        <div className="cm-stat">
          <div className="cm-stat-icon info"><Send size={22} /></div>
          <div><span>Issued</span><strong>{stats.issued}</strong></div>
        </div>
        <div className="cm-stat">
          <div className="cm-stat-icon ok"><PackageCheck size={22} /></div>
          <div><span>Delivered</span><strong>{stats.delivered}</strong></div>
        </div>
      </div>

      <div className="cm-card">
        <div className="cm-toolbar">
          <div className="cm-search">
            <Search size={18} />
            <input
              placeholder="Search by challan no, customer, project, vehicle..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="cm-tabs dc-tabs">
            {(["All", ...CHALLAN_STATUSES] as Filter[]).map((f) => (
              <button key={f} className={filter === f ? "on" : ""} onClick={() => setFilter(f)}>
                {f}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="cm-state"><div className="cm-spinner" />Loading challans...</div>
        ) : filtered.length === 0 ? (
          <div className="cm-state">
            <Truck size={40} />
            <strong>No delivery challans found</strong>
            <span>
              {challans.length === 0
                ? "Create your first delivery challan to get started."
                : "Try a different search or status filter."}
            </span>
            {challans.length === 0 && (
              <button className="cm-btn primary" onClick={openAdd}>
                <Plus size={18} /> New challan
              </button>
            )}
          </div>
        ) : (
          <DeliveryChallanTable
            challans={filtered}
            customers={customers}
            projects={projects}
            onView={setViewing}
            onEdit={openEdit}
            onDelete={setDeleting}
          />
        )}
      </div>

      {drawerOpen && (
        <DeliveryChallanForm
          key={editing?._id ?? "new"}
          challan={editing}
          customers={customers}
          projects={projects}
          nextNumber={nextNumber}
          saving={saving}
          onSubmit={handleSave}
          onClose={closeDrawer}
        />
      )}

      {viewing && (
        <DeliveryChallanView
          challan={viewing}
          customers={customers}
          projects={projects}
          onClose={() => setViewing(null)}
        />
      )}

      {deleting && (
        <>
          <div className="cm-overlay" onClick={() => setDeleting(null)} />
          <div className="cm-modal">
            <div className="cm-modal-icon"><AlertTriangle size={26} /></div>
            <h3>Delete challan?</h3>
            <p>
              <strong>{deleting.challanNumber}</strong> will be permanently removed.
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