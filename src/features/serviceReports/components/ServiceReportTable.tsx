import {
  Eye, Pencil, Trash2, Lock, User, MapPin, Clock, CalendarDays, Truck,
} from "lucide-react";
import type { Customer } from "../../customers/customerTypes";
import type { Project } from "../../projects/projectTypes";
import type { DeliveryChallan } from "../../deliveryChallans/deliveryChallanTypes";
import { refId } from "../../deliveryChallans/deliveryChallanTypes";
import { duration, isEditable, type ServiceReport } from "../serviceReportTypes";
import { formatDate } from "../../../utils/helpers";

interface Props {
  reports: ServiceReport[];
  customers: Customer[];
  projects: Project[];
  challans: DeliveryChallan[];
  onView: (r: ServiceReport) => void;
  onEdit: (r: ServiceReport) => void;
  onDelete: (r: ServiceReport) => void;
}

const statusClass = (s: string) => s.toLowerCase().replace(/\s+/g, "-");

export const customerNameOf = (r: ServiceReport, customers: Customer[]) =>
  (typeof r.customer === "object" && r.customer?.customerLegalName) ||
  customers.find((x) => x._id === refId(r.customer))?.customerLegalName ||
  "-";

export const projectNameOf = (r: ServiceReport, projects: Project[]) =>
  (typeof r.project === "object" && r.project?.projectName) ||
  projects.find((x) => x._id === refId(r.project))?.projectName ||
  "-";

export const challanNumberOf = (r: ServiceReport, challans: DeliveryChallan[]) => {
  if (!r.deliveryChallan) return "";
  return (
    (typeof r.deliveryChallan === "object" && r.deliveryChallan.challanNumber) ||
    challans.find((x) => x._id === refId(r.deliveryChallan))?.challanNumber ||
    ""
  );
};

export default function ServiceReportTable({
  reports,
  customers,
  projects,
  challans,
  onView,
  onEdit,
  onDelete,
}: Props) {
  return (
    <div className="cm-table-wrap">
      <table className="cm-table">
        <thead>
          <tr>
            <th>Report</th>
            <th>Customer and project</th>
            <th>Engineer and site</th>
            <th>Time</th>
            <th>Work done</th>
            <th>Status</th>
            <th className="cm-th-actions">Actions</th>
          </tr>
        </thead>
        <tbody>
          {reports.map((r) => {
            const challanNo = challanNumberOf(r, challans);
            const editable = isEditable(r.status);
            const deletable = r.status !== "Completed";

            return (
              <tr key={r._id}>
                <td>
                  <div className="cm-name">{r.serviceReportNumber}</div>
                  <div className="cm-sub">
                    <CalendarDays size={13} /> {formatDate(r.serviceDate)}
                  </div>
                  {challanNo && (
                    <span className="sr-chip">
                      <Truck size={12} /> {challanNo}
                    </span>
                  )}
                </td>

                <td>
                  <div className="cm-name-sm">{customerNameOf(r, customers)}</div>
                  <div className="cm-code">{projectNameOf(r, projects)}</div>
                </td>

                <td>
                  <div className="cm-name-sm">
                    <span className="sr-inline">
                      <User size={13} /> {r.serviceEngineer || "-"}
                    </span>
                  </div>
                  <div className="cm-sub">
                    <MapPin size={13} /> {r.siteLocation || "-"}
                  </div>
                </td>

                <td>
                  <div className="cm-sub sr-nowrap">
                    <Clock size={13} /> {r.startTime || "--"} to {r.endTime || "--"}
                  </div>
                  <div className="sr-duration">{duration(r.startTime, r.endTime)}</div>
                </td>

                <td>
                  <div className="cm-sub">{r.equipmentDetails?.length ?? 0} equipment</div>
                  <div className="cm-sub">{r.solutions?.length ?? 0} solutions</div>
                  <div className="cm-sub">{r.materialsUsed?.length ?? 0} materials</div>
                </td>

                <td>
                  <span className={`cm-badge sr-status ${statusClass(r.status)}`}>
                    <span className="cm-dot" />
                    {r.status}
                  </span>
                </td>

                <td>
                  <div className="cm-actions">
                    <button className="cm-icon-btn" title="View / Print" onClick={() => onView(r)}>
                      <Eye size={16} />
                    </button>

                    <button
                      className="cm-icon-btn"
                      disabled={!editable}
                      title={
                        editable
                          ? "Edit"
                          : "Only Draft and In Progress reports can be edited"
                      }
                      onClick={() => onEdit(r)}
                    >
                      {editable ? <Pencil size={16} /> : <Lock size={16} />}
                    </button>

                    <button
                      className="cm-icon-btn danger"
                      disabled={!deletable}
                      title={deletable ? "Delete" : "Completed reports cannot be deleted"}
                      onClick={() => onDelete(r)}
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