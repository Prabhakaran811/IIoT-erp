import { useState, type FormEvent } from "react";
import { X } from "lucide-react";
import type { Customer, CustomerPayload } from "../customerTypes";

interface Props {
  customer: Customer | null;
  nextCode: string;
  saving: boolean;
  onSubmit: (payload: CustomerPayload) => void;
  onClose: () => void;
}

const GSTIN_REGEX = /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const emptyForm = (code: string): CustomerPayload => ({
  customerCode: code,
  customerLegalName: "",
  gstin: "",
  gstState: "",
  stateCode: "",
  billingAddress: "",
  siteAddress: "",
  contactPerson: "",
  phoneNumber: "",
  emailAddress: "",
  isActive: true,
});

const fromCustomer = (c: Customer): CustomerPayload => ({
  customerCode: c.customerCode,
  customerLegalName: c.customerLegalName,
  gstin: c.gstin ?? "",
  gstState: c.gstState ?? "",
  stateCode: c.stateCode ?? "",
  billingAddress: c.billingAddress ?? "",
  siteAddress: c.siteAddress ?? "",
  contactPerson: c.contactPerson ?? "",
  phoneNumber: c.phoneNumber ?? "",
  emailAddress: c.emailAddress ?? "",
  isActive: c.isActive,
});

export default function CustomerForm({ customer, nextCode, saving, onSubmit, onClose }: Props) {
  const [form, setForm] = useState<CustomerPayload>(
    customer ? fromCustomer(customer) : emptyForm(nextCode)
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (key: keyof CustomerPayload, value: string | boolean) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleGstin = (value: string) => {
    const v = value.toUpperCase().slice(0, 15);
    setForm((f) => ({
      ...f,
      gstin: v,
      stateCode: v.length >= 2 ? v.slice(0, 2) : f.stateCode, // first 2 digits = state code
    }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.customerCode.trim()) e.customerCode = "Customer code is required";
    if (!form.customerLegalName.trim()) e.customerLegalName = "Legal name is required";
    if (form.gstin && !GSTIN_REGEX.test(form.gstin)) e.gstin = "Enter a valid 15-character GSTIN";
    if (form.phoneNumber && !/^\d{10}$/.test(form.phoneNumber))
      e.phoneNumber = "Phone must be 10 digits";
    if (form.emailAddress && !EMAIL_REGEX.test(form.emailAddress))
      e.emailAddress = "Enter a valid email address";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (ev: FormEvent) => {
    ev.preventDefault();
    if (validate()) onSubmit(form);
  };

  const field = (
    label: string,
    key: keyof CustomerPayload,
    opts: { placeholder?: string; disabled?: boolean; required?: boolean } = {}
  ) => (
    <div className="cm-field">
      <label>
        {label} {opts.required && <span className="req">*</span>}
      </label>
      <input
        value={form[key] as string}
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
            <h3>{customer ? "Edit customer" : "Add customer"}</h3>
            <p>{customer ? customer.customerCode : "Fill in the customer details"}</p>
          </div>
          <button className="cm-icon-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <form className="cm-form" onSubmit={handleSubmit}>
          <div className="cm-drawer-body">
            <div className="cm-section">Basic details</div>
            <div className="cm-grid">
              {field("Customer code", "customerCode", { required: true, disabled: !!customer })}
              {field("Legal name", "customerLegalName", {
                required: true,
                placeholder: "ABC Manufacturing Pvt Ltd",
              })}
            </div>

            <div className="cm-section">GST details</div>
            <div className="cm-grid">
              <div className="cm-field cm-span-2">
                <label>GSTIN</label>
                <input
                  value={form.gstin}
                  placeholder="33ABCDE1234F1Z5"
                  onChange={(e) => handleGstin(e.target.value)}
                  className={errors.gstin ? "error" : ""}
                />
                {errors.gstin && <small className="cm-err">{errors.gstin}</small>}
              </div>
              {field("GST state", "gstState", { placeholder: "Tamil Nadu" })}
              {field("State code", "stateCode", { placeholder: "33" })}
            </div>

            <div className="cm-section">Contact</div>
            <div className="cm-grid">
              {field("Contact person", "contactPerson", { placeholder: "Raj Kumar" })}
              {field("Phone number", "phoneNumber", { placeholder: "9876543210" })}
              <div className="cm-span-2">{field("Email address", "emailAddress", { placeholder: "raj@abcmfg.com" })}</div>
            </div>

            <div className="cm-section">Addresses</div>
            <div className="cm-field">
              <label>Billing address</label>
              <textarea
                rows={2}
                value={form.billingAddress}
                onChange={(e) => set("billingAddress", e.target.value)}
              />
            </div>
            <div className="cm-field">
              <label>Site address</label>
              <textarea
                rows={2}
                value={form.siteAddress}
                onChange={(e) => set("siteAddress", e.target.value)}
              />
            </div>

            <label className="cm-switch-row">
              <span>
                <strong>Active customer</strong>
                <small>Inactive customers stay in records but are marked inactive</small>
              </span>
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => set("isActive", e.target.checked)}
              />
              <span className="cm-switch" />
            </label>
          </div>

          <div className="cm-drawer-foot">
            <button type="button" className="cm-btn ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="cm-btn primary" disabled={saving}>
              {saving ? "Saving..." : customer ? "Update customer" : "Create customer"}
            </button>
          </div>
        </form>
      </aside>
    </>
  );
}