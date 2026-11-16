import { useRef, useState, type FormEvent } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import type { Customer } from "../../customers/customerTypes";
import { getCustomerId, type Project } from "../../projects/projectTypes";
import { refId, type DeliveryChallan } from "../../deliveryChallans/deliveryChallanTypes";
import { customerNameOf } from "../../deliveryChallans/components/DeliveryChallanTable";
import {
  MATERIAL_UNITS,
  REPORT_STATUSES,
  type EquipmentDetail,
  type MaterialUsed,
  type ServiceReport,
  type ServiceReportPayload,
  type Solution,
} from "../serviceReportTypes";
import { toDateInput } from "../../../utils/helpers";

interface Props {
  report: ServiceReport | null;
  customers: Customer[];
  projects: Project[];
  challans: DeliveryChallan[];
  nextNumber: string;
  saving: boolean;
  onSubmit: (payload: ServiceReportPayload) => void;
  onClose: () => void;
}

type EquipmentForm = Omit<EquipmentDetail, "_id">;
type SolutionForm = Omit<Solution, "_id">;
type MaterialForm = Omit<MaterialUsed, "_id" | "quantity"> & { quantity: string };

type FormState = Omit<
  ServiceReportPayload,
  "deliveryChallan" | "equipmentDetails" | "solutions" | "materialsUsed"
> & {
  deliveryChallan: string; // "" = none
  equipmentDetails: EquipmentForm[];
  solutions: SolutionForm[];
  materialsUsed: MaterialForm[];
};

type ListKey = "equipmentDetails" | "solutions" | "materialsUsed";
type TextKey = Exclude<keyof FormState, ListKey>;

const emptyEquipment = (): EquipmentForm => ({
  equipmentName: "", make: "", model: "", serialNumberOrTag: "", remarks: "",
});
const emptySolution = (): SolutionForm => ({ solutionDescription: "", remarks: "" });
const emptyMaterial = (): MaterialForm => ({
  materialDescription: "", partNumber: "", quantity: "1", unit: "Nos", remarks: "",
});
const NEW_ROW: Record<ListKey, () => unknown> = {
  equipmentDetails: emptyEquipment,
  solutions: emptySolution,
  materialsUsed: emptyMaterial,
};

const emptyForm = (number: string): FormState => ({
  serviceReportNumber: number,
  serviceDate: new Date().toISOString().slice(0, 10),
  deliveryChallan: "",
  status: "Draft",
  customer: "",
  project: "",
  serviceEngineer: "",
  siteLocation: "",
  startTime: "",
  endTime: "",
  equipmentDetails: [emptyEquipment()],
  problemDescription: "",
  solutions: [emptySolution()],
  materialsUsed: [emptyMaterial()],
  customerFeedback: "",
  customerRepresentativeName: "",
});

const fromReport = (r: ServiceReport): FormState => ({
  serviceReportNumber: r.serviceReportNumber,
  serviceDate: toDateInput(r.serviceDate),
  deliveryChallan: refId(r.deliveryChallan),
  status: r.status,
  customer: refId(r.customer),
  project: refId(r.project),
  serviceEngineer: r.serviceEngineer ?? "",
  siteLocation: r.siteLocation ?? "",
  startTime: r.startTime ?? "",
  endTime: r.endTime ?? "",
  equipmentDetails: r.equipmentDetails?.length
    ? r.equipmentDetails.map((e) => ({
        equipmentName: e.equipmentName ?? "",
        make: e.make ?? "",
        model: e.model ?? "",
        serialNumberOrTag: e.serialNumberOrTag ?? "",
        remarks: e.remarks ?? "",
      }))
    : [emptyEquipment()],
  problemDescription: r.problemDescription ?? "",
  solutions: r.solutions?.length
    ? r.solutions.map((s) => ({
        solutionDescription: s.solutionDescription ?? "",
        remarks: s.remarks ?? "",
      }))
    : [emptySolution()],
  materialsUsed: r.materialsUsed?.length
    ? r.materialsUsed.map((m) => ({
        materialDescription: m.materialDescription ?? "",
        partNumber: m.partNumber ?? "",
        quantity: String(m.quantity ?? ""),
        unit: m.unit ?? "Nos",
        remarks: m.remarks ?? "",
      }))
    : [emptyMaterial()],
  customerFeedback: r.customerFeedback ?? "",
  customerRepresentativeName: r.customerRepresentativeName ?? "",
});

