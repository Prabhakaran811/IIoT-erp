
import api from "../../services/api";
import type {
  CustomerPayment,
  OutstandingInvoice,
  CreatePaymentRequest,
  UpdatePaymentRequest,
} from "./customerPaymentTypes";

/* eslint-disable @typescript-eslint/no-explicit-any */

// Handle { success, data } and normal responses
const unwrap = <T>(res: any): T => {
  const d = res.data;

  if (
    d !== null &&
    typeof d === "object" &&
    !Array.isArray(d) &&
    "success" in d &&
    "data" in d
  ) {
    return d.data;
  }

  return d as T;
};

export const customerPaymentApi = {
  // Get outstanding invoices
  getOutstandingInvoices: async (): Promise<OutstandingInvoice[]> => {
    const res = await api.get("/customer-payments/outstanding-invoices");
    return unwrap<OutstandingInvoice[]>(res) ?? [];
  },

  // Get all customer payments
  getAll: async (): Promise<CustomerPayment[]> => {
    const res = await api.get("/customer-payments");
    return unwrap<CustomerPayment[]>(res) ?? [];
  },

  // Get payment by ID (if backend supports it)
  getById: async (id: string): Promise<CustomerPayment> => {
    const res = await api.get(`/customer-payments/${id}`);
    return unwrap<CustomerPayment>(res);
  },

  // Create payment
  create: async (
    payload: CreatePaymentRequest
  ): Promise<CustomerPayment> => {
    const res = await api.post("/customer-payments", payload);
    return unwrap<CustomerPayment>(res);
  },

  // Update payment
  update: async (
    id: string,
    payload: UpdatePaymentRequest
  ): Promise<CustomerPayment> => {
    const res = await api.put(`/customer-payments/${id}`, payload);
    return unwrap<CustomerPayment>(res);
  },
};
