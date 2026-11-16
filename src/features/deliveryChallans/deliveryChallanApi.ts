import api from "../../services/api";
import type { DeliveryChallan, DeliveryChallanPayload } from "./deliveryChallanTypes";

/* eslint-disable @typescript-eslint/no-explicit-any */
const pickOne = (res: any): DeliveryChallan =>
  res.data?.data ?? res.data?.challan ?? res.data?.deliveryChallan ?? res.data;

const pickList = (res: any): DeliveryChallan[] => {
  const d = res.data;
  if (Array.isArray(d)) return d;
  return d?.data ?? d?.challans ?? d?.deliveryChallans ?? [];
};

export const deliveryChallanApi = {
  getAll: async (): Promise<DeliveryChallan[]> =>
    pickList(await api.get("/delivery-challans")),

  getById: async (id: string): Promise<DeliveryChallan> =>
    pickOne(await api.get(`/delivery-challans/${id}`)),

  create: async (payload: DeliveryChallanPayload): Promise<DeliveryChallan> =>
    pickOne(await api.post("/delivery-challans", payload)),

  update: async (
    id: string,
    payload: Partial<DeliveryChallanPayload>
  ): Promise<DeliveryChallan> => pickOne(await api.put(`/delivery-challans/${id}`, payload)),

  remove: async (id: string): Promise<void> => {
    await api.delete(`/delivery-challans/${id}`);
  },
};