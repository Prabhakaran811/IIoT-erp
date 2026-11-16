import type { CustomerRef } from "../projects/projectTypes";
import type { ProjectRef } from "../deliveryChallans/deliveryChallanTypes";
import type { ChallanRef } from "../serviceReports/serviceReportTypes";

export const BILL_STATUSES = ["Draft", "Approved", "Cancelled"] as const;
export const BILL_UNITS = ["Hours", "Days", "Visits", "Nos", "Lot", "Set"] as const;

export interface ReportRef {
  _id: string;
  serviceReportNumber?: string;
}

// what we send for each item (no calculated amount)
export interface BillItemPayload {
  serviceDescription: string;
  sacCode: string;
  quantity: number;
  unit: string;
  rate: number;
}

// what the server returns for each item
export interface BillItem extends BillItemPayload {
  _id?: string;
  amount?: number;
}

export interface ServiceBill {
  _id: string;
  invoiceNumber: string;
  invoiceDate: string;
  paymentDueDate: string;
  approvalStatus: string;

  deliveryChallan?: string | ChallanRef | null;
  serviceReport?: string | ReportRef | null;
  servicePeriod?: { fromDate?: string; toDate?: string };

  customer: string | CustomerRef;
  project: string | ProjectRef;

  items: BillItem[];
  serviceDescriptionSummary: string;
  termsAndConditions: string;
  discount: number;
  gstRate: number;

  // calculated by the backend (key names may differ, see billTotals)
  subtotal?: number;
  subTotal?: number;
  taxableValue?: number;
  cgst?: number;
  cgstAmount?: number;
  sgst?: number;
  sgstAmount?: number;
  grandTotal?: number;
  totalAmount?: number;

  createdAt?: string;
  updatedAt?: string;
}

// payload has NO totals on purpose: the backend calculates them
export interface ServiceBillPayload {
  invoiceNumber: string;
  invoiceDate: string;
  paymentDueDate: string;
  approvalStatus: string;
  deliveryChallan: string | null;
  serviceReport: string | null;
  servicePeriod: { fromDate: string; toDate: string };
  customer: string;
  project: string;
  items: BillItemPayload[];
  serviceDescriptionSummary: string;
  termsAndConditions: string;
  discount: number;
  gstRate: number;
}

// the backend only allows editing Draft invoices
export const isEditable = (status: string) => status === "Draft";

/* ---------- totals ---------- */
export interface Totals {
  subtotal: number;
  discount: number;
  taxableValue: number;
  cgst: number;
  sgst: number;
  grandTotal: number;
}

const r2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

// estimate (used for the live preview and as a fallback)
export const computeTotals = (
  items: { quantity: number | string; rate: number | string }[] = [],
  discount: number | string = 0,
  gstRate: number | string = 0
): Totals => {
  const subtotal = r2(
    items.reduce((s, i) => s + (Number(i.quantity) || 0) * (Number(i.rate) || 0), 0)
  );
  const disc = Number(discount) || 0;
  const taxableValue = r2(Math.max(subtotal - disc, 0));
  const halfRate = (Number(gstRate) || 0) / 2;
  const cgst = r2((taxableValue * halfRate) / 100);
  const sgst = cgst;
  return { subtotal, discount: disc, taxableValue, cgst, sgst, grandTotal: r2(taxableValue + cgst + sgst) };
};

const firstNum = (...vals: unknown[]): number | undefined => {
  for (const v of vals) if (typeof v === "number" && !isNaN(v)) return v;
  return undefined;
};

// prefer the server's calculated values, fall back to the estimate
export const billTotals = (b: ServiceBill): Totals => {
  const calc = computeTotals(b.items, b.discount, b.gstRate);
  return {
    subtotal: firstNum(b.subtotal, b.subTotal) ?? calc.subtotal,
    discount: b.discount ?? 0,
    taxableValue: firstNum(b.taxableValue) ?? calc.taxableValue,
    cgst: firstNum(b.cgst, b.cgstAmount) ?? calc.cgst,
    sgst: firstNum(b.sgst, b.sgstAmount) ?? calc.sgst,
    grandTotal: firstNum(b.grandTotal, b.totalAmount) ?? calc.grandTotal,
  };
};