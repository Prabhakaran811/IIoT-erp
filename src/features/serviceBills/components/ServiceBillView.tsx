import { X, Printer } from "lucide-react";
import type { Customer } from "../../customers/customerTypes";
import type { Project } from "../../projects/projectTypes";
import type { DeliveryChallan } from "../../deliveryChallans/deliveryChallanTypes";
import type { ServiceReport } from "../../serviceReports/serviceReportTypes";
import { billTotals, type ServiceBill } from "../serviceBillTypes";
import {
  challanNumberOf,
  customerNameOf,
  customerOf,
  projectNameOf,
  reportNumberOf,
} from "./ServiceBillTable";
import { formatDate, formatMoney } from "../../../utils/helpers";

interface Props {
  bill: ServiceBill;
  customers: Customer[];
  projects: Project[];
  challans: DeliveryChallan[];
  reports: ServiceReport[];
  onClose: () => void;
}

const Row = ({ label, value }: { label: string; value?: string }) => (
  <div className="sb-info-row">
    <span>{label}</span>
    <strong>{value || "-"}</strong>
  </div>
);

export default function ServiceBillView({ bill: b, customers, projects, challans, reports, onClose }: Props) {
  const totals = billTotals(b);
  const customer = customerOf(b, customers);
  const half = (b.gstRate || 0) / 2;

  return (
    <>
      <div className="cm-overlay sb-no-print" onClick={onClose} />
      <aside className="cm-drawer sb-drawer sb-print">
        <div className="cm-drawer-head">
          <div>
            <h3>Service bill</h3>
            <p>{b.invoiceNumber}</p>
          </div>
          <div className="sb-head-actions sb-no-print">
            <button className="cm-icon-btn" title="Print" onClick={() => window.print()}>
              <Printer size={18} />
            </button>
            <button className="cm-icon-btn" onClick={onClose} aria-label="Close">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="cm-drawer-body">
          <div className="cm-section">Invoice</div>
          <div className="sb-info">
            <Row label="Invoice number" value={b.invoiceNumber} />
            <Row label="Status" value={b.approvalStatus} />
            <Row label="Invoice date" value={formatDate(b.invoiceDate)} />
            <Row label="Payment due date" value={formatDate(b.paymentDueDate)} />
            <Row
              label="Service period"
              value={
                b.servicePeriod?.fromDate || b.servicePeriod?.toDate
                  ? `${formatDate(b.servicePeriod?.fromDate)} to ${formatDate(b.servicePeriod?.toDate)}`
                  : ""
              }
            />
            <Row label="Project" value={projectNameOf(b, projects)} />
            <Row label="Service report" value={reportNumberOf(b, reports)} />
            <Row label="Delivery challan" value={challanNumberOf(b, challans)} />
          </div>

          <div className="cm-section">Bill to</div>
          <div className="sb-info">
            <Row label="Customer" value={customerNameOf(b, customers)} />
            <Row label="GSTIN" value={customer?.gstin} />
            <Row
              label="State"
              value={customer ? `${customer.gstState} ${customer.stateCode && `(${customer.stateCode})`}` : ""}
            />
            <Row label="Billing address" value={customer?.billingAddress} />
          </div>

          <div className="cm-section">Services</div>
          <div className="cm-table-wrap">
            <table className="cm-table sb-small-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Description</th>
                  <th>SAC</th>
                  <th>Qty</th>
                  <th>Rate</th>
                  <th className="sb-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {b.items?.map((it, i) => (
                  <tr key={i}>
                    <td>{i + 1}</td>
                    <td>{it.serviceDescription}</td>
                    <td>{it.sacCode || "-"}</td>
                    <td>
                      {it.quantity} {it.unit}
                    </td>
                    <td>{formatMoney(it.rate)}</td>
                    <td className="sb-right">
                      {formatMoney(it.amount ?? it.quantity * it.rate)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="sb-totals sb-totals-view">
            <div className="sb-total-row">
              <span>Subtotal</span>
              <strong>{formatMoney(totals.subtotal)}</strong>
            </div>
            <div className="sb-total-row">
              <span>Discount</span>
              <strong>- {formatMoney(totals.discount)}</strong>
            </div>
            <div className="sb-total-row">
              <span>Taxable value</span>
              <strong>{formatMoney(totals.taxableValue)}</strong>
            </div>
            <div className="sb-total-row">
              <span>CGST ({half}%)</span>
              <strong>{formatMoney(totals.cgst)}</strong>
            </div>
            <div className="sb-total-row">
              <span>SGST ({half}%)</span>
              <strong>{formatMoney(totals.sgst)}</strong>
            </div>
            <div className="sb-total-row grand">
              <span>Grand total</span>
              <strong>{formatMoney(totals.grandTotal)}</strong>
            </div>
          </div>

          {b.serviceDescriptionSummary && (
            <>
              <div className="cm-section">Service summary</div>
              <p className="sb-note">{b.serviceDescriptionSummary}</p>
            </>
          )}
          {b.termsAndConditions && (
            <>
              <div className="cm-section">Terms and conditions</div>
              <p className="sb-note">{b.termsAndConditions}</p>
            </>
          )}

          <div className="sb-signature">
            <div className="sb-sign-line" />
            <span>Authorised signatory</span>
          </div>
        </div>
      </aside>
    </>
  );
}