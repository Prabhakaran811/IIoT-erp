import { useRef, useState, type FormEvent } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import type { Customer } from "../../customers/customerTypes";
import { getCustomerId, type Project } from "../../projects/projectTypes";
import {
  CHALLAN_STATUSES,
  CHALLAN_TYPES,
  ITEM_UNITS,
  refId,
  type ChallanItem,
  type DeliveryChallan,
  type DeliveryChallanPayload,
} from "../deliveryChallanTypes";
import { toDateInput } from "../../../utils/helpers";

interface Props {
  challan: DeliveryChallan | null;
  customers: Customer[];
  projects: Project[];
  nextNumber: string;
  saving: boolean;
  onSubmit: (payload: DeliveryChallanPayload) => void;
  onClose: () => void;
}

// quantity stays text while typing, converted on submit
type ItemForm = Omit<ChallanItem, "_id" | "quantity"> & { quantity: string };
type FormState = Omit<DeliveryChallanPayload, "items"> & { items: ItemForm[] };

const emptyItem = (): ItemForm => ({
  itemDescription: "",
  partNumber: "",
  hsnSac: "",
  quantity: "1",
  unit: "Nos",
  serialNumberOrTag: "",
  remarks: "",
});

const emptyForm = (number: string): FormState => ({
  challanNumber: number,
  challanDate: new Date().toISOString().slice(0, 10),
  challanType: "Material Out",
  status: "Draft",
  customer: "",
  customerGSTIN: "",
  customerAddress: "",
  state: "",
  stateCode: "",
  contactPerson: "",
  contactNumber: "",
  project: "",
  poWorkOrderReference: "",
  poDate: "",
  responsiblePerson: "",
  vehicleNumber: "",
  transporterName: "",
  ewayBillNumber: "",
  deliverySiteLocation: "",
  purposeOfDelivery: "",
  items: [emptyItem()],
  specialInstructions: "",
  termsAndConditions: "",
});

const fromChallan = (c: DeliveryChallan): FormState => ({
  challanNumber: c.challanNumber,
  challanDate: toDateInput(c.challanDate),
  challanType: c.challanType,
  status: c.status,
  customer: refId(c.customer),
  customerGSTIN: c.customerGSTIN ?? "",
  customerAddress: c.customerAddress ?? "",
  state: c.state ?? "",
  stateCode: c.stateCode ?? "",
  contactPerson: c.contactPerson ?? "",
  contactNumber: c.contactNumber ?? "",
  project: refId(c.project),
  poWorkOrderReference: c.poWorkOrderReference ?? "",
  poDate: toDateInput(c.poDate),
  responsiblePerson: c.responsiblePerson ?? "",
  vehicleNumber: c.vehicleNumber ?? "",
  transporterName: c.transporterName ?? "",
  ewayBillNumber: c.ewayBillNumber ?? "",
  deliverySiteLocation: c.deliverySiteLocation ?? "",
  purposeOfDelivery: c.purposeOfDelivery ?? "",
  items: (c.items?.length ? c.items : [emptyItem() as unknown as ChallanItem]).map((i) => ({
    itemDescription: i.itemDescription ?? "",
    partNumber: i.partNumber ?? "",
    hsnSac: i.hsnSac ?? "",
    quantity: String(i.quantity ?? ""),
    unit: i.unit ?? "Nos",
    serialNumberOrTag: i.serialNumberOrTag ?? "",
    remarks: i.remarks ?? "",
  })),
  specialInstructions: c.specialInstructions ?? "",
  termsAndConditions: c.termsAndConditions ?? "",
});

