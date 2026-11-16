import api from "../../services/api";
import type { ServiceBill, ServiceBillPayload } from "./serviceBillTypes";

/* eslint-disable @typescript-eslint/no-explicit-any */
const pickOne = (res: any): ServiceBill =>
  res.data?.data ?? res.data?.bill ?? res.data?.serviceBill ?? res.data;

const pickList = (res: any): ServiceBill[] => {
  const d = res.data;
  if (Array.isArray(d)) return d;
  return d?.data ?? d?.bills ?? d?.serviceBills ?? [];
};

export const serviceBillApi = {
  getAll: async (): Promise<ServiceBill[]> => pickList(await api.get("/service-bills")),

  getById: async (id: string): Promise<ServiceBill> =>
    pickOne(await api.get(`/service-bills/${id}`)),

  create: async (payload: ServiceBillPayload): Promise<ServiceBill> => {
    // leave empty references out on create
    const body: Partial<ServiceBillPayload> = { ...payload };
    if (!body.deliveryChallan) delete body.deliveryChallan;
    if (!body.serviceReport) delete body.serviceReport;
    return pickOne(await api.post("/service-bills", body));
  },

  // null clears a reference
  update: async (id: string, payload: Partial<ServiceBillPayload>): Promise<ServiceBill> =>
    pickOne(await api.put(`/service-bills/${id}`, payload)),

  remove: async (id: string): Promise<void> => {
    await api.delete(`/service-bills/${id}`);
  },
};