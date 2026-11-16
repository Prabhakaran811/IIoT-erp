import { useMemo, useRef, useState, type FormEvent } from "react";
import { X, Plus, Trash2, Info } from "lucide-react";
import type { Customer } from "../../customers/customerTypes";
import { getCustomerId, type Project } from "../../projects/projectTypes";
import {
  refId,
  type DeliveryChallan,
} from "../../deliveryChallans/deliveryChallanTypes";
import { customerNameOf as challanCustomerName } from "../../deliveryChallans/components/DeliveryChallanTable";
import type { ServiceReport } from "../../serviceReports/serviceReportTypes";
import { customerNameOf as reportCustomerName } from "../../serviceReports/components/ServiceReportTable";
import {
  BILL_STATUSES,
  BILL_UNITS,
  computeTotals,
  type ServiceBill,
  type ServiceBillPayload,
} from "../serviceBillTypes";
import { formatMoney, toDateInput } from "../../../utils/helpers";

interface Props {
  bill: ServiceBill | null;
  customers: Customer[];
  projects: Project[];
  challans: DeliveryChallan[];
  reports: ServiceReport[];
  nextNumber: string;
  saving: boolean;
  onSubmit: (payload: ServiceBillPayload) => void;
  onClose: () => void;
}

// numbers stay text while typing, converted on submit
interface ItemForm {
  serviceDescription: string;
  sacCode: string;
  quantity: string;
  unit: string;
  rate: string;
}

interface FormState {
  invoiceNumber: string;
  invoiceDate: string;
  paymentDueDate: string;
  approvalStatus: string;
  deliveryChallan: string; // "" = none
  serviceReport: string; // "" = none
  fromDate: string;
  toDate: string;
  customer: string;
  project: string;
  items: ItemForm[];
  serviceDescriptionSummary: string;
  termsAndConditions: string;
  discount: string;
  gstRate: string;
}

type TextKey = Exclude<keyof FormState, "items">;

const today = () => new Date().toISOString().slice(0, 10);

