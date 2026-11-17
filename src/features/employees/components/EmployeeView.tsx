import { X, Pencil } from "lucide-react";
import { ageFrom, initials, tenureFrom, type Employee } from "../employeeTypes";
import { managerOf } from "./EmployeeTable";
import { formatDate } from "../../../utils/helpers";

interface Props {
  employee: Employee;
  employees: Employee[];
  onEdit: (e: Employee) => void;
  onClose: () => void;
}

const statusClass = (s: string) => s.toLowerCase().replace(/\s+/g, "-");

const Row = ({ label, value }: { label: string; value?: string }) => (
  <div className="em-info-row">
    <span>{label}</span>
    <strong>{value || "-"}</strong>
  </div>
);

export default function EmployeeView({ employee: e, employees, onEdit, onClose }: Props) {
  const manager = managerOf(e, employees);
  const reports = employees.filter(
    (x) => x._id !== e._id && managerOf(x, employees)?._id === e._id
  );
  const age = ageFrom(e.dateOfBirth);

  return (
    <>
      <div className="cm-overlay" onClick={onClose} />
      <aside className="cm-drawer em-drawer">
        <div className="em-profile-head">
          <button className="cm-icon-btn em-close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
          <div className="em-profile-avatar">{initials(e.employeeName)}</div>
          <h3>{e.employeeName}</h3>
          <p>
            {e.designation || "-"}
            {e.department ? ` · ${e.department}` : ""}
          </p>
          <span className={`cm-badge em-status ${statusClass(e.employmentStatus)}`}>
            <span className="cm-dot" />
            {e.employmentStatus}
          </span>
        </div>

        <div className="cm-drawer-body">
          <div className="cm-section">Employment</div>
          <div className="em-info">
            <Row label="Employee code" value={e.employeeCode} />
            <Row label="Employee type" value={e.employeeType} />
            <Row label="Joining date" value={formatDate(e.joiningDate)} />
            <Row label="Tenure" value={tenureFrom(e.joiningDate)} />
            <Row
              label="Reports to"
              value={manager ? `${manager.employeeName} (${manager.employeeCode})` : ""}
            />
            <Row label="Direct reports" value={reports.length ? String(reports.length) : "None"} />
          </div>
          {reports.length > 0 && (
            <div className="em-reports">
              {reports.map((r) => (
                <span className="em-type" key={r._id}>
                  {r.employeeName}
                </span>
              ))}
            </div>
          )}

          <div className="cm-section">Contact</div>
          <div className="em-info">
            <Row label="Phone" value={e.phoneNumber} />
            <Row label="Email" value={e.emailAddress} />
          </div>
          <Row label="Address" value={e.address} />

          <div className="cm-section">Personal</div>
          <div className="em-info">
            <Row label="Gender" value={e.gender} />
            <Row
              label="Date of birth"
              value={e.dateOfBirth ? `${formatDate(e.dateOfBirth)}${age ? ` (${age})` : ""}` : ""}
            />
          </div>

          <div className="cm-section">Emergency contact</div>
          <div className="em-info">
            <Row label="Name" value={e.emergencyContactName} />
            <Row label="Number" value={e.emergencyContactNumber} />
          </div>
        </div>

        <div className="cm-drawer-foot">
          <button className="cm-btn ghost" onClick={onClose}>
            Close
          </button>
          <button className="cm-btn primary" onClick={() => onEdit(e)}>
            <Pencil size={16} /> Edit employee
          </button>
        </div>
      </aside>
    </>
  );
}