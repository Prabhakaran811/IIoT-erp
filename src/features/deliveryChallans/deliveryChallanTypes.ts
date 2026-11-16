import type { CustomerRef } from "../projects/projectTypes";

export const CHALLAN_TYPES = ["Material Out", "Material In"] as const;
export const CHALLAN_STATUSES = ["Draft", "Issued", "Delivered", "Cancelled"] as const;
export const ITEM_UNITS = ["Nos", "Set", "Pcs", "Kg", "Mtr", "Box", "Lot"] as const;

export interface ProjectRef {
  _id: string;
  projectCode?: string;
  projectName?: string;
}

export interface ChallanItem {
  _id?: string;
  itemDescription: string;
  partNumber: string;
  hsnSac: string;
  quantity: number;
  unit: string;
  serialNumberOrTag: string;
  remarks: string;
}

export interface DeliveryChallan {
  _id: string;
  challanNumber: string;
  challanDate: string;
  challanType: string;
  status: string;

  customer: string | CustomerRef;
  customerGSTIN: string;
  customerAddress: string;
  state: string;
  stateCode: string;
  contactPerson: string;
  contactNumber: string;

  project: string | ProjectRef;
  poWorkOrderReference: string;
  poDate: string;

  responsiblePerson: string;
  vehicleNumber: string;
  transporterName: string;
  ewayBillNumber: string;
  deliverySiteLocation: string;
  purposeOfDelivery: string;

  items: ChallanItem[];
  specialInstructions: string;
  termsAndConditions: string;
  createdAt?: string;
  updatedAt?: string;
}

export type DeliveryChallanPayload = Omit<
  DeliveryChallan,
  "_id" | "customer" | "project" | "createdAt" | "updatedAt"
> & {
  customer: string; // Customer _id
  project: string; // Project _id
};

// id from either a plain id string or a populated object
export const refId = (v: string | { _id: string } | null | undefined): string =>
  !v ? "" : typeof v === "object" ? v._id : v;

export const totalQty = (items: ChallanItem[] = []) =>
  items.reduce((sum, i) => sum + (Number(i.quantity) || 0), 0);