const addDays = (date: string, days: number) => {
  if (!date) return "";
  const d = new Date(date + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

const emptyItem = (): ItemForm => ({
  serviceDescription: "",
  sacCode: "",
  quantity: "1",
  unit: "Hours",
  rate: "",
});

const emptyForm = (number: string): FormState => ({
  invoiceNumber: number,
  invoiceDate: today(),
  paymentDueDate: addDays(today(), 30),
  approvalStatus: "Draft",
  deliveryChallan: "",
  serviceReport: "",
  fromDate: "",
  toDate: "",
  customer: "",
  project: "",
  items: [emptyItem()],
  serviceDescriptionSummary: "",
  termsAndConditions: "Payment due within 30 days from invoice date.",
  discount: "0",
  gstRate: "18",
});

const fromBill = (b: ServiceBill): FormState => ({
  invoiceNumber: b.invoiceNumber,
  invoiceDate: toDateInput(b.invoiceDate),
  paymentDueDate: toDateInput(b.paymentDueDate),
  approvalStatus: b.approvalStatus,
  deliveryChallan: refId(b.deliveryChallan),
  serviceReport: refId(b.serviceReport),
  fromDate: toDateInput(b.servicePeriod?.fromDate),
  toDate: toDateInput(b.servicePeriod?.toDate),
  customer: refId(b.customer),
  project: refId(b.project),
  items: b.items?.length
    ? b.items.map((i) => ({
        serviceDescription: i.serviceDescription ?? "",
        sacCode: i.sacCode ?? "",
        quantity: String(i.quantity ?? ""),
        unit: i.unit ?? "Hours",
        rate: String(i.rate ?? ""),
      }))
    : [emptyItem()],
  serviceDescriptionSummary: b.serviceDescriptionSummary ?? "",
  termsAndConditions: b.termsAndConditions ?? "",
  discount: String(b.discount ?? 0),
  gstRate: String(b.gstRate ?? 18),
});

// rows the user never filled are dropped on save
const blankItem = (i: ItemForm) =>
  !i.serviceDescription.trim() && !i.sacCode.trim() && !Number(i.rate);

export default function ServiceBillForm({
  bill,
  customers,
  projects,
  challans,
  reports,
  nextNumber,
  saving,
  onSubmit,
  onClose,
}: Props) {
  const [form, setForm] = useState<FormState>(bill ? fromBill(bill) : emptyForm(nextNumber));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const bodyRef = useRef<HTMLDivElement>(null);

  const set = (key: TextKey, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const totals = useMemo(
    () => computeTotals(form.items.filter((i) => !blankItem(i)), form.discount, form.gstRate),
    [form.items, form.discount, form.gstRate]
  );

  /* invoice date moves the auto due date with it */
  const handleInvoiceDate = (value: string) =>
    setForm((f) => ({
      ...f,
      invoiceDate: value,
      paymentDueDate:
        !f.paymentDueDate || f.paymentDueDate === addDays(f.invoiceDate, 30)
          ? addDays(value, 30)
          : f.paymentDueDate,
    }));

  /* service report chosen: prefill customer, project, challan, period */
  const handleReport = (id: string) => {
    const r = reports.find((x) => x._id === id);
    setForm((f) => ({
      ...f,
      serviceReport: id,
      customer: (r && refId(r.customer)) || f.customer,
      project: (r && refId(r.project)) || f.project,
      deliveryChallan: (r && refId(r.deliveryChallan)) || f.deliveryChallan,
      fromDate: f.fromDate || toDateInput(r?.serviceDate),
      toDate: f.toDate || toDateInput(r?.serviceDate),
    }));
  };

  /* challan chosen: prefill customer, project */
  const handleChallan = (id: string) => {
    const c = challans.find((x) => x._id === id);
    setForm((f) => ({
      ...f,
      deliveryChallan: id,
      customer: (c && refId(c.customer)) || f.customer,
      project: (c && refId(c.project)) || f.project,
    }));
  };

  /* items */
  const setItem = (index: number, key: keyof ItemForm, value: string) =>
    setForm((f) => ({
      ...f,
      items: f.items.map((it, i) => (i === index ? { ...it, [key]: value } : it)),
    }));
  const addItem = () => setForm((f) => ({ ...f, items: [...f.items, emptyItem()] }));
  const removeItem = (index: number) =>
    setForm((f) => ({ ...f, items: f.items.filter((_, i) => i !== index) }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.invoiceNumber.trim()) e.invoiceNumber = "Invoice number is required";
    if (!form.invoiceDate) e.invoiceDate = "Invoice date is required";
    if (!form.paymentDueDate) e.paymentDueDate = "Due date is required";
    else if (form.invoiceDate && form.paymentDueDate < form.invoiceDate)
      e.paymentDueDate = "Due date cannot be before invoice date";
    if (!form.customer) e.customer = "Select a customer";
    if (!form.project) e.project = "Select a project";
    if (form.fromDate && form.toDate && form.toDate < form.fromDate)
      e.toDate = "To date cannot be before from date";

    const filled = form.items.filter((i) => !blankItem(i));
    if (filled.length === 0) e.items = "Add at least one service item";
    form.items.forEach((it, i) => {
      if (blankItem(it)) return;
      if (!it.serviceDescription.trim()) e[`item-${i}-desc`] = "Description is required";
      if (!(Number(it.quantity) > 0)) e[`item-${i}-qty`] = "Quantity must be above 0";
      if (it.rate === "" || Number(it.rate) < 0) e[`item-${i}-rate`] = "Enter the rate";
    });

    const discount = Number(form.discount) || 0;
    if (discount < 0) e.discount = "Discount cannot be negative";
    else if (discount > totals.subtotal) e.discount = "Discount cannot exceed the subtotal";
    const gst = Number(form.gstRate);
    if (form.gstRate === "" || isNaN(gst) || gst < 0 || gst > 100)
      e.gstRate = "GST rate must be between 0 and 100";

    setErrors(e);
    if (Object.keys(e).length > 0) {
      console.log("Service bill validation errors:", e);
      setTimeout(() => {
        bodyRef.current
          ?.querySelector(".error, .cm-err")
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 0);
    }
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (ev: FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;

    // no calculated totals are sent: the backend works them out
    onSubmit({
      invoiceNumber: form.invoiceNumber,
      invoiceDate: form.invoiceDate,
      paymentDueDate: form.paymentDueDate,
      approvalStatus: form.approvalStatus,
      deliveryChallan: form.deliveryChallan || null,
      serviceReport: form.serviceReport || null,
      servicePeriod: { fromDate: form.fromDate, toDate: form.toDate },
      customer: form.customer,
      project: form.project,
      items: form.items
        .filter((i) => !blankItem(i))
        .map((i) => ({
          serviceDescription: i.serviceDescription,
          sacCode: i.sacCode,
          quantity: Number(i.quantity),
          unit: i.unit,
          rate: Number(i.rate),
        })),
      serviceDescriptionSummary: form.serviceDescriptionSummary,
      termsAndConditions: form.termsAndConditions,
      discount: Number(form.discount) || 0,
      gstRate: Number(form.gstRate),
    });
  };

  const input = (
    label: string,
    key: TextKey,
    opts: {
      type?: string;
      placeholder?: string;
      required?: boolean;
      onChange?: (v: string) => void;
    } = {}
  ) => (
    <div className="cm-field">
      <label>
        {label} {opts.required && <span className="req">*</span>}
      </label>
      <input
        type={opts.type ?? "text"}
        value={form[key]}
        placeholder={opts.placeholder}
        onChange={(e) => (opts.onChange ? opts.onChange(e.target.value) : set(key, e.target.value))}
        className={errors[key] ? "error" : ""}
      />
      {errors[key] && <small className="cm-err">{errors[key]}</small>}
    </div>
  );

  // projects of the chosen customer first, every project stays selectable
  const mineProjects = projects.filter((p) => getCustomerId(p) === form.customer);
  const otherProjects = projects.filter((p) => getCustomerId(p) !== form.customer);
  const projectOption = (p: Project) => (
    <option key={p._id} value={p._id}>
      {p.projectCode} - {p.projectName}
    </option>
  );

  return (
    <>
      <div className="cm-overlay" onClick={onClose} />
      <aside className="cm-drawer sb-drawer">
        <div className="cm-drawer-head">
          <div>
            <h3>{bill ? "Edit service bill" : "New service bill"}</h3>
            <p>{bill ? bill.invoiceNumber : "Fill in the invoice details"}</p>
          </div>
          <button className="cm-icon-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <form className="cm-form" onSubmit={handleSubmit}>
          <div className="cm-drawer-body" ref={bodyRef}>
            {/* invoice details */}
            <div className="cm-section">Invoice details</div>
            <div className="cm-grid">
              {input("Invoice number", "invoiceNumber", { required: true })}
              {input("Invoice date", "invoiceDate", {
                type: "date",
                required: true,
                onChange: handleInvoiceDate,
              })}
              {input("Payment due date", "paymentDueDate", { type: "date", required: true })}
              <div className="cm-field">
                <label>Approval status</label>
                <select
                  value={form.approvalStatus}
                  onChange={(e) => set("approvalStatus", e.target.value)}
                >
                  {BILL_STATUSES.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
            {form.approvalStatus !== "Draft" && (
              <div className="sb-warn">
                <Info size={16} />
                Only Draft invoices can be edited. After saving with this status, you will not be
                able to change this invoice.
              </div>
            )}

            {/* references */}
            <div className="cm-section">Reference documents (optional)</div>
            <div className="cm-grid">
              <div className="cm-field">
                <label>Service report</label>
                <select value={form.serviceReport} onChange={(e) => handleReport(e.target.value)}>
                  <option value="">No service report</option>
                  {reports.map((r) => (
                    <option key={r._id} value={r._id}>
                      {r.serviceReportNumber} - {reportCustomerName(r, customers)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="cm-field">
                <label>Delivery challan</label>
                <select value={form.deliveryChallan} onChange={(e) => handleChallan(e.target.value)}>
                  <option value="">No delivery challan</option>
                  {challans.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.challanNumber} - {challanCustomerName(c, customers)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <small className="sb-hint">
              Choosing one fills the customer and project. You can still change them.
            </small>

            {/* customer / project */}
            <div className="cm-section">Customer and project</div>
            <div className="cm-grid">
              <div className="cm-field">
                <label>
                  Customer <span className="req">*</span>
                </label>
                <select
                  value={form.customer}
                  onChange={(e) => set("customer", e.target.value)}
                  className={errors.customer ? "error" : ""}
                >
                  <option value="">Select customer</option>
                  {customers.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.customerCode} - {c.customerLegalName}
                    </option>
                  ))}
                </select>
                {errors.customer && <small className="cm-err">{errors.customer}</small>}
              </div>

              <div className="cm-field">
                <label>
                  Project <span className="req">*</span>
                </label>
                <select
                  value={form.project}
                  onChange={(e) => set("project", e.target.value)}
                  className={errors.project ? "error" : ""}
                >
                  <option value="">Select project</option>
                  {form.customer && mineProjects.length > 0 ? (
                    <>
                      <optgroup label="This customer's projects">
                        {mineProjects.map(projectOption)}
                      </optgroup>
                      {otherProjects.length > 0 && (
                        <optgroup label="Other projects">{otherProjects.map(projectOption)}</optgroup>
                      )}
                    </>
                  ) : (
                    projects.map(projectOption)
                  )}
                </select>
                {errors.project && <small className="cm-err">{errors.project}</small>}
              </div>
            </div>

            {/* service period */}
            <div className="cm-section">Service period</div>
            <div className="cm-grid">
              {input("From date", "fromDate", { type: "date" })}
              {input("To date", "toDate", { type: "date" })}
            </div>

            {/* items */}
            <div className="sb-section-head">
              <div className="cm-section sb-no-margin">Service items ({form.items.length})</div>
              <button type="button" className="cm-btn ghost sb-add" onClick={addItem}>
                <Plus size={16} /> Add item
              </button>
            </div>
            {errors.items && <small className="cm-err">{errors.items}</small>}

            {form.items.map((it, i) => {
              const amount = (Number(it.quantity) || 0) * (Number(it.rate) || 0);
              return (
                <div className="sb-row" key={i}>
                  <div className="sb-row-head">
                    <span>Item {i + 1}</span>
                    <span className="sb-row-amount">{formatMoney(amount)}</span>
                    {form.items.length > 1 && (
                      <button
                        type="button"
                        className="cm-icon-btn danger"
                        title="Remove item"
                        onClick={() => removeItem(i)}
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>

                  <div className="cm-grid">
                    <div className="cm-field cm-span-2">
                      <label>
                        Service description <span className="req">*</span>
                      </label>
                      <input
                        value={it.serviceDescription}
                        placeholder="PLC Programming and Configuration"
                        onChange={(e) => setItem(i, "serviceDescription", e.target.value)}
                        className={errors[`item-${i}-desc`] ? "error" : ""}
                      />
                      {errors[`item-${i}-desc`] && (
                        <small className="cm-err">{errors[`item-${i}-desc`]}</small>
                      )}
                    </div>

                    <div className="cm-field">
                      <label>SAC code</label>
                      <input
                        value={it.sacCode}
                        placeholder="998314"
                        onChange={(e) => setItem(i, "sacCode", e.target.value)}
                      />
                    </div>
                    <div className="cm-field">
                      <label>Unit</label>
                      <select value={it.unit} onChange={(e) => setItem(i, "unit", e.target.value)}>
                        {BILL_UNITS.map((u) => (
                          <option key={u}>{u}</option>
                        ))}
                      </select>
                    </div>

                    <div className="cm-field">
                      <label>
                        Quantity <span className="req">*</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={it.quantity}
                        onChange={(e) => setItem(i, "quantity", e.target.value)}
                        className={errors[`item-${i}-qty`] ? "error" : ""}
                      />
                      {errors[`item-${i}-qty`] && (
                        <small className="cm-err">{errors[`item-${i}-qty`]}</small>
                      )}
                    </div>
                    <div className="cm-field">
                      <label>
                        Rate (INR) <span className="req">*</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={it.rate}
                        placeholder="1500"
                        onChange={(e) => setItem(i, "rate", e.target.value)}
                        className={errors[`item-${i}-rate`] ? "error" : ""}
                      />
                      {errors[`item-${i}-rate`] && (
                        <small className="cm-err">{errors[`item-${i}-rate`]}</small>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* tax and totals */}
            <div className="cm-section">Discount and GST</div>
            <div className="cm-grid">
              {input("Discount (INR)", "discount", { type: "number", placeholder: "0" })}
              {input("GST rate (%)", "gstRate", { type: "number", placeholder: "18" })}
            </div>

            <div className="sb-totals">
              <div className="sb-totals-title">
                Estimated totals <small>final amounts are calculated by the server</small>
              </div>
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
                <span>CGST ({(Number(form.gstRate) || 0) / 2}%)</span>
                <strong>{formatMoney(totals.cgst)}</strong>
              </div>
              <div className="sb-total-row">
                <span>SGST ({(Number(form.gstRate) || 0) / 2}%)</span>
                <strong>{formatMoney(totals.sgst)}</strong>
              </div>
              <div className="sb-total-row grand">
                <span>Grand total</span>
                <strong>{formatMoney(totals.grandTotal)}</strong>
              </div>
            </div>

            {/* notes */}
            <div className="cm-section">Summary and terms</div>
            <div className="cm-field">
              <label>Service description summary</label>
              <textarea
                rows={3}
                value={form.serviceDescriptionSummary}
                placeholder="PLC programming, SCADA integration and commissioning services."
                onChange={(e) => set("serviceDescriptionSummary", e.target.value)}
              />
            </div>
            <div className="cm-field">
              <label>Terms and conditions</label>
              <textarea
                rows={2}
                value={form.termsAndConditions}
                onChange={(e) => set("termsAndConditions", e.target.value)}
              />
            </div>
          </div>

          <div className="cm-drawer-foot">
            {Object.keys(errors).length > 0 && (
              <span className="sb-form-error">
                Please fix {Object.keys(errors).length} highlighted field(s)
              </span>
            )}
            <button type="button" className="cm-btn ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="cm-btn primary" disabled={saving}>
              {saving ? "Saving..." : bill ? "Update invoice" : "Create invoice"}
            </button>
          </div>
        </form>
      </aside>
    </>
  );
}