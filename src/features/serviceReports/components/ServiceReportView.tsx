import { X, Printer } from "lucide-react";
import type { Customer } from "../../customers/customerTypes";
import type { Project } from "../../projects/projectTypes";
import type { DeliveryChallan } from "../../deliveryChallans/deliveryChallanTypes";
import { duration, type ServiceReport } from "../serviceReportTypes";
import { challanNumberOf, customerNameOf, projectNameOf } from "./ServiceReportTable";
import { formatDate } from "../../../utils/helpers";

interface Props {
  report: ServiceReport;
  customers: Customer[];
  projects: Project[];
  challans: DeliveryChallan[];
  onClose: () => void;
}

const Row = ({ label, value }: { label: string; value?: string }) => (
  <div className="sr-info-row">
    <span>{label}</span>
    <strong>{value || "-"}</strong>
  </div>
);

export default function ServiceReportView({ report: r, customers, projects, challans, onClose }: Props) {
  return (
    <>
      <div className="cm-overlay sr-no-print" onClick={onClose} />
      <aside className="cm-drawer sr-drawer sr-print">
        <div className="cm-drawer-head">
          <div>
            <h3>Service report</h3>
            <p>{r.serviceReportNumber}</p>
          </div>
          <div className="sr-head-actions sr-no-print">
            <button className="cm-icon-btn" title="Print" onClick={() => window.print()}>
              <Printer size={18} />
            </button>
            <button className="cm-icon-btn" onClick={onClose} aria-label="Close">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="cm-drawer-body">
          <div className="cm-section">Report</div>
          <div className="sr-info">
            <Row label="Report number" value={r.serviceReportNumber} />
            <Row label="Service date" value={formatDate(r.serviceDate)} />
            <Row label="Status" value={r.status} />
            <Row label="Delivery challan" value={challanNumberOf(r, challans)} />
            <Row label="Customer" value={customerNameOf(r, customers)} />
            <Row label="Project" value={projectNameOf(r, projects)} />
            <Row label="Service engineer" value={r.serviceEngineer} />
            <Row label="Site location" value={r.siteLocation} />
            <Row label="Time" value={`${r.startTime || "--"} to ${r.endTime || "--"}`} />
            <Row label="Duration" value={duration(r.startTime, r.endTime)} />
          </div>

          <div className="cm-section">Equipment details</div>
          {r.equipmentDetails?.length ? (
            <div className="cm-table-wrap">
              <table className="cm-table sr-small-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Equipment</th>
                    <th>Make</th>
                    <th>Model</th>
                    <th>Serial / tag</th>
                    <th>Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {r.equipmentDetails.map((e, i) => (
                    <tr key={i}>
                      <td>{i + 1}</td>
                      <td>{e.equipmentName}</td>
                      <td>{e.make || "-"}</td>
                      <td>{e.model || "-"}</td>
                      <td>{e.serialNumberOrTag || "-"}</td>
                      <td>{e.remarks || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="sr-note">No equipment recorded.</p>
          )}

          <div className="cm-section">Problem description</div>
          <p className="sr-note">{r.problemDescription || "-"}</p>

          <div className="cm-section">Solutions</div>
          {r.solutions?.length ? (
            <ol className="sr-list">
              {r.solutions.map((s, i) => (
                <li key={i}>
                  <div>{s.solutionDescription}</div>
                  {s.remarks && <small>{s.remarks}</small>}
                </li>
              ))}
            </ol>
          ) : (
            <p className="sr-note">No solutions recorded.</p>
          )}

          <div className="cm-section">Materials used</div>
          {r.materialsUsed?.length ? (
            <div className="cm-table-wrap">
              <table className="cm-table sr-small-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Material</th>
                    <th>Part no.</th>
                    <th>Qty</th>
                    <th>Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {r.materialsUsed.map((m, i) => (
                    <tr key={i}>
                      <td>{i + 1}</td>
                      <td>{m.materialDescription}</td>
                      <td>{m.partNumber || "-"}</td>
                      <td>
                        {m.quantity} {m.unit}
                      </td>
                      <td>{m.remarks || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="sr-note">No materials used.</p>
          )}

          <div className="cm-section">Customer feedback</div>
          <p className="sr-note">{r.customerFeedback || "-"}</p>

          <div className="sr-signatures">
            <div>
              <div className="sr-sign-line" />
              <span>Service engineer</span>
              <strong>{r.serviceEngineer}</strong>
            </div>
            <div>
              <div className="sr-sign-line" />
              <span>Customer representative</span>
              <strong>{r.customerRepresentativeName}</strong>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}