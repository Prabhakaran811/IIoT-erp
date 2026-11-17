import { useRef, useState, type FormEvent } from "react";
import { X } from "lucide-react";
import {
  EMPLOYEE_TYPES,
  EMPLOYMENT_STATUSES,
  GENDERS,
  managerId,
  type Employee,
  type EmployeePayload,
} from "../employeeTypes";
import { toDateInput } from "../../../utils/helpers";

interface Props {
  employee: Employee | null;
  employees: Employee[]; // for the reporting manager list
  departments: string[];
  designations: string[];
  nextCode: string;
  saving: boolean;
  onSubmit: (payload: EmployeePayload) => void;
  onClose: () => void;
}

// reportingManager is "" while editing (none), null on submit
type FormState = Omit<EmployeePayload, "reportingManager"> & { reportingManager: string };
type TextKey = keyof FormState;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const emptyForm = (code: string): FormState => ({
  employeeCode: code,
  employeeName: "",
  gender: "Male",
  dateOfBirth: "",
  phoneNumber: "",
  emailAddress: "",
  address: "",
  emergencyContactName: "",
  emergencyContactNumber: "",
  department: "",
  designation: "",
  employeeType: "Permanent",
  joiningDate: new Date().toISOString().slice(0, 10),
  reportingManager: "",
  employmentStatus: "Active",
});

const fromEmployee = (e: Employee): FormState => ({
  employeeCode: e.employeeCode,
  employeeName: e.employeeName,
  gender: e.gender || "Male",
  dateOfBirth: toDateInput(e.dateOfBirth),
  phoneNumber: e.phoneNumber ?? "",
  emailAddress: e.emailAddress ?? "",
  address: e.address ?? "",
  emergencyContactName: e.emergencyContactName ?? "",
  emergencyContactNumber: e.emergencyContactNumber ?? "",
  department: e.department ?? "",
  designation: e.designation ?? "",
  employeeType: e.employeeType || "Permanent",
  joiningDate: toDateInput(e.joiningDate),
  reportingManager: managerId(e),
  employmentStatus: e.employmentStatus || "Active",
});

