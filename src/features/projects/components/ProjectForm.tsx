import { useState, type FormEvent } from "react";
import { X } from "lucide-react";
import type { Customer } from "../../customers/customerTypes";
import {
  PROJECT_STATUSES,
  getCustomerId,
  type Project,
  type ProjectPayload,
} from "../projectTypes";
import { toDateInput } from "../../../utils/helpers";

interface Props {
  project: Project | null;
  customers: Customer[];
  nextCode: string;
  saving: boolean;
  onSubmit: (payload: ProjectPayload) => void;
  onClose: () => void;
}

// poValue is kept as text while typing, converted on submit
type FormState = Omit<ProjectPayload, "poValue"> & { poValue: string };

const emptyForm = (code: string): FormState => ({
  projectCode: code,
  projectName: "",
  customer: "",
  projectStatus: "Planning",
  customerPONumber: "",
  poDate: "",
  poValue: "",
  projectStartDate: "",
  projectEndDate: "",
  siteLocation: "",
  projectScopeAndEngineeringNotes: "",
});

const fromProject = (p: Project): FormState => ({
  projectCode: p.projectCode,
  projectName: p.projectName,
  customer: getCustomerId(p),
  projectStatus: p.projectStatus,
  customerPONumber: p.customerPONumber ?? "",
  poDate: toDateInput(p.poDate),
  poValue: p.poValue != null ? String(p.poValue) : "",
  projectStartDate: toDateInput(p.projectStartDate),
  projectEndDate: toDateInput(p.projectEndDate),
  siteLocation: p.siteLocation ?? "",
  projectScopeAndEngineeringNotes: p.projectScopeAndEngineeringNotes ?? "",
});

export default function ProjectForm({
  project,
  customers,
  nextCode,
  saving,
  onSubmit,
  onClose,
}: Props) {
  const [form, setForm] = useState<FormState>(
    project ? fromProject(project) : emptyForm(nextCode)
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (key: keyof FormState, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.projectCode.trim()) e.projectCode = "Project code is required";
    if (!form.projectName.trim()) e.projectName = "Project name is required";
    if (!form.customer) e.customer = "Select a customer";
    if (form.poValue && (isNaN(Number(form.poValue)) || Number(form.poValue) < 0))
      e.poValue = "Enter a valid amount";
    if (
      form.projectStartDate &&
      form.projectEndDate &&
      form.projectEndDate < form.projectStartDate
    )
      e.projectEndDate = "End date cannot be before start date";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (ev: FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    onSubmit({ ...form, poValue: Number(form.poValue) || 0 });
  };

  const input = (
    label: string,
    key: keyof FormState,
    opts: {
      type?: string;
      placeholder?: string;
      disabled?: boolean;
      required?: boolean;
    } = {}
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
      <aside className="cm-drawer">
        <div className="cm-drawer-head">
          <div>
            <h3>{project ? "Edit project" : "Add project"}</h3>
            <p>{project ? project.projectCode : "Fill in the project details"}</p>
          </div>
          <button className="cm-icon-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <form className="cm-form" onSubmit={handleSubmit}>
          <div className="cm-drawer-body">
            <div className="cm-section">Project details</div>
            <div className="cm-grid">
              {input("Project code", "projectCode", { required: true, disabled: !!project })}
              <div className="cm-field">
                <label>Status</label>
                <select
                  value={form.projectStatus}
                  onChange={(e) => set("projectStatus", e.target.value)}
                >
                  {PROJECT_STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div className="cm-span-2">
                {input("Project name", "projectName", {
                  required: true,
                  placeholder: "Industrial Automation System",
                })}
              </div>

              <div className="cm-field cm-span-2">
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
                {customers.length === 0 && (
                  <small className="cm-err">No customers found. Add a customer first.</small>
                )}
              </div>
            </div>

            <div className="cm-section">Purchase order</div>
            <div className="cm-grid">
              <div className="cm-span-2">
                {input("Customer PO number", "customerPONumber", { placeholder: "PO-2026-001" })}
              </div>
              {input("PO date", "poDate", { type: "date" })}
              {input("PO value (INR)", "poValue", { type: "number", placeholder: "1500000" })}
            </div>

            <div className="cm-section">Schedule</div>
            <div className="cm-grid">
              {input("Start date", "projectStartDate", { type: "date" })}
              {input("End date", "projectEndDate", { type: "date" })}
            </div>

            <div className="cm-section">Site and scope</div>
            {input("Site location", "siteLocation", { placeholder: "Coimbatore, Tamil Nadu" })}
            <div className="cm-field">
              <label>Scope and engineering notes</label>
              <textarea
                rows={4}
                value={form.projectScopeAndEngineeringNotes}
                placeholder="PLC, SCADA, control panel integration and IIoT dashboard development."
                onChange={(e) => set("projectScopeAndEngineeringNotes", e.target.value)}
              />
            </div>
          </div>

          <div className="cm-drawer-foot">
            <button type="button" className="cm-btn ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="cm-btn primary" disabled={saving}>
              {saving ? "Saving..." : project ? "Update project" : "Create project"}
            </button>
          </div>
        </form>
      </aside>
    </>
  );
}