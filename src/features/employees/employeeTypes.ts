export const GENDERS = ["Male", "Female", "Other"] as const;
export const EMPLOYEE_TYPES = ["Permanent", "Contract", "Probation", "Intern", "Consultant"] as const;
export const EMPLOYMENT_STATUSES = ["Active", "Inactive", "On Leave", "Resigned"] as const;

// suggestions only: any department can be typed
export const DEFAULT_DEPARTMENTS = [
  "Engineering",
  "Sales",
  "Service",
  "Operations",
  "Purchase",
  "Accounts",
  "HR",
];

export interface ManagerRef {
  _id: string;
  employeeCode?: string;
  employeeName?: string;
}

export interface Employee {
  _id: string;
  employeeCode: string;
  employeeName: string;
  gender: string;
  dateOfBirth: string;
  phoneNumber: string;
  emailAddress: string;
  address: string;
  emergencyContactName: string;
  emergencyContactNumber: string;
  department: string;
  designation: string;
  employeeType: string;
  joiningDate: string;
  reportingManager?: string | ManagerRef | null;
  employmentStatus: string;
  createdAt?: string;
  updatedAt?: string;
}

export type EmployeePayload = Omit<
  Employee,
  "_id" | "reportingManager" | "createdAt" | "updatedAt"
> & {
  reportingManager: string | null; // null = no manager
};

// manager id from either a plain id or a populated object
export const managerId = (e: Employee): string => {
  const m = e.reportingManager;
  return !m ? "" : typeof m === "object" ? m._id : m;
};

export const initials = (name: string) =>
  (name || "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");

export const ageFrom = (dob?: string): string => {
  if (!dob) return "";
  const d = new Date(dob);
  if (isNaN(d.getTime())) return "";
  const n = new Date();
  let years = n.getFullYear() - d.getFullYear();
  if (n.getMonth() < d.getMonth() || (n.getMonth() === d.getMonth() && n.getDate() < d.getDate()))
    years--;
  return years >= 0 ? `${years} years` : "";
};

export const tenureFrom = (joining?: string): string => {
  if (!joining) return "-";
  const j = new Date(joining);
  const n = new Date();
  if (isNaN(j.getTime())) return "-";
  if (j > n) return "Not joined yet";
  let months = (n.getFullYear() - j.getFullYear()) * 12 + (n.getMonth() - j.getMonth());
  if (n.getDate() < j.getDate()) months--;
  if (months < 1) return "Less than a month";
  const y = Math.floor(months / 12);
  const m = months % 12;
  return [y ? `${y} yr${y > 1 ? "s" : ""}` : "", m ? `${m} mo` : ""].filter(Boolean).join(" ");
};