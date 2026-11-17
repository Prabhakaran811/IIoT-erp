import { Pencil, Trash2, History } from "lucide-react";
import { initials, type Employee } from "../../employees/employeeTypes";
import {
  dayKey,
  employeeInfo,
  fmtDays,
  leaveTotalDays,
  typeClass,
  type EmployeeLeave,
} from "../employeeLeaveTypes";
import { formatDate } from "../../../utils/helpers";

interface Props {
  leaves: EmployeeLeave[];
  employees: Employee[];
  onEdit: (l: EmployeeLeave) => void;
  onDelete: (l: EmployeeLeave) => void;
  onHistory: (employeeId: string) => void;
}

export default function LeaveTable({ leaves, employees, onEdit, onDelete, onHistory }: Props) {
  return (
    <div className="cm-table-wrap">
      <table className="cm-table">
        <thead>
          <tr>
            <th>Employee</th>
            <th>Leave type</th>
            <th>Dates</th>
            <th>Days</th>
            <th>Reason</th>
            <th>Recorded by</th>
            <th className="cm-th-actions">Actions</th>
          </tr>
        </thead>
        <tbody>
          {leaves.map((l) => {
            const info = employeeInfo(l, employees);
            const single = dayKey(l.fromDate) === dayKey(l.toDate);
            return (
              <tr key={l._id}>
                <td>
                  <div className="cm-customer">
                    <div className="cm-avatar">{initials(info.name)}</div>
                    <div>
                      <div className="cm-name">{info.name}</div>
                      <div className="cm-code">{info.code}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <span className={`lv-chip ${typeClass(l.leaveType)}`}>{l.leaveType}</span>
                </td>
                <td className="lv-nowrap">
                  {formatDate(l.fromDate)}
                  {!single && <div className="cm-sub">to {formatDate(l.toDate)}</div>}
                </td>
                <td>
                  <div className="lv-days">{fmtDays(leaveTotalDays(l))}</div>
                  <div className="cm-code">{l.duration}</div>
                </td>
                <td>
                  <div className="cm-name-sm">{l.reason || "-"}</div>
                  {l.remarks && <div className="cm-sub">{l.remarks}</div>}
                </td>
                <td>{l.recordedBy || "-"}</td>
                <td>
                  <div className="cm-actions">
                    <button className="cm-icon-btn" title="Leave history" onClick={() => onHistory(info.id)}>
                      <History size={16} />
                    </button>
                    <button className="cm-icon-btn" title="Edit" onClick={() => onEdit(l)}>
                      <Pencil size={16} />
                    </button>
                    <button className="cm-icon-btn danger" title="Delete" onClick={() => onDelete(l)}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}