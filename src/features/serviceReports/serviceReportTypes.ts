import type { CustomerRef } from "../projects/projectTypes";
import type { ProjectRef } from "../deliveryChallans/deliveryChallanTypes";

export const REPORT_STATUSES = ["Draft", "In Progress", "Completed", "Cancelled"] as const;
export const EDITABLE_STATUSES: string[] = ["Draft", "In Progress"];
export const MATERIAL_UNITS = ["Nos", "Meters", "Set", "Pcs", "Kg", "Box", "Lot", "Ltr"] as const;

export interface ChallanRef {
  _id: string;
  challanNumber?: string;
}

export interface EquipmentDetail {
  _id?: string;
  equipmentName: string;
  make: string;
  model: string;
  serialNumberOrTag: string;
  remarks: string;
}

export interface Solution {
  _id?: string;
  solutionDescription: string;
  remarks: string;
}

export interface MaterialUsed {
  _id?: string;
  materialDescription: string;
  partNumber: string;
  quantity: number;
  unit: string;
  remarks: string;
}

export interface ServiceReport {
  _id: string;
  serviceReportNumber: string;
  serviceDate: string;
  deliveryChallan?: string | ChallanRef | null;
  status: string;

  customer: string | CustomerRef;
  project: string | ProjectRef;

  serviceEngineer: string;
  siteLocation: string;
  startTime: string;
  endTime: string;

  equipmentDetails: EquipmentDetail[];
  problemDescription: string;
  solutions: Solution[];
  materialsUsed: MaterialUsed[];

  customerFeedback: string;
  customerRepresentativeName: string;
  createdAt?: string;
  updatedAt?: string;
}

export type ServiceReportPayload = Omit<
  ServiceReport,
  "_id" | "customer" | "project" | "deliveryChallan" | "createdAt" | "updatedAt"
> & {
  customer: string;
  project: string;
  deliveryChallan: string | null; // null removes the challan link
};

// the backend allows updates only in these statuses
export const isEditable = (status: string) => EDITABLE_STATUSES.includes(status);

// "09:00" + "17:30" -> "8h 30m"
export const duration = (start?: string, end?: string): string => {
  if (!start || !end) return "-";
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const mins = eh * 60 + em - (sh * 60 + sm);
  if (isNaN(mins) || mins <= 0) return "-";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h${m ? ` ${m}m` : ""}`;
};