export default function DeliveryChallanForm({
  challan,
  customers,
  projects,
  nextNumber,
  saving,
  onSubmit,
  onClose,
}: Props) {
  const [form, setForm] = useState<FormState>(
    challan ? fromChallan(challan) : emptyForm(nextNumber)
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const bodyRef = useRef<HTMLDivElement>(null);

  type TextKey = Exclude<keyof FormState, "items">;
  const set = (key: TextKey, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const customerProjects = projects.filter((p) => getCustomerId(p) === form.customer);

  /* customer chosen: copy snapshot from Customer Master */
  const handleCustomer = (id: string) => {
    const c = customers.find((x) => x._id === id);
    setForm((f) => ({
      ...f,
      customer: id,
      project: "",
      poWorkOrderReference: "",
      poDate: "",
      customerGSTIN: c?.gstin ?? "",
      customerAddress: c?.billingAddress ?? "",
      state: c?.gstState ?? "",
      stateCode: c?.stateCode ?? "",
      contactPerson: c?.contactPerson ?? "",
      contactNumber: c?.phoneNumber ?? "",
    }));
  };

  /* project chosen: copy PO details + site */
  const handleProject = (id: string) => {
    const p = projects.find((x) => x._id === id);
    setForm((f) => ({
      ...f,
      project: id,
      poWorkOrderReference: p?.customerPONumber ?? "",
      poDate: toDateInput(p?.poDate),
      deliverySiteLocation: f.deliverySiteLocation || p?.siteLocation || "",
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
    if (!form.challanNumber.trim()) e.challanNumber = "Challan number is required";
    if (!form.challanDate) e.challanDate = "Date is required";
    if (!form.customer) e.customer = "Select a customer";
    if (!form.project) e.project = "Select a project";
    if (form.ewayBillNumber && !/^\d{12}$/.test(form.ewayBillNumber))
      e.ewayBillNumber = "E-way bill number must be 12 digits";
    if (form.items.length === 0) e.items = "Add at least one item";
    form.items.forEach((it, i) => {
      if (!it.itemDescription.trim()) e[`item-${i}-desc`] = "Description is required";
      if (!(Number(it.quantity) > 0)) e[`item-${i}-qty`] = "Quantity must be above 0";
    });
    setErrors(e);

    if (Object.keys(e).length > 0) {
      console.log("Challan validation errors:", e);
      // scroll to the first problem so it is visible
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
    onSubmit({
      ...form,
      items: form.items.map((i) => ({ ...i, quantity: Number(i.quantity) })),
    });
  };

  const input = (
    label: string,
    key: TextKey,
    opts: { type?: string; placeholder?: string; disabled?: boolean; required?: boolean } = {}
  ) => (
    <div className="cm-field">
      <label>
        {label} {opts.required && <span className="req">*</span>}
      </label>
      <input
        type={opts.type ?? "text"}
        value={form[key]}
        disabled={opts.disabled}
        placeholder={opts.placeholder}
        onChange={(e) => set(key, e.target.value)}
        className={errors[key] ? "error" : ""}
      />
      {errors[key] && <small className="cm-err">{errors[key]}</small>}
    </div>
  );

  return (
    <>
      <div className="cm-overlay" onClick={onClose} />
      <aside className="cm-drawer dc-drawer">
        <div className="cm-drawer-head">
          <div>
            <h3>{challan ? "Edit delivery challan" : "New delivery challan"}</h3>
            <p>{challan ? challan.challanNumber : "Fill in the challan details"}</p>
          </div>
          <button className="cm-icon-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <form className="cm-form" onSubmit={handleSubmit}>
          <div className="cm-drawer-body" ref={bodyRef}>
            {/* challan details */}
            <div className="cm-section">Challan details</div>
            <div className="cm-grid">
              {input("Challan number", "challanNumber", { required: true })}
              {input("Challan date", "challanDate", { type: "date", required: true })}
              <div className="cm-field">
                <label>Challan type</label>
                <select value={form.challanType} onChange={(e) => set("challanType", e.target.value)}>
                  {CHALLAN_TYPES.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div className="cm-field">
                <label>Status</label>
                <select value={form.status} onChange={(e) => set("status", e.target.value)}>
                  {CHALLAN_STATUSES.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* customer */}
            <div className="cm-section">Customer</div>
            <div className="cm-field">
              <label>
                Customer <span className="req">*</span>
              </label>
              <select
                value={form.customer}
                onChange={(e) => handleCustomer(e.target.value)}
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
            <div className="cm-grid">
              {input("GSTIN", "customerGSTIN")}
              {input("Contact person", "contactPerson")}
              {input("State", "state")}
              {input("State code", "stateCode")}
              <div className="cm-span-2">{input("Contact number", "contactNumber")}</div>
            </div>
            <div className="cm-field">
              <label>Customer address</label>
              <textarea
                rows={2}
                value={form.customerAddress}
                onChange={(e) => set("customerAddress", e.target.value)}
              />
            </div>

            {/* project / PO */}
            <div className="cm-section">Project and PO</div>
            <div className="cm-field">
              <label>
                Project <span className="req">*</span>
              </label>
              <select
                value={form.project}
                disabled={!form.customer}
                onChange={(e) => handleProject(e.target.value)}
                className={errors.project ? "error" : ""}
              >
                <option value="">
                  {form.customer ? "Select project" : "Select a customer first"}
                </option>
                {customerProjects.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.projectCode} - {p.projectName}
                  </option>
                ))}
              </select>
              {errors.project && <small className="cm-err">{errors.project}</small>}
              {form.customer && customerProjects.length === 0 && (
                <small className="cm-err">This customer has no projects yet.</small>
              )}
            </div>
            <div className="cm-grid">
              {input("PO / work order reference", "poWorkOrderReference")}
              {input("PO date", "poDate", { type: "date" })}
            </div>

            {/* transport */}
            <div className="cm-section">Delivery and transport</div>
            <div className="cm-grid">
              {input("Responsible person", "responsiblePerson")}
              {input("Vehicle number", "vehicleNumber", { placeholder: "TN37AB1234" })}
              {input("Transporter name", "transporterName")}
              {input("E-way bill number", "ewayBillNumber", { placeholder: "12 digits" })}
              <div className="cm-span-2">{input("Delivery site location", "deliverySiteLocation")}</div>
              <div className="cm-span-2">{input("Purpose of delivery", "purposeOfDelivery")}</div>
            </div>

            {/* items */}
            <div className="dc-items-head">
              <div className="cm-section dc-no-margin">Items ({form.items.length})</div>
              <button type="button" className="cm-btn ghost dc-add" onClick={addItem}>
                <Plus size={16} /> Add item
              </button>
            </div>
            {errors.items && <small className="cm-err">{errors.items}</small>}

            {form.items.map((it, i) => (
              <div className="dc-item" key={i}>
                <div className="dc-item-head">
                  <span>Item {i + 1}</span>
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
                      Description <span className="req">*</span>
                    </label>
                    <input
                      value={it.itemDescription}
                      placeholder="PLC Control Panel"
                      onChange={(e) => setItem(i, "itemDescription", e.target.value)}
                      className={errors[`item-${i}-desc`] ? "error" : ""}
                    />
                    {errors[`item-${i}-desc`] && (
                      <small className="cm-err">{errors[`item-${i}-desc`]}</small>
                    )}
                  </div>

                  <div className="cm-field">
                    <label>Part number</label>
                    <input value={it.partNumber} onChange={(e) => setItem(i, "partNumber", e.target.value)} />
                  </div>
                  <div className="cm-field">
                    <label>HSN / SAC</label>
                    <input value={it.hsnSac} onChange={(e) => setItem(i, "hsnSac", e.target.value)} />
                  </div>

                  <div className="cm-field">
                    <label>
                      Quantity <span className="req">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={it.quantity}
                      onChange={(e) => setItem(i, "quantity", e.target.value)}
                      className={errors[`item-${i}-qty`] ? "error" : ""}
                    />
                    {errors[`item-${i}-qty`] && (
                      <small className="cm-err">{errors[`item-${i}-qty`]}</small>
                    )}
                  </div>
                  <div className="cm-field">
                    <label>Unit</label>
                    <select value={it.unit} onChange={(e) => setItem(i, "unit", e.target.value)}>
                      {ITEM_UNITS.map((u) => (
                        <option key={u}>{u}</option>
                      ))}
                    </select>
                  </div>

                  <div className="cm-field">
                    <label>Serial no. / tag</label>
                    <input
                      value={it.serialNumberOrTag}
                      onChange={(e) => setItem(i, "serialNumberOrTag", e.target.value)}
                    />
                  </div>
                  <div className="cm-field">
                    <label>Remarks</label>
                    <input value={it.remarks} onChange={(e) => setItem(i, "remarks", e.target.value)} />
                  </div>
                </div>
              </div>
            ))}

            {/* notes */}
            <div className="cm-section">Notes</div>
            <div className="cm-field">
              <label>Special instructions</label>
              <textarea
                rows={2}
                value={form.specialInstructions}
                onChange={(e) => set("specialInstructions", e.target.value)}
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
              <span className="dc-form-error">
                Please fix {Object.keys(errors).length} highlighted field(s)
              </span>
            )}
            <button type="button" className="cm-btn ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="cm-btn primary" disabled={saving}>
              {saving ? "Saving..." : challan ? "Update challan" : "Create challan"}
            </button>
          </div>
        </form>
      </aside>
    </>
  );
}