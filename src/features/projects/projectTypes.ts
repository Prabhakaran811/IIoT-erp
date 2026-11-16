import type { Customer } from "../customers/customerTypes";

export const PROJECT_STATUSES = [
  "Planning",
  "In Progress",
  "On Hold",
  "Completed",
  "Cancelled",
] as const;

// backend may return the customer as an id string OR a populated object
export type CustomerRef = Pick<Customer, "_id"> &
  Partial<Pick<Customer, "customerCode" | "customerLegalName">>;

export interface Project {
  _id: string;
  projectCode: string;
  projectName: string;
  customer: string | CustomerRef;
  projectStatus: string;
  customerPONumber: string;
  poDate: string;
  poValue: number;
  projectStartDate: string;
  projectEndDate: string;
  siteLocation: string;
  projectScopeAndEngineeringNotes: string;
  createdAt?: string;
  updatedAt?: string;
}

export type ProjectPayload = Omit<Project, "_id" | "customer" | "createdAt" | "updatedAt"> & {
  customer: string; // Customer _id
};

export const getCustomerId = (p: Project): string =>
  typeof p.customer === "object" && p.customer ? p.customer._id : (p.customer as string);

// works whether customer came populated or as a plain id
export const resolveCustomer = (p: Project, customers: Customer[]): CustomerRef | undefined => {
  if (typeof p.customer === "object" && p.customer && p.customer.customerLegalName) {
    return p.customer;
  }
  return customers.find((c) => c._id === getCustomerId(p));
};