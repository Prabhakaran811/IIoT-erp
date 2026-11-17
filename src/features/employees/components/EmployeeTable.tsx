import { Eye, Pencil, Trash2, Phone, Mail, CalendarDays } from "lucide-react";
import {
  initials,
  managerId,
  tenureFrom,
  type Employee,
  type ManagerRef,
} from "../employeeTypes";
import { formatDate } from "../../../utils/helpers";

interface Props {
  employees: Employee[];
  onView: (e: Employee) => void;
  onEdit: (e: Employee) => void;
  onDelete: (e: Employee) => void;
}

const statusClass = (s: string) => s.toLowerCase().replace(/\s+/g, "-");

export const managerOf = (e: Employee, employees: Employee[]): ManagerRef | undefined => {
  if (typeof e.reportingManager === "object" && e.reportingManager?.employeeName)
    return e.reportingManager;
  return employees.find((x) => x._id === managerId(e));
};

export default function EmployeeTable({ employees, onView, onEdit, onDelete }: Props) {
  return (
    <div className="cm-table-wrap">
      <table className="cm-table">
        <thead>
          <tr>
            <th>Employee</th>
            <th>Role</th>
            <th>Contact</th>
            <th>Employment</th>
            <th>Reports to</th>
            <th>Status</th>
            <th className="cm-th-actions">Actions</th>
          </tr>
        </thead>
        <tbody>
          {employees.map((e) => {
            const manager = managerOf(e, employees);
            return (
              <tr key={e._id}>
                <td>
                  <div className="cm-customer">
                    <div className="cm-avatar">{initials(e.employeeName)}</div>
                    <div>
                      <div className="cm-name">{e.employeeName}</div>
                      <div className="cm-code">{e.employeeCode}</div>
                    </div>
                  </div>
                </td>

                <td>
                  <div className="cm-name-sm">{e.designation || "-"}</div>
                  <div className="cm-code">{e.department || "-"}</div>
                </td>

                <td>
                  <div className="cm-sub">
                    <Phone size={13} /> {e.phoneNumber || "-"}
                  </div>
                  <div className="cm-sub">
                    <Mail size={13} /> {e.emailAddress || "-"}
                  </div>
                </td>

                <td>
                  <span className="em-type">{e.employeeType || "-"}</span>
                  <div className="cm-sub">
                    <CalendarDays size={13} /> {formatDate(e.joiningDate)}
                  </div>
                  <div className="cm-sub">{tenureFrom(e.joiningDate)}</div>
                </td>

                <td>
                  {manager ? (
                    <>
                      <div className="cm-name-sm">{manager.employeeName}</div>
                      <div className="cm-code">{manager.employeeCode}</div>
                    </>
                  ) : (
                    <span className="cm-sub">-</span>
                  )}
                </td>

                <td>
                  <span className={`cm-badge em-status ${statusClass(e.employmentStatus)}`}>
                    <span className="cm-dot" />
                    {e.employmentStatus}
                  </span>
                </td>

                <td>
                  <div className="cm-actions">
                    <button className="cm-icon-btn" title="View profile" onClick={() => onView(e)}>
                      <Eye size={16} />
                    </button>
                    <button className="cm-icon-btn" title="Edit" onClick={() => onEdit(e)}>
                      <Pencil size={16} />
                    </button>
                    <button
                      className="cm-icon-btn danger"
                      title="Delete"
                      onClick={() => onDelete(e)}
                    >
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