// rows the user never filled are dropped on save
const blankEquipment = (e: EquipmentForm) => Object.values(e).every((v) => !v.trim());
const blankSolution = (s: SolutionForm) => Object.values(s).every((v) => !v.trim());
const blankMaterial = (m: MaterialForm) =>
  !m.materialDescription.trim() && !m.partNumber.trim() && !m.remarks.trim();

export default function ServiceReportForm({
  report,
  customers,
  projects,
  challans,
  nextNumber,
  saving,
  onSubmit,
  onClose,
}: Props) {
  const [form, setForm] = useState<FormState>(
    report ? fromReport(report) : emptyForm(nextNumber)
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const bodyRef = useRef<HTMLDivElement>(null);

  const set = (key: TextKey, value: string) => setForm((f) => ({ ...f, [key]: value }));

  /* challan chosen: prefill customer, project, site (still editable afterwards) */
  const handleChallan = (id: string) => {
    const c = challans.find((x) => x._id === id);
    setForm((f) => ({
      ...f,
      deliveryChallan: id,
      customer: (c && refId(c.customer)) || f.customer,
      project: (c && refId(c.project)) || f.project,
      siteLocation: c?.deliverySiteLocation || f.siteLocation,
    }));
  };

  /* repeating rows */
  const updateRow = (key: ListKey, index: number, field: string, value: string) =>
    setForm((f) => ({
      ...f,
      [key]: (f[key] as unknown as Record<string, string>[]).map((r, i) =>
        i === index ? { ...r, [field]: value } : r
      ),
    }));
  const addRow = (key: ListKey) =>
    setForm((f) => ({ ...f, [key]: [...(f[key] as unknown[]), NEW_ROW[key]()] }));
  const removeRow = (key: ListKey, index: number) =>
    setForm((f) => ({ ...f, [key]: (f[key] as unknown[]).filter((_, i) => i !== index) }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.serviceReportNumber.trim()) e.serviceReportNumber = "Report number is required";
    if (!form.serviceDate) e.serviceDate = "Date is required";
    if (!form.customer) e.customer = "Select a customer";
    if (!form.project) e.project = "Select a project";
    if (form.startTime && form.endTime && form.endTime <= form.startTime)
      e.endTime = "End time must be after start time";

    form.equipmentDetails.forEach((r, i) => {
      if (!blankEquipment(r) && !r.equipmentName.trim())
        e[`eq-${i}`] = "Equipment name is required";
    });
    form.solutions.forEach((r, i) => {
      if (!blankSolution(r) && !r.solutionDescription.trim())
        e[`sol-${i}`] = "Solution description is required";
    });
    form.materialsUsed.forEach((r, i) => {
      if (blankMaterial(r)) return;
      if (!r.materialDescription.trim()) e[`mat-${i}-desc`] = "Description is required";
      if (!(Number(r.quantity) > 0)) e[`mat-${i}-qty`] = "Quantity must be above 0";
    });

    setErrors(e);
    if (Object.keys(e).length > 0) {
      console.log("Service report validation errors:", e);
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
      deliveryChallan: form.deliveryChallan || null,
      equipmentDetails: form.equipmentDetails.filter((r) => !blankEquipment(r)),
      solutions: form.solutions.filter((r) => !blankSolution(r)),
      materialsUsed: form.materialsUsed
        .filter((r) => !blankMaterial(r))
        .map((r) => ({ ...r, quantity: Number(r.quantity) })),
    });
  };

  const input = (
    label: string,
    key: TextKey,
    opts: { type?: string; placeholder?: string; required?: boolean } = {}
  ) => (
    <div className="cm-field">
      <label>
        {label} {opts.required && <span className="req">*</span>}
      </label>
      <input
        type={opts.type ?? "text"}
        value={form[key]}
        placeholder={opts.placeholder}
        onChange={(e) => set(key, e.target.value)}
        className={errors[key] ? "error" : ""}
      />
      {errors[key] && <small className="cm-err">{errors[key]}</small>}
    </div>
  );

  const rowHead = (title: string, key: ListKey, index: number, count: number) => (
    <div className="sr-row-head">
      <span>
        {title} {index + 1}
      </span>
      {count > 1 && (
        <button
          type="button"
          className="cm-icon-btn danger"
          title="Remove"
          onClick={() => removeRow(key, index)}
        >
          <Trash2 size={15} />
        </button>
      )}
    </div>
  );

  const sectionHead = (title: string, count: number, key: ListKey) => (
    <div className="sr-section-head">
      <div className="cm-section sr-no-margin">
        {title} ({count})
      </div>
      <button type="button" className="cm-btn ghost sr-add" onClick={() => addRow(key)}>
        <Plus size={16} /> Add
      </button>
    </div>
  );

  // projects of the chosen customer first, but every project stays selectable
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
      <aside className="cm-drawer sr-drawer">
        <div className="cm-drawer-head">
          <div>
            <h3>{report ? "Edit service report" : "New service report"}</h3>
            <p>{report ? report.serviceReportNumber : "Fill in the service details"}</p>
          </div>
          <button className="cm-icon-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <form className="cm-form" onSubmit={handleSubmit}>
          <div className="cm-drawer-body" ref={bodyRef}>
            {/* report details */}
            <div className="cm-section">Report details</div>
            <div className="cm-grid">
              {input("Report number", "serviceReportNumber", { required: true })}
              {input("Service date", "serviceDate", { type: "date", required: true })}

              <div className="cm-field cm-span-2">
                <label>Delivery challan (optional)</label>
                <select value={form.deliveryChallan} onChange={(e) => handleChallan(e.target.value)}>
                  <option value="">No delivery challan</option>
                  {challans.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.challanNumber} - {customerNameOf(c, customers)}
                    </option>
                  ))}
                </select>
                <small className="sr-hint">
                  Choosing a challan fills customer, project and site. You can still change them.
                </small>
              </div>

              <div className="cm-field cm-span-2">
                <label>Status</label>
                <select value={form.status} onChange={(e) => set("status", e.target.value)}>
                  {REPORT_STATUSES.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

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

            {/* visit */}
            <div className="cm-section">Visit details</div>
            <div className="cm-grid">
              {input("Service engineer", "serviceEngineer", { placeholder: "Arun Kumar" })}
              {input("Site location", "siteLocation")}
              {input("Start time", "startTime", { type: "time" })}
              {input("End time", "endTime", { type: "time" })}
            </div>

            {/* equipment */}
            {sectionHead("Equipment details", form.equipmentDetails.length, "equipmentDetails")}
            {form.equipmentDetails.map((r, i) => (
              <div className="sr-row" key={i}>
                {rowHead("Equipment", "equipmentDetails", i, form.equipmentDetails.length)}
                <div className="cm-grid">
                  <div className="cm-field cm-span-2">
                    <label>Equipment name</label>
                    <input
                      value={r.equipmentName}
                      placeholder="PLC Control Panel"
                      onChange={(e) => updateRow("equipmentDetails", i, "equipmentName", e.target.value)}
                      className={errors[`eq-${i}`] ? "error" : ""}
                    />
                    {errors[`eq-${i}`] && <small className="cm-err">{errors[`eq-${i}`]}</small>}
                  </div>
                  <div className="cm-field">
                    <label>Make</label>
                    <input value={r.make} onChange={(e) => updateRow("equipmentDetails", i, "make", e.target.value)} />
                  </div>
                  <div className="cm-field">
                    <label>Model</label>
                    <input value={r.model} onChange={(e) => updateRow("equipmentDetails", i, "model", e.target.value)} />
                  </div>
                  <div className="cm-field">
                    <label>Serial no. / tag</label>
                    <input
                      value={r.serialNumberOrTag}
                      onChange={(e) => updateRow("equipmentDetails", i, "serialNumberOrTag", e.target.value)}
                    />
                  </div>
                  <div className="cm-field">
                    <label>Remarks</label>
                    <input value={r.remarks} onChange={(e) => updateRow("equipmentDetails", i, "remarks", e.target.value)} />
                  </div>
                </div>
              </div>
            ))}

            {/* problem */}
            <div className="cm-section">Problem description</div>
            <div className="cm-field">
              <textarea
                rows={3}
                value={form.problemDescription}
                placeholder="What was the issue reported at site?"
                onChange={(e) => set("problemDescription", e.target.value)}
              />
            </div>

            {/* solutions */}
            {sectionHead("Solutions", form.solutions.length, "solutions")}
            {form.solutions.map((r, i) => (
              <div className="sr-row" key={i}>
                {rowHead("Solution", "solutions", i, form.solutions.length)}
                <div className="cm-field">
                  <label>Solution description</label>
                  <textarea
                    rows={2}
                    value={r.solutionDescription}
                    onChange={(e) => updateRow("solutions", i, "solutionDescription", e.target.value)}
                    className={errors[`sol-${i}`] ? "error" : ""}
                  />
                  {errors[`sol-${i}`] && <small className="cm-err">{errors[`sol-${i}`]}</small>}
                </div>
                <div className="cm-field">
                  <label>Remarks</label>
                  <input value={r.remarks} onChange={(e) => updateRow("solutions", i, "remarks", e.target.value)} />
                </div>
              </div>
            ))}

            {/* materials */}
            {sectionHead("Materials used", form.materialsUsed.length, "materialsUsed")}
            {form.materialsUsed.map((r, i) => (
              <div className="sr-row" key={i}>
                {rowHead("Material", "materialsUsed", i, form.materialsUsed.length)}
                <div className="cm-grid">
                  <div className="cm-field cm-span-2">
                    <label>Material description</label>
                    <input
                      value={r.materialDescription}
                      placeholder="Ethernet Cable"
                      onChange={(e) => updateRow("materialsUsed", i, "materialDescription", e.target.value)}
                      className={errors[`mat-${i}-desc`] ? "error" : ""}
                    />
                    {errors[`mat-${i}-desc`] && <small className="cm-err">{errors[`mat-${i}-desc`]}</small>}
                  </div>
                  <div className="cm-field">
                    <label>Part number</label>
                    <input value={r.partNumber} onChange={(e) => updateRow("materialsUsed", i, "partNumber", e.target.value)} />
                  </div>
                  <div className="cm-field">
                    <label>Remarks</label>
                    <input value={r.remarks} onChange={(e) => updateRow("materialsUsed", i, "remarks", e.target.value)} />
                  </div>
                  <div className="cm-field">
                    <label>Quantity</label>
                    <input
                      type="number"
                      min="0"
                      value={r.quantity}
                      onChange={(e) => updateRow("materialsUsed", i, "quantity", e.target.value)}
                      className={errors[`mat-${i}-qty`] ? "error" : ""}
                    />
                    {errors[`mat-${i}-qty`] && <small className="cm-err">{errors[`mat-${i}-qty`]}</small>}
                  </div>
                  <div className="cm-field">
                    <label>Unit</label>
                    <select value={r.unit} onChange={(e) => updateRow("materialsUsed", i, "unit", e.target.value)}>
                      {MATERIAL_UNITS.map((u) => (
                        <option key={u}>{u}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            ))}

            {/* feedback */}
            <div className="cm-section">Customer feedback</div>
            <div className="cm-field">
              <label>Feedback</label>
              <textarea
                rows={2}
                value={form.customerFeedback}
                onChange={(e) => set("customerFeedback", e.target.value)}
              />
            </div>
            {input("Customer representative name", "customerRepresentativeName", {
              placeholder: "Raj Kumar",
            })}
          </div>

          <div className="cm-drawer-foot">
            {Object.keys(errors).length > 0 && (
              <span className="sr-form-error">
                Please fix {Object.keys(errors).length} highlighted field(s)
              </span>
            )}
            <button type="button" className="cm-btn ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="cm-btn primary" disabled={saving}>
              {saving ? "Saving..." : report ? "Update report" : "Create report"}
            </button>
          </div>
        </form>
      </aside>
    </>
  );
}