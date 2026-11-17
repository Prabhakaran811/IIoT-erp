import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Plus, Search, UserCog, UserCheck, UserX, Building2,
  AlertTriangle, CheckCircle2, XCircle,
} from "lucide-react";
import { employeeApi } from "../employeeApi";
import {
  DEFAULT_DEPARTMENTS,
  EMPLOYMENT_STATUSES,
  managerId,
  type Employee,
  type EmployeePayload,
} from "../employeeTypes";
import EmployeeTable, { managerOf } from "../components/EmployeeTable";
import EmployeeForm from "../components/EmployeeForm";
import EmployeeView from "../components/EmployeeView";
import { getErrorMessage } from "../../../utils/helpers";
import "../../customers/CustomerManagement.css"; // shared drawer/table/card styles
import "../EmployeeManagement.css";

type Filter = "All" | (typeof EMPLOYMENT_STATUSES)[number];

export default function EmployeeManagement() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("All");
  const [department, setDepartment] = useState("All");

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [viewing, setViewing] = useState<Employee | null>(null);
  const [deleting, setDeleting] = useState<Employee | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const notify = (type: "success" | "error", text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 3500);
  };

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setEmployees(await employeeApi.getAll());
    } catch (e) {
      notify("error", getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // departments / designations seen in the data + defaults (for dropdowns and suggestions)
  const departments = useMemo(
    () =>
      Array.from(
        new Set([...DEFAULT_DEPARTMENTS, ...employees.map((e) => e.department).filter(Boolean)])
      ).sort(),
    [employees]
  );
  const designations = useMemo(
    () => Array.from(new Set(employees.map((e) => e.designation).filter(Boolean))).sort(),
    [employees]
  );
  const usedDepartments = useMemo(
    () => Array.from(new Set(employees.map((e) => e.department).filter(Boolean))).sort(),
    [employees]
  );

  const stats = useMemo(() => {
    const active = employees.filter((e) => e.employmentStatus === "Active").length;
    return {
      total: employees.length,
      active,
      other: employees.length - active,
      departments: usedDepartments.length,
    };
  }, [employees, usedDepartments]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return employees.filter((e) => {
      if (filter !== "All" && e.employmentStatus !== filter) return false;
      if (department !== "All" && e.department !== department) return false;
      if (!q) return true;
      return [
        e.employeeCode,
        e.employeeName,
        e.emailAddress,
        e.phoneNumber,
        e.designation,
        e.department,
        managerOf(e, employees)?.employeeName,
      ]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [employees, search, filter, department]);

  // next code like EMP-004
  const nextCode = useMemo(() => {
    const nums = employees
      .map((e) => parseInt(e.employeeCode.replace(/\D/g, ""), 10))
      .filter((n) => !isNaN(n));
    const next = (nums.length ? Math.max(...nums) : 0) + 1;
    return `EMP-${String(next).padStart(3, "0")}`;
  }, [employees]);

  const directReports = (e: Employee) =>
    employees.filter((x) => x._id !== e._id && managerId(x) === e._id).length;

  const openAdd = () => {
    setEditing(null);
    setDrawerOpen(true);
  };
  const openEdit = (e: Employee) => {
    setViewing(null);
    setEditing(e);
    setDrawerOpen(true);
  };
  const closeDrawer = () => {
    setDrawerOpen(false);
    setEditing(null);
  };

  const handleSave = async (payload: EmployeePayload) => {
    try {
      setSaving(true);
      if (editing) {
        await employeeApi.update(editing._id, payload);
        notify("success", "Employee updated successfully");
      } else {
        await employeeApi.create(payload);
        notify("success", "Employee added successfully");
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
      await employeeApi.remove(deleting._id);
      notify("success", "Employee deleted");
      setDeleting(null);
      await load();
    } catch (e) {
      notify("error", getErrorMessage(e));
    }
  };

  const deletingReports = deleting ? directReports(deleting) : 0;

  return (
    <div className="cm-page">
      <div className="cm-header">
        <div>
          <h2>Employees</h2>
          <p>Manage employee records, roles and reporting lines</p>
        </div>
        <button className="cm-btn primary" onClick={openAdd}>
          <Plus size={18} /> Add employee
        </button>
      </div>

      <div className="cm-stats">
        <div className="cm-stat">
          <div className="cm-stat-icon"><UserCog size={22} /></div>
          <div><span>Total employees</span><strong>{stats.total}</strong></div>
        </div>
        <div className="cm-stat">
          <div className="cm-stat-icon ok"><UserCheck size={22} /></div>
          <div><span>Active</span><strong>{stats.active}</strong></div>
        </div>
        <div className="cm-stat">
          <div className="cm-stat-icon off"><UserX size={22} /></div>
          <div><span>Inactive / on leave / left</span><strong>{stats.other}</strong></div>
        </div>
        <div className="cm-stat">
          <div className="cm-stat-icon"><Building2 size={22} /></div>
          <div><span>Departments</span><strong>{stats.departments}</strong></div>
        </div>
      </div>

      <div className="cm-card">
        <div className="cm-toolbar">
          <div className="cm-search">
            <Search size={18} />
            <input
              placeholder="Search by name, code, phone, email, role..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="em-filters">
            <select
              className="em-dept-select"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
            >
              <option value="All">All departments</option>
              {usedDepartments.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>

            <div className="cm-tabs em-tabs">
              {(["All", ...EMPLOYMENT_STATUSES] as Filter[]).map((f) => (
                <button key={f} className={filter === f ? "on" : ""} onClick={() => setFilter(f)}>
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="cm-state"><div className="cm-spinner" />Loading employees...</div>
        ) : filtered.length === 0 ? (
          <div className="cm-state">
            <UserCog size={40} />
            <strong>No employees found</strong>
            <span>
              {employees.length === 0
                ? "Add your first employee to get started."
                : "Try a different search or filter."}
            </span>
            {employees.length === 0 && (
              <button className="cm-btn primary" onClick={openAdd}>
                <Plus size={18} /> Add employee
              </button>
            )}
          </div>
        ) : (
          <EmployeeTable
            employees={filtered}
            onView={setViewing}
            onEdit={openEdit}
            onDelete={setDeleting}
          />
        )}
      </div>

      {drawerOpen && (
        <EmployeeForm
          key={editing?._id ?? "new"}
          employee={editing}
          employees={employees}
          departments={departments}
          designations={designations}
          nextCode={nextCode}
          saving={saving}
          onSubmit={handleSave}
          onClose={closeDrawer}
        />
      )}

      {viewing && (
        <EmployeeView
          employee={viewing}
          employees={employees}
          onEdit={openEdit}
          onClose={() => setViewing(null)}
        />
      )}

      {deleting && (
        <>
          <div className="cm-overlay" onClick={() => setDeleting(null)} />
          <div className="cm-modal">
            <div className="cm-modal-icon"><AlertTriangle size={26} /></div>
            <h3>Delete employee?</h3>
            <p>
              <strong>{deleting.employeeName}</strong> will be permanently removed.
              This cannot be undone.
            </p>
            {deletingReports > 0 && (
              <p className="em-delete-warn">
                {deletingReports} employee{deletingReports > 1 ? "s" : ""} report to this person.
                Update their reporting manager after deleting.
              </p>
            )}
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