import { useRef, useState, type FormEvent } from "react";
import { X, Info } from "lucide-react";
import type { Employee } from "../../employees/employeeTypes";
import {
  LEAVE_DURATIONS,
  LEAVE_TYPES,
  dayKey,
  employeeInfo,
  fmtDays,
  localKey,
  overlaps,
  workingDays,
  type EmployeeLeave,
  type LeavePayload,
} from "../employeeLeaveTypes";
import { formatDate } from "../../../utils/helpers";

interface Props {
  leave: EmployeeLeave | null;
  employees: Employee[];
  leaves: EmployeeLeave[]; // to warn about overlaps
  defaults: { fromDate?: string };
  recordedBy: string;
  saving: boolean;
  onSubmit: (payload: LeavePayload) => void;
  onClose: () => void;
}

const emptyForm = (fromDate: string | undefined, recordedBy: string): LeavePayload => {
  const d = fromDate || localKey();
  return {
    employee: "",
    leaveType: "Casual Leave",
    fromDate: d,
    toDate: d,
    duration: "Full Day",
    reason: "",
    remarks: "",
    recordedBy,
  };
};

const fromLeave = (l: EmployeeLeave, employees: Employee[]): LeavePayload => ({
  employee: employeeInfo(l, employees).id,
  leaveType: l.leaveType,
  fromDate: dayKey(l.fromDate),
  toDate: dayKey(l.toDate),
  duration: l.duration,
  reason: l.reason ?? "",
  remarks: l.remarks ?? "",
  recordedBy: l.recordedBy ?? "",
});

export default function LeaveForm({
  leave,
  employees,
  leaves,
  defaults,
  recordedBy,
  saving,
  onSubmit,
  onClose,
}: Props) {
  const [form, setForm] = useState<LeavePayload>(
    leave ? fromLeave(leave, employees) : emptyForm(defaults.fromDate, recordedBy)
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const bodyRef = useRef<HTMLDivElement>(null);

  const set = (key: keyof LeavePayload, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const setFrom = (value: string) =>
    setForm((f) => ({
      ...f,
      fromDate: value,
      toDate: f.duration === "Half Day" || !f.toDate || f.toDate < value ? value : f.toDate,
    }));

  const setDuration = (value: string) =>
    setForm((f) => ({ ...f, duration: value, toDate: value === "Half Day" ? f.fromDate : f.toDate }));

  // active employees (plus the one already on this record)
  const choices = employees.filter(
    (e) => e.employmentStatus === "Active" || e._id === form.employee
  );

  const estimate = form.fromDate && form.toDate ? workingDays(form.fromDate, form.toDate, form.duration) : 0;

  const clashes =
    form.employee && form.fromDate && form.toDate
      ? leaves.filter(
          (l) =>
            l._id !== leave?._id &&
            employeeInfo(l, employees).id === form.employee &&
            overlaps(form.fromDate, form.toDate, dayKey(l.fromDate), dayKey(l.toDate))
        )
      : [];

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.employee) e.employee = "Select an employee";
    if (!form.leaveType) e.leaveType = "Select a leave type";
    if (!form.fromDate) e.fromDate = "From date is required";
    if (!form.toDate) e.toDate = "To date is required";
    else if (form.fromDate && form.toDate < form.fromDate)
      e.toDate = "To date cannot be before from date";
    setErrors(e);
    if (Object.keys(e).length > 0) {
      setTimeout(() => {
        bodyRef.current
          ?.querySelector(".error, .cm-err")
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 0);
    }
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (ev: FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    onSubmit(form); // no totalDays: the backend calculates it
  };

  return (
    <>
      <div className="cm-overlay" onClick={onClose} />
      <aside className="cm-drawer lv-drawer">
        <div className="cm-drawer-head">
          <div>
            <h3>{leave ? "Edit leave" : "Record leave"}</h3>
            <p>{leave ? "Update this leave record" : "Add a leave for an employee"}</p>
          </div>
          <button className="cm-icon-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <form className="cm-form" onSubmit={handleSubmit}>
          <div className="cm-drawer-body" ref={bodyRef}>
            <div className="cm-section">Employee</div>
            <div className="cm-field">
              <label>
                Employee <span className="req">*</span>
              </label>
              <select
                value={form.employee}
                onChange={(e) => set("employee", e.target.value)}
                className={errors.employee ? "error" : ""}
              >
                <option value="">Select employee</option>
                {choices.map((e) => (
                  <option key={e._id} value={e._id}>
                    {e.employeeCode} - {e.employeeName}
                  </option>
                ))}
              </select>
              {errors.employee && <small className="cm-err">{errors.employee}</small>}
            </div>

            <div className="cm-section">Leave details</div>
            <div className="cm-field">
              <label>Leave type</label>
              <select value={form.leaveType} onChange={(e) => set("leaveType", e.target.value)}>
                {form.leaveType && !(LEAVE_TYPES as readonly string[]).includes(form.leaveType) && (
                  <option>{form.leaveType}</option>
                )}
                {LEAVE_TYPES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>

            <div className="cm-field">
              <label>Duration</label>
              <div className="lv-pills">
                {LEAVE_DURATIONS.map((d) => (
                  <button
                    type="button"
                    key={d}
                    className={form.duration === d ? "on" : ""}
                    onClick={() => setDuration(d)}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <div className="cm-grid">
              <div className="cm-field">
                <label>
                  From date <span className="req">*</span>
                </label>
                <input
                  type="date"
                  value={form.fromDate}
                  onChange={(e) => setFrom(e.target.value)}
                  className={errors.fromDate ? "error" : ""}
                />
                {errors.fromDate && <small className="cm-err">{errors.fromDate}</small>}
              </div>
              <div className="cm-field">
                <label>
                  To date <span className="req">*</span>
                </label>
                <input
                  type="date"
                  value={form.toDate}
                  disabled={form.duration === "Half Day"}
                  min={form.fromDate}
                  onChange={(e) => set("toDate", e.target.value)}
                  className={errors.toDate ? "error" : ""}
                />
                {errors.toDate && <small className="cm-err">{errors.toDate}</small>}
              </div>
            </div>

            <div className="lv-estimate">
              <Info size={16} />
              <span>
                About <strong>{fmtDays(estimate)}</strong> working day(s). The server calculates the
                final number when you save.
              </span>
            </div>

            {clashes.length > 0 && (
              <div className="lv-clash">
                This employee already has leave in these dates:{" "}
                {clashes
                  .map((c) => `${c.leaveType} (${formatDate(c.fromDate)})`)
                  .join(", ")}
                .
              </div>
            )}

            <div className="cm-section">Reason</div>
            <div className="cm-field">
              <label>Reason</label>
              <input
                value={form.reason}
                placeholder="Personal work"
                onChange={(e) => set("reason", e.target.value)}
              />
            </div>
            <div className="cm-field">
              <label>Remarks</label>
              <input
                value={form.remarks}
                placeholder="Recorded by HR"
                onChange={(e) => set("remarks", e.target.value)}
              />
            </div>
            <div className="cm-field">
              <label>Recorded by</label>
              <input value={form.recordedBy} onChange={(e) => set("recordedBy", e.target.value)} />
            </div>
          </div>

          <div className="cm-drawer-foot">
            {Object.keys(errors).length > 0 && (
              <span className="lv-form-error">
                Please fix {Object.keys(errors).length} highlighted field(s)
              </span>
            )}
            <button type="button" className="cm-btn ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="cm-btn primary" disabled={saving}>
              {saving ? "Saving..." : leave ? "Update leave" : "Record leave"}
            </button>
          </div>
        </form>
      </aside>
    </>
  );
}