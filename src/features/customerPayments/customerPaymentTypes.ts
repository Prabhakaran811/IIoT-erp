export const PAYMENT_MODES = [
  "Cash",
  "Bank Transfer",
  "UPI",
  "Cheque",
  "Card",
  "Other",
] as const;

export type PaymentMode = (typeof PAYMENT_MODES)[number];

// { success, count?, data }
export interface Wrapped<T> {
  success: boolean;
  message?: string;
  count?: number;
  data: T;
}

export interface OutstandingInvoice {
  _id: string;
  invoiceNumber: string;
  grandTotal: number;
  paidAmount: number;
  outstandingAmount: number;
}

// The list endpoint may return the service bill as an id or as a populated object
export interface PaymentServiceBill {
  _id: string;
  invoiceNumber?: string;
}

export interface CustomerPayment {
  _id: string;
  receiptNumber: string;
  receiptDate: string;
  serviceBill: string | PaymentServiceBill | null;
  paymentAmount: number;
  paymentMode: PaymentMode | string;
  transactionReference?: string;
  depositedBank?: string;
  receiptRemarks?: string;
  createdAt?: string;
}

export interface CreatePaymentRequest {
  receiptNumber: string;
  receiptDate: string;
  serviceBill: string;
  paymentAmount: number;
  paymentMode: PaymentMode;
  transactionReference?: string;
  depositedBank?: string;
  receiptRemarks?: string;
}

export interface UpdatePaymentRequest {
  paymentAmount?: number;
  paymentMode?: PaymentMode;
  transactionReference?: string;
  depositedBank?: string;
  receiptRemarks?: string;
}

// ---------- helpers ----------
export const formatMoney = (n: number) =>
  Number(n || 0).toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  });

export const formatDate = (value?: string | null): string => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

export const invoiceLabel = (bill: CustomerPayment["serviceBill"]): string => {
  if (!bill) return "-";
  if (typeof bill === "string") return bill;
  return bill.invoiceNumber ?? bill._id;
};

export const modeSlug = (mode: string) => mode.toLowerCase().replace(/\s+/g, "-");