export default function EmployeeForm({
  employee,
  employees,
  departments,
  designations,
  nextCode,
  saving,
  onSubmit,
  onClose,
}: Props) {
  const [form, setForm] = useState<FormState>(
    employee ? fromEmployee(employee) : emptyForm(nextCode)
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const bodyRef = useRef<HTMLDivElement>(null);

  const set = (key: TextKey, value: string) => setForm((f) => ({ ...f, [key]: value }));
  const setDigits = (key: TextKey, value: string) =>
    set(key, value.replace(/\D/g, "").slice(0, 10));

  // an employee cannot report to themselves
  const managers = employees.filter((e) => e._id !== employee?._id);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.employeeCode.trim()) e.employeeCode = "Employee code is required";
    if (!form.employeeName.trim()) e.employeeName = "Name is required";
    if (!form.joiningDate) e.joiningDate = "Joining date is required";
    if (form.dateOfBirth && form.dateOfBirth > new Date().toISOString().slice(0, 10))
      e.dateOfBirth = "Date of birth cannot be in the future";
    if (form.phoneNumber && !/^\d{10}$/.test(form.phoneNumber))
      e.phoneNumber = "Phone must be 10 digits";
    if (form.emergencyContactNumber && !/^\d{10}$/.test(form.emergencyContactNumber))
      e.emergencyContactNumber = "Phone must be 10 digits";
    if (form.emailAddress && !EMAIL_REGEX.test(form.emailAddress))
      e.emailAddress = "Enter a valid email address";
    if (employee && form.reportingManager === employee._id)
      e.reportingManager = "An employee cannot report to themselves";

    setErrors(e);
    if (Object.keys(e).length > 0) {
      console.log("Employee validation errors:", e);
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
      employeeCode: form.employeeCode.trim(),
      employeeName: form.employeeName.trim(),
      reportingManager: form.reportingManager || null,
    });
  };

  const input = (
    label: string,
    key: TextKey,
    opts: {
      type?: string;
      placeholder?: string;
      required?: boolean;
      disabled?: boolean;
      list?: string;
      digits?: boolean;
    } = {}
  ) => (
    <div className="cm-field">
      <label>
        {label} {opts.required && <span className="req">*</span>}
      </label>
      <input
        type={opts.type ?? "text"}
        value={form[key]}
        list={opts.list}
        disabled={opts.disabled}
        placeholder={opts.placeholder}
        inputMode={opts.digits ? "numeric" : undefined}
        onChange={(e) => (opts.digits ? setDigits(key, e.target.value) : set(key, e.target.value))}
        className={errors[key] ? "error" : ""}
      />
      {errors[key] && <small className="cm-err">{errors[key]}</small>}
    </div>
  );

  const select = (label: string, key: TextKey, options: readonly string[]) => (
    <div className="cm-field">
      <label>{label}</label>
      <select value={form[key]} onChange={(e) => set(key, e.target.value)}>
        {/* keep a stored value that is not in the list */}
        {form[key] && !options.includes(form[key]) && <option>{form[key]}</option>}
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    </div>
  );

  return (
    <>
      <div className="cm-overlay" onClick={onClose} />
      <aside className="cm-drawer em-drawer">
        <div className="cm-drawer-head">
          <div>
            <h3>{employee ? "Edit employee" : "Add employee"}</h3>
            <p>{employee ? employee.employeeCode : "Fill in the employee details"}</p>
          </div>
          <button className="cm-icon-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <form className="cm-form" onSubmit={handleSubmit}>
          <div className="cm-drawer-body" ref={bodyRef}>
            <div className="cm-section">Basic details</div>
            <div className="cm-grid">
              {input("Employee code", "employeeCode", { required: true, disabled: !!employee })}
              {input("Employee name", "employeeName", { required: true, placeholder: "Arun Kumar" })}
              {select("Gender", "gender", GENDERS)}
              {input("Date of birth", "dateOfBirth", { type: "date" })}
            </div>

            <div className="cm-section">Contact</div>
            <div className="cm-grid">
              {input("Phone number", "phoneNumber", { digits: true, placeholder: "9876543210" })}
              {input("Email address", "emailAddress", { type: "email", placeholder: "arun@company.com" })}
            </div>
            <div className="cm-field">
              <label>Address</label>
              <textarea
                rows={2}
                value={form.address}
                onChange={(e) => set("address", e.target.value)}
              />
            </div>

            <div className="cm-section">Emergency contact</div>
            <div className="cm-grid">
              {input("Contact name", "emergencyContactName")}
              {input("Contact number", "emergencyContactNumber", { digits: true })}
            </div>

            <div className="cm-section">Employment</div>
            <div className="cm-grid">
              {input("Department", "department", { list: "em-departments", placeholder: "Engineering" })}
              {input("Designation", "designation", { list: "em-designations", placeholder: "MES Engineer" })}
              {select("Employee type", "employeeType", EMPLOYEE_TYPES)}
              {input("Joining date", "joiningDate", { type: "date", required: true })}

              <div className="cm-field">
                <label>Reporting manager</label>
                <select
                  value={form.reportingManager}
                  onChange={(e) => set("reportingManager", e.target.value)}
                  className={errors.reportingManager ? "error" : ""}
                >
                  <option value="">No manager</option>
                  {managers.map((m) => (
                    <option key={m._id} value={m._id}>
                      {m.employeeCode} - {m.employeeName}
                      {m.designation ? ` (${m.designation})` : ""}
                    </option>
                  ))}
                </select>
                {errors.reportingManager && (
                  <small className="cm-err">{errors.reportingManager}</small>
                )}
              </div>
              {select("Employment status", "employmentStatus", EMPLOYMENT_STATUSES)}
            </div>

            <datalist id="em-departments">
              {departments.map((d) => (
                <option key={d} value={d} />
              ))}
            </datalist>
            <datalist id="em-designations">
              {designations.map((d) => (
                <option key={d} value={d} />
              ))}
            </datalist>
          </div>

          <div className="cm-drawer-foot">
            {Object.keys(errors).length > 0 && (
              <span className="em-form-error">
                Please fix {Object.keys(errors).length} highlighted field(s)
              </span>
            )}
            <button type="button" className="cm-btn ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="cm-btn primary" disabled={saving}>
              {saving ? "Saving..." : employee ? "Update employee" : "Add employee"}
            </button>
          </div>
        </form>
      </aside>
    </>
  );
}