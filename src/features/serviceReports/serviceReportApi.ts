import api from "../../services/api";
import type { ServiceReport, ServiceReportPayload } from "./serviceReportTypes";

/* eslint-disable @typescript-eslint/no-explicit-any */
const pickOne = (res: any): ServiceReport =>
  res.data?.data ?? res.data?.report ?? res.data?.serviceReport ?? res.data;

const pickList = (res: any): ServiceReport[] => {
  const d = res.data;
  if (Array.isArray(d)) return d;
  return d?.data ?? d?.reports ?? d?.serviceReports ?? [];
};

export const serviceReportApi = {
  getAll: async (): Promise<ServiceReport[]> =>
    pickList(await api.get("/service-reports")),

  getById: async (id: string): Promise<ServiceReport> =>
    pickOne(await api.get(`/service-reports/${id}`)),

  create: async (payload: ServiceReportPayload): Promise<ServiceReport> => {
    // on create, simply leave the challan out when none is chosen
    const { deliveryChallan, ...rest } = payload;
    const body = deliveryChallan ? payload : rest;
    return pickOne(await api.post("/service-reports", body));
  },

  // sends deliveryChallan: null when the link was removed
  update: async (id: string, payload: Partial<ServiceReportPayload>): Promise<ServiceReport> =>
    pickOne(await api.put(`/service-reports/${id}`, payload)),

  remove: async (id: string): Promise<void> => {
    await api.delete(`/service-reports/${id}`);
  },
};