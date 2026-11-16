import { Eye, Pencil, Trash2, Truck, MapPin, CalendarDays } from "lucide-react";
import type { Customer } from "../../customers/customerTypes";
import type { Project } from "../../projects/projectTypes";
import { refId, totalQty, type DeliveryChallan } from "../deliveryChallanTypes";
import { formatDate } from "../../../utils/helpers";

interface Props {
  challans: DeliveryChallan[];
  customers: Customer[];
  projects: Project[];
  onView: (c: DeliveryChallan) => void;
  onEdit: (c: DeliveryChallan) => void;
  onDelete: (c: DeliveryChallan) => void;
}

const statusClass = (s: string) => s.toLowerCase().replace(/\s+/g, "-");

export const customerNameOf = (c: DeliveryChallan, customers: Customer[]) =>
  (typeof c.customer === "object" && c.customer?.customerLegalName) ||
  customers.find((x) => x._id === refId(c.customer))?.customerLegalName ||
  "-";

export const projectOf = (c: DeliveryChallan, projects: Project[]) => {
  const p =
    typeof c.project === "object" && c.project?.projectName
      ? c.project
      : projects.find((x) => x._id === refId(c.project));
  return { name: p?.projectName ?? "-", code: p?.projectCode ?? "" };
};

export default function DeliveryChallanTable({
  challans,
  customers,
  projects,
  onView,
  onEdit,
  onDelete,
}: Props) {
  return (
    <div className="cm-table-wrap">
      <table className="cm-table">
        <thead>
          <tr>
            <th>Challan</th>
            <th>Customer</th>
            <th>Project</th>
            <th>Transport</th>
            <th>Items</th>
            <th>Status</th>
            <th className="cm-th-actions">Actions</th>
          </tr>
        </thead>
        <tbody>
          {challans.map((c) => {
            const project = projectOf(c, projects);
            return (
              <tr key={c._id}>
                <td>
                  <div className="cm-name">{c.challanNumber}</div>
                  <div className="cm-sub">
                    <CalendarDays size={13} /> {formatDate(c.challanDate)}
                  </div>
                  <span className="dc-type">{c.challanType}</span>
                </td>

                <td>
                  <div className="cm-name-sm">{customerNameOf(c, customers)}</div>
                  <div className="cm-sub">
                    <MapPin size={13} /> {c.deliverySiteLocation || c.state || "-"}
                  </div>
                </td>

                <td>
                  <div className="cm-name-sm">{project.name}</div>
                  <div className="cm-code">{project.code}</div>
                  {c.poWorkOrderReference && (
                    <div className="cm-sub">PO: {c.poWorkOrderReference}</div>
                  )}
                </td>

                <td>
                  <div className="cm-gstin">{c.vehicleNumber || "-"}</div>
                  <div className="cm-sub">
                    <Truck size={13} /> {c.transporterName || "-"}
                  </div>
                </td>

                <td>
                  <div className="cm-name-sm">{c.items?.length ?? 0} items</div>
                  <div className="cm-sub">Total qty {totalQty(c.items)}</div>
                </td>

                <td>
                  <span className={`cm-badge dc-status ${statusClass(c.status)}`}>
                    <span className="cm-dot" />
                    {c.status}
                  </span>
                </td>

                <td>
                  <div className="cm-actions">
                    <button className="cm-icon-btn" title="View / Print" onClick={() => onView(c)}>
                      <Eye size={16} />
                    </button>
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
            );
          })}
        </tbody>
      </table>
    </div>
  );
}