import { Pencil, Trash2, MapPin, CalendarDays, FileText } from "lucide-react";
import type { Customer } from "../../customers/customerTypes";
import { resolveCustomer, type Project } from "../projectTypes";
import { formatCurrency, formatDate } from "../../../utils/helpers";

interface Props {
  projects: Project[];
  customers: Customer[];
  onEdit: (p: Project) => void;
  onDelete: (p: Project) => void;
}

const statusClass = (s: string) => s.toLowerCase().replace(/\s+/g, "-");

export default function ProjectTable({ projects, customers, onEdit, onDelete }: Props) {
  return (
    <div className="cm-table-wrap">
      <table className="cm-table">
        <thead>
          <tr>
            <th>Project</th>
            <th>Customer</th>
            <th>Purchase order</th>
            <th>Timeline</th>
            <th>Status</th>
            <th className="cm-th-actions">Actions</th>
          </tr>
        </thead>
        <tbody>
          {projects.map((p) => {
            const customer = resolveCustomer(p, customers);
            return (
              <tr key={p._id}>
                <td>
                  <div className="cm-name">{p.projectName}</div>
                  <div className="cm-code">{p.projectCode}</div>
                  {p.siteLocation && (
                    <div className="cm-sub">
                      <MapPin size={13} /> {p.siteLocation}
                    </div>
                  )}
                </td>

                <td>
                  <div className="cm-name-sm">{customer?.customerLegalName ?? "-"}</div>
                  <div className="cm-code">{customer?.customerCode ?? ""}</div>
                </td>

                <td>
                  <div className="pm-value">{formatCurrency(p.poValue)}</div>
                  <div className="cm-sub">
                    <FileText size={13} /> {p.customerPONumber || "-"}
                  </div>
                  <div className="cm-sub">{formatDate(p.poDate)}</div>
                </td>

                <td>
                  <div className="cm-sub pm-dates">
                    <CalendarDays size={13} /> {formatDate(p.projectStartDate)}
                  </div>
                  <div className="cm-sub pm-dates">
                    <CalendarDays size={13} /> {formatDate(p.projectEndDate)}
                  </div>
                </td>

                <td>
                  <span className={`cm-badge pm-status ${statusClass(p.projectStatus)}`}>
                    <span className="cm-dot" />
                    {p.projectStatus}
                  </span>
                </td>

                <td>
                  <div className="cm-actions">
                    <button className="cm-icon-btn" title="Edit" onClick={() => onEdit(p)}>
                      <Pencil size={16} />
                    </button>
                    <button
                      className="cm-icon-btn danger"
                      title="Delete"
                      onClick={() => onDelete(p)}
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