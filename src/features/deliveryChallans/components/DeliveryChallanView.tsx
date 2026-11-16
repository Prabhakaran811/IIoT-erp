import { X, Printer } from "lucide-react";
import type { Customer } from "../../customers/customerTypes";
import type { Project } from "../../projects/projectTypes";
import { totalQty, type DeliveryChallan } from "../deliveryChallanTypes";
import { customerNameOf, projectOf } from "./DeliveryChallanTable";
import { formatDate } from "../../../utils/helpers";

interface Props {
  challan: DeliveryChallan;
  customers: Customer[];
  projects: Project[];
  onClose: () => void;
}

const Row = ({ label, value }: { label: string; value?: string }) => (
  <div className="dc-row">
    <span>{label}</span>
    <strong>{value || "-"}</strong>
  </div>
);

export default function DeliveryChallanView({ challan: c, customers, projects, onClose }: Props) {
  const project = projectOf(c, projects);

  return (
    <>
      <div className="cm-overlay dc-no-print" onClick={onClose} />
      <aside className="cm-drawer dc-drawer dc-print">
        <div className="cm-drawer-head">
          <div>
            <h3>Delivery challan</h3>
            <p>{c.challanNumber}</p>
          </div>
          <div className="dc-head-actions dc-no-print">
            <button className="cm-icon-btn" title="Print" onClick={() => window.print()}>
              <Printer size={18} />
            </button>
            <button className="cm-icon-btn" onClick={onClose} aria-label="Close">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="cm-drawer-body">
          <div className="cm-section">Challan</div>
          <div className="dc-info">
            <Row label="Challan number" value={c.challanNumber} />
            <Row label="Date" value={formatDate(c.challanDate)} />
            <Row label="Type" value={c.challanType} />
            <Row label="Status" value={c.status} />
          </div>

          <div className="cm-section">Customer</div>
          <div className="dc-info">
            <Row label="Customer" value={customerNameOf(c, customers)} />
            <Row label="GSTIN" value={c.customerGSTIN} />
            <Row label="State" value={`${c.state || "-"} ${c.stateCode ? `(${c.stateCode})` : ""}`} />
            <Row label="Contact" value={`${c.contactPerson || "-"} ${c.contactNumber || ""}`} />
          </div>
          <Row label="Address" value={c.customerAddress} />

          <div className="cm-section">Project and PO</div>
          <div className="dc-info">
            <Row label="Project" value={`${project.name} ${project.code && `(${project.code})`}`} />
            <Row label="PO reference" value={c.poWorkOrderReference} />
            <Row label="PO date" value={formatDate(c.poDate)} />
          </div>

          <div className="cm-section">Transport</div>
          <div className="dc-info">
            <Row label="Responsible person" value={c.responsiblePerson} />
            <Row label="Vehicle number" value={c.vehicleNumber} />
            <Row label="Transporter" value={c.transporterName} />
            <Row label="E-way bill" value={c.ewayBillNumber} />
          </div>
          <Row label="Delivery site" value={c.deliverySiteLocation} />
          <Row label="Purpose" value={c.purposeOfDelivery} />

          <div className="cm-section">Items</div>
          <div className="cm-table-wrap">
            <table className="cm-table dc-items-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Description</th>
                  <th>Part no.</th>
                  <th>HSN/SAC</th>
                  <th>Qty</th>
                  <th>Serial / tag</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {c.items?.map((it, i) => (
                  <tr key={i}>
                    <td>{i + 1}</td>
                    <td>{it.itemDescription}</td>
                    <td>{it.partNumber || "-"}</td>
                    <td>{it.hsnSac || "-"}</td>
                    <td>
                      {it.quantity} {it.unit}
                    </td>
                    <td>{it.serialNumberOrTag || "-"}</td>
                    <td>{it.remarks || "-"}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={4}>Total quantity</td>
                  <td colSpan={3}>
                    <strong>{totalQty(c.items)}</strong>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {c.specialInstructions && (
            <>
              <div className="cm-section">Special instructions</div>
              <p className="dc-note">{c.specialInstructions}</p>
            </>
          )}
          {c.termsAndConditions && (
            <>
              <div className="cm-section">Terms and conditions</div>
              <p className="dc-note">{c.termsAndConditions}</p>
            </>
          )}
        </div>
      </aside>
    </>
  );
}