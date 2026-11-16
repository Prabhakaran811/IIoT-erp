import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Plus, Search, Receipt, FileText, CheckCircle, IndianRupee,
  AlertTriangle, CheckCircle2, XCircle,
} from "lucide-react";
import { serviceBillApi } from "../serviceBillApi";
import { customerApi } from "../../customers/customerApi";
import { projectApi } from "../../projects/projectApi";
import { deliveryChallanApi } from "../../deliveryChallans/deliveryChallanApi";
import { serviceReportApi } from "../../serviceReports/serviceReportApi";
import type { Customer } from "../../customers/customerTypes";
import type { Project } from "../../projects/projectTypes";
import type { DeliveryChallan } from "../../deliveryChallans/deliveryChallanTypes";
import type { ServiceReport } from "../../serviceReports/serviceReportTypes";
import {
  BILL_STATUSES,
  billTotals,
  isEditable,
  type ServiceBill,
  type ServiceBillPayload,
} from "../serviceBillTypes";
import ServiceBillTable, {
  challanNumberOf,
  customerNameOf,
  projectNameOf,
  reportNumberOf,
} from "../components/ServiceBillTable";
import ServiceBillForm from "../components/ServiceBillForm";
import ServiceBillView from "../components/ServiceBillView";
import { formatMoney, getErrorMessage } from "../../../utils/helpers";
import "../../customers/CustomerManagement.css"; // shared drawer/table/card styles
import "../ServiceBillManagement.css";

type Filter = "All" | (typeof BILL_STATUSES)[number];

export default function ServiceBillManagement() {
  const [bills, setBills] = useState<ServiceBill[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [challans, setChallans] = useState<DeliveryChallan[]>([]);
  const [reports, setReports] = useState<ServiceReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("All");

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<ServiceBill | null>(null);
  const [viewing, setViewing] = useState<ServiceBill | null>(null);
  const [deleting, setDeleting] = useState<ServiceBill | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const notify = (type: "success" | "error", text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 3500);
  };

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [b, c, p, d, r] = await Promise.all([
        serviceBillApi.getAll(),
        customerApi.getAll(),
        projectApi.getAll(),
        deliveryChallanApi.getAll(),
        serviceReportApi.getAll(),
      ]);
      setBills(b);
      setCustomers(c);
      setProjects(p);
      setChallans(d);
      setReports(r);
    } catch (e) {
      notify("error", getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const stats = useMemo(() => {
    const approved = bills.filter((b) => b.approvalStatus === "Approved");
    return {
      total: bills.length,
      draft: bills.filter((b) => b.approvalStatus === "Draft").length,
      approved: approved.length,
      approvedValue: approved.reduce((sum, b) => sum + billTotals(b).grandTotal, 0),
    };
  }, [bills]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return bills.filter((b) => {
      if (filter !== "All" && b.approvalStatus !== filter) return false;
      if (!q) return true;
      return [
        b.invoiceNumber,
        customerNameOf(b, customers),
        projectNameOf(b, projects),
        reportNumberOf(b, reports),
        challanNumberOf(b, challans),
      ]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [bills, customers, projects, reports, challans, search, filter]);

  // next number like INV-2026-004
  const nextNumber = useMemo(() => {
    const prefix = `INV-${new Date().getFullYear()}-`;
    const nums = bills
      .map((b) => b.invoiceNumber)
      .filter((n) => n?.startsWith(prefix))
      .map((n) => parseInt(n.slice(prefix.length), 10))
      .filter((n) => !isNaN(n));
    const next = (nums.length ? Math.max(...nums) : 0) + 1;
    return `${prefix}${String(next).padStart(3, "0")}`;
  }, [bills]);

  const openAdd = () => {
    setEditing(null);
    setDrawerOpen(true);
  };
  const openEdit = (b: ServiceBill) => {
    if (!isEditable(b.approvalStatus)) return;
    setEditing(b);
    setDrawerOpen(true);
  };
  const closeDrawer = () => {
    setDrawerOpen(false);
    setEditing(null);
  };

  const handleSave = async (payload: ServiceBillPayload) => {
    try {
      setSaving(true);
      if (editing) {
        await serviceBillApi.update(editing._id, payload);
        notify("success", "Service bill updated successfully");
      } else {
        await serviceBillApi.create(payload);
        notify("success", "Service bill created successfully");
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
      await serviceBillApi.remove(deleting._id);
      notify("success", "Service bill deleted");
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
          <h2>Service bills</h2>
          <p>Create, approve and print service invoices</p>
        </div>
        <button className="cm-btn primary" onClick={openAdd}>
          <Plus size={18} /> New invoice
        </button>
      </div>

      <div className="cm-stats">
        <div className="cm-stat">
          <div className="cm-stat-icon"><Receipt size={22} /></div>
          <div><span>Total invoices</span><strong>{stats.total}</strong></div>
        </div>
        <div className="cm-stat">
          <div className="cm-stat-icon grey"><FileText size={22} /></div>
          <div><span>Draft</span><strong>{stats.draft}</strong></div>
        </div>
        <div className="cm-stat">
          <div className="cm-stat-icon ok"><CheckCircle size={22} /></div>
          <div><span>Approved</span><strong>{stats.approved}</strong></div>
        </div>
        <div className="cm-stat">
          <div className="cm-stat-icon"><IndianRupee size={22} /></div>
          <div>
            <span>Approved value</span>
            <strong className="sb-stat-money">{formatMoney(stats.approvedValue)}</strong>
          </div>
        </div>
      </div>

      <div className="cm-card">
        <div className="cm-toolbar">
          <div className="cm-search">
            <Search size={18} />
            <input
              placeholder="Search by invoice no, customer, project, report..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="cm-tabs sb-tabs">
            {(["All", ...BILL_STATUSES] as Filter[]).map((f) => (
              <button key={f} className={filter === f ? "on" : ""} onClick={() => setFilter(f)}>
                {f}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="cm-state"><div className="cm-spinner" />Loading service bills...</div>
        ) : filtered.length === 0 ? (
          <div className="cm-state">
            <Receipt size={40} />
            <strong>No service bills found</strong>
            <span>
              {bills.length === 0
                ? "Create your first service invoice to get started."
                : "Try a different search or status filter."}
            </span>
            {bills.length === 0 && (
              <button className="cm-btn primary" onClick={openAdd}>
                <Plus size={18} /> New invoice
              </button>
            )}
          </div>
        ) : (
          <ServiceBillTable
            bills={filtered}
            customers={customers}
            projects={projects}
            challans={challans}
            reports={reports}
            onView={setViewing}
            onEdit={openEdit}
            onDelete={setDeleting}
          />
        )}
      </div>

      {drawerOpen && (
        <ServiceBillForm
          key={editing?._id ?? "new"}
          bill={editing}
          customers={customers}
          projects={projects}
          challans={challans}
          reports={reports}
          nextNumber={nextNumber}
          saving={saving}
          onSubmit={handleSave}
          onClose={closeDrawer}
        />
      )}

      {viewing && (
        <ServiceBillView
          bill={viewing}
          customers={customers}
          projects={projects}
          challans={challans}
          reports={reports}
          onClose={() => setViewing(null)}
        />
      )}

      {deleting && (
        <>
          <div className="cm-overlay" onClick={() => setDeleting(null)} />
          <div className="cm-modal">
            <div className="cm-modal-icon"><AlertTriangle size={26} /></div>
            <h3>Delete invoice?</h3>
            <p>
              <strong>{deleting.invoiceNumber}</strong> will be permanently removed.
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