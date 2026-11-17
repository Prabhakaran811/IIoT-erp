import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Plus, Search, CalendarDays, CalendarCheck, Users, ClipboardList,
  ChevronLeft, ChevronRight, AlertTriangle, CheckCircle2, XCircle,
} from "lucide-react";
import { employeeLeaveApi } from "../employeeLeaveApi";
import { employeeApi } from "../../employees/employeeApi";
import type { Employee } from "../../employees/employeeTypes";
import { useAppSelector } from "../../../app/hooks";
import {
  LEAVE_TYPES,
  MONTH_NAMES,
  buildMonthlySummary,
  dayKey,
  employeeInfo,
  fmtDays,
  leavesOnDay,
  localKey,
  type EmployeeLeave,
  type LeavePayload,
} from "../employeeLeaveTypes";
import LeaveForm from "../components/LeaveForm";
import LeaveCalendar from "../components/LeaveCalendar";
import DayLeavesPanel from "../components/DayLeavesPanel";
import LeaveTable from "../components/LeaveTable";
import LeaveReport from "../components/LeaveReport";
import LeaveHistory from "../components/LeaveHistory";
import { formatDate, getErrorMessage } from "../../../utils/helpers";
import "../../customers/CustomerManagement.css"; // shared drawer/table/card styles
import "../LeaveManagement.css";

type View = "calendar" | "records" | "report";

