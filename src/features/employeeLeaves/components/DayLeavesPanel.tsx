import { Pencil, Trash2, Plus, X } from "lucide-react";
import type { Employee } from "../../employees/employeeTypes";
import { employeeInfo, typeClass, type EmployeeLeave } from "../employeeLeaveTypes";

interface Props {
  dateKey: string;
  leaves: EmployeeLeave[];
  employees: Employee[];
  onAdd: () => void;
  onEdit: (l: EmployeeLeave) => void;
  onDelete: (l: EmployeeLeave) => void;
  onClose: () => void;
}

export default function DayLeavesPanel({
  dateKey,
  leaves,
  employees,
  onAdd,
  onEdit,
  onDelete,
  onClose,
}: Props) {
  const label = new Date(dateKey + "T00:00:00Z").toLocaleDateString("en-GB", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

  return (
    <>
      <div className="cm-overlay" onClick={onClose} />
      <div className="cm-modal lv-day-panel">
        <div className="lv-day-head">
          <div>
            <h3>{label}</h3>
            <p>
              {leaves.length === 0
                ? "Nobody is on leave"
                : `${leaves.length} employee${leaves.length > 1 ? "s" : ""} on leave`}
            </p>
          </div>
          <button className="cm-icon-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="lv-day-list">
          {leaves.map((l) => {
            const info = employeeInfo(l, employees);
            return (
              <div className="lv-day-item" key={l._id}>
                <div>
                  <div className="cm-name-sm">
                    {info.name} <span className="cm-code">{info.code}</span>
                  </div>
                  <span className={`lv-chip ${typeClass(l.leaveType)}`}>{l.leaveType}</span>{" "}
                  <span className="cm-code">{l.duration}</span>
                  {l.reason && <div className="cm-sub">{l.reason}</div>}
                </div>
                <div className="cm-actions">
                  <button className="cm-icon-btn" title="Edit" onClick={() => onEdit(l)}>
                    <Pencil size={15} />
                  </button>
                  <button className="cm-icon-btn danger" title="Delete" onClick={() => onDelete(l)}>
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <button className="cm-btn primary lv-day-add" onClick={onAdd}>
          <Plus size={16} /> Add leave on this day
        </button>
      </div>
    </>
  );
}