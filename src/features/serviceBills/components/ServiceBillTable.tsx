import { Eye, Pencil, Trash2, Lock, CalendarDays, Wrench, Truck } from "lucide-react";
import type { Customer } from "../../customers/customerTypes";
import type { Project } from "../../projects/projectTypes";
import { refId, type DeliveryChallan } from "../../deliveryChallans/deliveryChallanTypes";
import type { ServiceReport } from "../../serviceReports/serviceReportTypes";
import { billTotals, isEditable, type ServiceBill } from "../serviceBillTypes";
import { formatDate, formatMoney } from "../../../utils/helpers";

interface Props {
  bills: ServiceBill[];
  customers: Customer[];
  projects: Project[];
  challans: DeliveryChallan[];
  reports: ServiceReport[];
  onView: (b: ServiceBill) => void;
  onEdit: (b: ServiceBill) => void;
  onDelete: (b: ServiceBill) => void;
}

const statusClass = (s: string) => s.toLowerCase().replace(/\s+/g, "-");

export const customerOf = (b: ServiceBill, customers: Customer[]) =>
  customers.find((x) => x._id === refId(b.customer));

export const customerNameOf = (b: ServiceBill, customers: Customer[]) =>
  (typeof b.customer === "object" && b.customer?.customerLegalName) ||
  customerOf(b, customers)?.customerLegalName ||
  "-";

export const projectNameOf = (b: ServiceBill, projects: Project[]) =>
  (typeof b.project === "object" && b.project?.projectName) ||
  projects.find((x) => x._id === refId(b.project))?.projectName ||
  "-";

export const reportNumberOf = (b: ServiceBill, reports: ServiceReport[]) => {
  if (!b.serviceReport) return "";
  return (
    (typeof b.serviceReport === "object" && b.serviceReport.serviceReportNumber) ||
    reports.find((x) => x._id === refId(b.serviceReport))?.serviceReportNumber ||
    ""
  );
};

export const challanNumberOf = (b: ServiceBill, challans: DeliveryChallan[]) => {
  if (!b.deliveryChallan) return "";
  return (
    (typeof b.deliveryChallan === "object" && b.deliveryChallan.challanNumber) ||
    challans.find((x) => x._id === refId(b.deliveryChallan))?.challanNumber ||
    ""
  );
};

export default function ServiceBillTable({
  bills,
  customers,
  projects,
  challans,
  reports,
  onView,
  onEdit,
  onDelete,
}: Props) {
  return (
    <div className="cm-table-wrap">
      <table className="cm-table">
        <thead>
          <tr>
            <th>Invoice</th>
            <th>Customer and project</th>
            <th>Linked documents</th>
            <th>Amount</th>
            <th>Status</th>
            <th className="cm-th-actions">Actions</th>
          </tr>
        </thead>
        <tbody>
          {bills.map((b) => {
            const totals = billTotals(b);
            const reportNo = reportNumberOf(b, reports);
            const challanNo = challanNumberOf(b, challans);
            const editable = isEditable(b.approvalStatus);

            return (
              <tr key={b._id}>
                <td>
                  <div className="cm-name">{b.invoiceNumber}</div>
                  <div className="cm-sub">
                    <CalendarDays size={13} /> {formatDate(b.invoiceDate)}
                  </div>
                  <div className="cm-sub">Due {formatDate(b.paymentDueDate)}</div>
                </td>

                <td>
                  <div className="cm-name-sm">{customerNameOf(b, customers)}</div>
                  <div className="cm-code">{projectNameOf(b, projects)}</div>
                </td>

                <td>
                  {reportNo || challanNo ? (
                    <div className="sb-chips">
                      {reportNo && (
                        <span className="sb-chip">
                          <Wrench size={12} /> {reportNo}
                        </span>
                      )}
                      {challanNo && (
                        <span className="sb-chip">
                          <Truck size={12} /> {challanNo}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="cm-sub">-</span>
                  )}
                </td>

                <td>
                  <div className="sb-amount">{formatMoney(totals.grandTotal)}</div>
                  <div className="cm-sub">Subtotal {formatMoney(totals.subtotal)}</div>
                  <div className="cm-sub">GST {b.gstRate}%</div>
                </td>

                <td>
                  <span className={`cm-badge sb-status ${statusClass(b.approvalStatus)}`}>
                    <span className="cm-dot" />
                    {b.approvalStatus}
                  </span>
                </td>

                <td>
                  <div className="cm-actions">
                    <button className="cm-icon-btn" title="View / Print" onClick={() => onView(b)}>
                      <Eye size={16} />
                    </button>
                    <button
                      className="cm-icon-btn"
                      disabled={!editable}
                      title={editable ? "Edit" : "Only Draft invoices can be edited"}
                      onClick={() => onEdit(b)}
                    >
                      {editable ? <Pencil size={16} /> : <Lock size={16} />}
                    </button>
                    <button
                      className="cm-icon-btn danger"
                      disabled={!editable}
                      title={editable ? "Delete" : "Only Draft invoices can be deleted"}
                      onClick={() => onDelete(b)}
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