import { Pencil, Trash2, Phone, Mail, Building2 } from "lucide-react";
import type { Customer } from "../customerTypes";

interface Props {
  customers: Customer[];
  onEdit: (c: Customer) => void;
  onDelete: (c: Customer) => void;
}

const initials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");

export default function CustomerTable({ customers, onEdit, onDelete }: Props) {
  return (
    <div className="cm-table-wrap">
      <table className="cm-table">
        <thead>
          <tr>
            <th>Customer</th>
            <th>GST details</th>
            <th>Contact</th>
            <th>Status</th>
            <th className="cm-th-actions">Actions</th>
          </tr>
        </thead>
        <tbody>
          {customers.map((c) => (
            <tr key={c._id}>
              <td>
                <div className="cm-customer">
                  <div className="cm-avatar">{initials(c.customerLegalName)}</div>
                  <div>
                    <div className="cm-name">{c.customerLegalName}</div>
                    <div className="cm-code">{c.customerCode}</div>
                  </div>
                </div>
              </td>

              <td>
                <div className="cm-gstin">{c.gstin || "-"}</div>
                <div className="cm-sub">
                  <Building2 size={13} />
                  {c.gstState || "-"} {c.stateCode && `(${c.stateCode})`}
                </div>
              </td>

              <td>
                <div className="cm-name-sm">{c.contactPerson || "-"}</div>
                <div className="cm-sub">
                  <Phone size={13} /> {c.phoneNumber || "-"}
                </div>
                <div className="cm-sub">
                  <Mail size={13} /> {c.emailAddress || "-"}
                </div>
              </td>

              <td>
                <span className={`cm-badge ${c.isActive ? "active" : "inactive"}`}>
                  <span className="cm-dot" />
                  {c.isActive ? "Active" : "Inactive"}
                </span>
              </td>

              <td>
                <div className="cm-actions">
                  <button className="cm-icon-btn" title="Edit" onClick={() => onEdit(c)}>
                    <Pencil size={16} />
                  </button>
                  <button
                    className="cm-icon-btn danger"
                    title="Delete"
                    onClick={() => onDelete(c)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}