export default function LeaveManagement() {
  const userName = useAppSelector((s) => s.auth.user?.name) ?? "HR Admin";

  const [leaves, setLeaves] = useState<EmployeeLeave[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [view, setView] = useState<View>("calendar");
  const now = new Date();
  const [cursor, setCursor] = useState({ year: now.getFullYear(), month: now.getMonth() });
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [employeeFilter, setEmployeeFilter] = useState("All");

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<EmployeeLeave | null>(null);
  const [formDefaults, setFormDefaults] = useState<{ fromDate?: string }>({});
  const [dayOpen, setDayOpen] = useState<string | null>(null);
  const [historyId, setHistoryId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<EmployeeLeave | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const notify = (type: "success" | "error", text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 3500);
  };

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [l, e] = await Promise.all([employeeLeaveApi.getAll(), employeeApi.getAll()]);
      setLeaves(l);
      setEmployees(e);
    } catch (e) {
      notify("error", getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  /* filters apply to the calendar and the records table */
  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return leaves.filter((l) => {
      const info = employeeInfo(l, employees);
      if (typeFilter !== "All" && l.leaveType !== typeFilter) return false;
      if (employeeFilter !== "All" && info.id !== employeeFilter) return false;
      if (!q) return true;
      return [info.name, info.code, info.department, l.leaveType, l.reason, l.remarks]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [leaves, employees, search, typeFilter, employeeFilter]);

  const records = useMemo(
    () => [...visible].sort((a, b) => dayKey(b.fromDate).localeCompare(dayKey(a.fromDate))),
    [visible]
  );

  /* the monthly report is built from all records, so it matches the calendar */
  const summary = useMemo(
    () => buildMonthlySummary(leaves, employees, cursor.year, cursor.month),
    [leaves, employees, cursor]
  );

  const onLeaveToday = useMemo(() => {
    const ids = new Set(leavesOnDay(leaves, localKey()).map((l) => employeeInfo(l, employees).id));
    return ids.size;
  }, [leaves, employees]);

  const dayLeaves = dayOpen ? leavesOnDay(visible, dayOpen) : [];

  /* month navigation */
  const shiftMonth = (delta: number) =>
    setCursor((c) => {
      const d = new Date(c.year, c.month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  const goToday = () => {
    const d = new Date();
    setCursor({ year: d.getFullYear(), month: d.getMonth() });
  };

  /* form open/close */
  const openAdd = (fromDate?: string) => {
    setDayOpen(null);
    setEditing(null);
    setFormDefaults({ fromDate });
    setFormOpen(true);
  };
  const openEdit = (l: EmployeeLeave) => {
    setDayOpen(null);
    setEditing(l);
    setFormOpen(true);
  };
  const closeForm = () => {
    setFormOpen(false);
    setEditing(null);
  };

  const handleSave = async (payload: LeavePayload) => {
    try {
      setSaving(true);
      if (editing) {
        await employeeLeaveApi.update(editing._id, payload);
        notify("success", "Leave updated successfully");
      } else {
        await employeeLeaveApi.create(payload);
        notify("success", "Leave recorded successfully");
      }
      closeForm();
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
      await employeeLeaveApi.remove(deleting._id);
      notify("success", "Leave record deleted");
      setDeleting(null);
      await load();
    } catch (e) {
      notify("error", getErrorMessage(e));
    }
  };

  const monthNav = (
    <div className="lv-monthnav">
      <button className="cm-icon-btn" onClick={() => shiftMonth(-1)} aria-label="Previous month">
        <ChevronLeft size={18} />
      </button>
      <strong>
        {MONTH_NAMES[cursor.month]} {cursor.year}
      </strong>
      <button className="cm-icon-btn" onClick={() => shiftMonth(1)} aria-label="Next month">
        <ChevronRight size={18} />
      </button>
      <button className="cm-btn ghost lv-today" onClick={goToday}>
        Today
      </button>
    </div>
  );

  return (
    <div className="cm-page">
      <div className="cm-header">
        <div>
          <h2>Leave management</h2>
          <p>Record leave, see who is away and review monthly reports</p>
        </div>
        <button className="cm-btn primary" onClick={() => openAdd()}>
          <Plus size={18} /> Record leave
        </button>
      </div>

      <div className="cm-stats">
        <div className="cm-stat">
          <div className="cm-stat-icon"><CalendarCheck size={22} /></div>
          <div><span>On leave today</span><strong>{onLeaveToday}</strong></div>
        </div>
        <div className="cm-stat">
          <div className="cm-stat-icon"><ClipboardList size={22} /></div>
          <div>
            <span>Records in {MONTH_NAMES[cursor.month]}</span>
            <strong>{summary.records.length}</strong>
          </div>
        </div>
        <div className="cm-stat">
          <div className="cm-stat-icon ok"><CalendarDays size={22} /></div>
          <div>
            <span>Leave days in {MONTH_NAMES[cursor.month]}</span>
            <strong>{fmtDays(summary.totalDays)}</strong>
          </div>
        </div>
        <div className="cm-stat">
          <div className="cm-stat-icon"><Users size={22} /></div>
          <div>
            <span>Employees on leave</span>
            <strong>{summary.rows.length}</strong>
          </div>
        </div>
      </div>

      <div className="cm-card">
        <div className="cm-toolbar">
          <div className="cm-tabs">
            <button className={view === "calendar" ? "on" : ""} onClick={() => setView("calendar")}>
              Calendar
            </button>
            <button className={view === "records" ? "on" : ""} onClick={() => setView("records")}>
              Records
            </button>
            <button className={view === "report" ? "on" : ""} onClick={() => setView("report")}>
              Monthly report
            </button>
          </div>

          {view !== "report" && (
            <div className="lv-filters">
              <div className="cm-search lv-search">
                <Search size={18} />
                <input
                  placeholder="Search employee, reason..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <select className="lv-select" value={employeeFilter} onChange={(e) => setEmployeeFilter(e.target.value)}>
                <option value="All">All employees</option>
                {employees.map((e) => (
                  <option key={e._id} value={e._id}>
                    {e.employeeName}
                  </option>
                ))}
              </select>
              <select className="lv-select" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                <option value="All">All leave types</option>
                {LEAVE_TYPES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {loading ? (
          <div className="cm-state"><div className="cm-spinner" />Loading leave records...</div>
        ) : view === "calendar" ? (
          <div className="lv-body">
            {monthNav}
            <LeaveCalendar
              leaves={visible}
              employees={employees}
              year={cursor.year}
              month={cursor.month}
              onDayClick={setDayOpen}
            />
            <div className="lv-legend">
              {LEAVE_TYPES.map((t) => (
                <span key={t} className={`lv-chip lv-${t.toLowerCase().replace(/[^a-z]+/g, "-")}`}>
                  {t}
                </span>
              ))}
              <span className="lv-legend-note">Shaded days are weekly offs. ½ = half day.</span>
            </div>
          </div>
        ) : view === "records" ? (
          records.length === 0 ? (
            <div className="cm-state">
              <CalendarDays size={40} />
              <strong>No leave records found</strong>
              <span>
                {leaves.length === 0
                  ? "Record the first leave to get started."
                  : "Try a different search or filter."}
              </span>
            </div>
          ) : (
            <LeaveTable
              leaves={records}
              employees={employees}
              onEdit={openEdit}
              onDelete={setDeleting}
              onHistory={setHistoryId}
            />
          )
        ) : (
          <div className="lv-body">
            {monthNav}
            <LeaveReport
              summary={summary}
              year={cursor.year}
              month={cursor.month}
              onHistory={setHistoryId}
            />
          </div>
        )}
      </div>

      {formOpen && (
        <LeaveForm
          key={editing?._id ?? `new-${formDefaults.fromDate ?? ""}`}
          leave={editing}
          employees={employees}
          leaves={leaves}
          defaults={formDefaults}
          recordedBy={userName}
          saving={saving}
          onSubmit={handleSave}
          onClose={closeForm}
        />
      )}

      {dayOpen && (
        <DayLeavesPanel
          dateKey={dayOpen}
          leaves={dayLeaves}
          employees={employees}
          onAdd={() => openAdd(dayOpen)}
          onEdit={openEdit}
          onDelete={(l) => {
            setDayOpen(null);
            setDeleting(l);
          }}
          onClose={() => setDayOpen(null)}
        />
      )}

      {historyId && (
        <LeaveHistory employeeId={historyId} employees={employees} onClose={() => setHistoryId(null)} />
      )}

      {deleting && (
        <>
          <div className="cm-overlay" onClick={() => setDeleting(null)} />
          <div className="cm-modal">
            <div className="cm-modal-icon"><AlertTriangle size={26} /></div>
            <h3>Delete leave record?</h3>
            <p>
              <strong>{employeeInfo(deleting, employees).name}</strong> ({deleting.leaveType},{" "}
              {formatDate(deleting.fromDate)}) will be permanently removed from the database.
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