import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Plus, Search, Users, UserCheck, UserX,
  AlertTriangle, CheckCircle2, XCircle,
} from "lucide-react";
import { customerApi } from "../customerApi";
import type { Customer, CustomerPayload } from "../customerTypes";
import CustomerTable from "../components/CustomerTable";
import CustomerForm from "../components/CustomerForm";
import { getErrorMessage } from "../../../utils/helpers";
import "../CustomerManagement.css";

type Filter = "all" | "active" | "inactive";

export default function CustomerManagement() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [deleting, setDeleting] = useState<Customer | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const notify = (type: "success" | "error", text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 3500);
  };

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setCustomers(await customerApi.getAll());
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
    const active = customers.filter((c) => c.isActive).length;
    return { total: customers.length, active, inactive: customers.length - active };
  }, [customers]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return customers.filter((c) => {
      if (filter === "active" && !c.isActive) return false;
      if (filter === "inactive" && c.isActive) return false;
      if (!q) return true;
      return [c.customerCode, c.customerLegalName, c.gstin, c.contactPerson, c.phoneNumber, c.emailAddress]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [customers, search, filter]);

  // next code like CUS-004
  const nextCode = useMemo(() => {
    const nums = customers
      .map((c) => parseInt(c.customerCode.replace(/\D/g, ""), 10))
      .filter((n) => !isNaN(n));
    const next = (nums.length ? Math.max(...nums) : 0) + 1;
    return `CUS-${String(next).padStart(3, "0")}`;
  }, [customers]);

  const openAdd = () => {
    setEditing(null);
    setDrawerOpen(true);
  };
  const openEdit = (c: Customer) => {
    setEditing(c);
    setDrawerOpen(true);
  };
  const closeDrawer = () => {
    setDrawerOpen(false);
    setEditing(null);
  };

  const handleSave = async (payload: CustomerPayload) => {
    try {
      setSaving(true);
      if (editing) {
        await customerApi.update(editing._id, payload);
        notify("success", "Customer updated successfully");
      } else {
        await customerApi.create(payload);
        notify("success", "Customer created successfully");
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
      await customerApi.remove(deleting._id);
      notify("success", "Customer deleted");
      setDeleting(null);
      await load();
    } catch (e) {
      notify("error", getErrorMessage(e));
    }
  };

  return (
    <div className="cm-page">
      {/* header */}
      <div className="cm-header">
        <div>
          <h2>Customers</h2>
          <p>Manage your customer master and GST details</p>
        </div>
        <button className="cm-btn primary" onClick={openAdd}>
          <Plus size={18} /> Add customer
        </button>
      </div>

      {/* stats */}
      <div className="cm-stats">
        <div className="cm-stat">
          <div className="cm-stat-icon"><Users size={22} /></div>
          <div><span>Total customers</span><strong>{stats.total}</strong></div>
        </div>
        <div className="cm-stat">
          <div className="cm-stat-icon ok"><UserCheck size={22} /></div>
          <div><span>Active</span><strong>{stats.active}</strong></div>
        </div>
        <div className="cm-stat">
          <div className="cm-stat-icon off"><UserX size={22} /></div>
          <div><span>Inactive</span><strong>{stats.inactive}</strong></div>
        </div>
      </div>

      {/* toolbar + table */}
      <div className="cm-card">
        <div className="cm-toolbar">
          <div className="cm-search">
            <Search size={18} />
            <input
              placeholder="Search by name, code, GSTIN, contact..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="cm-tabs">
            {(["all", "active", "inactive"] as Filter[]).map((f) => (
              <button
                key={f}
                className={filter === f ? "on" : ""}
                onClick={() => setFilter(f)}
              >
                {f[0].toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="cm-state"><div className="cm-spinner" />Loading customers...</div>
        ) : filtered.length === 0 ? (
          <div className="cm-state">
            <Users size={40} />
            <strong>No customers found</strong>
            <span>
              {customers.length === 0
                ? "Add your first customer to get started."
                : "Try a different search or filter."}
            </span>
            {customers.length === 0 && (
              <button className="cm-btn primary" onClick={openAdd}>
                <Plus size={18} /> Add customer
              </button>
            )}
          </div>
        ) : (
          <CustomerTable customers={filtered} onEdit={openEdit} onDelete={setDeleting} />
        )}
      </div>

      {/* drawer form */}
      {drawerOpen && (
        <CustomerForm
          key={editing?._id ?? "new"}
          customer={editing}
          nextCode={nextCode}
          saving={saving}
          onSubmit={handleSave}
          onClose={closeDrawer}
        />
      )}

      {/* delete confirm */}
      {deleting && (
        <>
          <div className="cm-overlay" onClick={() => setDeleting(null)} />
          <div className="cm-modal">
            <div className="cm-modal-icon"><AlertTriangle size={26} /></div>
            <h3>Delete customer?</h3>
            <p>
              <strong>{deleting.customerLegalName}</strong> will be permanently removed.
              This cannot be undone.
            </p>
            <div className="cm-modal-actions">
              <button className="cm-btn ghost" onClick={() => setDeleting(null)}>Cancel</button>
              <button className="cm-btn danger" onClick={handleDelete}>Delete</button>
            </div>
          </div>
        </>
      )}

      {/* toast */}
      {toast && (
        <div className={`cm-toast ${toast.type}`}>
          {toast.type === "success" ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
          {toast.text}
        </div>
      )}
    </div>
  );
}