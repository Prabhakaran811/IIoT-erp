import api from "../../services/api";
import type { Customer, CustomerPayload } from "./customerTypes";

/* eslint-disable @typescript-eslint/no-explicit-any */
const pickOne = (res: any): Customer => res.data?.data ?? res.data?.customer ?? res.data;

const pickList = (res: any): Customer[] => {
  const d = res.data;
  if (Array.isArray(d)) return d;
  return d?.data ?? d?.customers ?? [];
};

export const customerApi = {
  getAll: async (): Promise<Customer[]> => pickList(await api.get("/customers")),

  getById: async (id: string): Promise<Customer> =>
    pickOne(await api.get(`/customers/${id}`)),

  create: async (payload: CustomerPayload): Promise<Customer> =>
    pickOne(await api.post("/customers", payload)),

  update: async (id: string, payload: Partial<CustomerPayload>): Promise<Customer> =>
    pickOne(await api.put(`/customers/${id}`, payload)),

  remove: async (id: string): Promise<void> => {
    await api.delete(`/customers/${id}`);
  },
};