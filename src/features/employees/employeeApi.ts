import api from "../../services/api";
import type { Employee, EmployeePayload } from "./employeeTypes";

/* eslint-disable @typescript-eslint/no-explicit-any */
const pickOne = (res: any): Employee => res.data?.data ?? res.data?.employee ?? res.data;

const pickList = (res: any): Employee[] => {
  const d = res.data;
  if (Array.isArray(d)) return d;
  return d?.data ?? d?.employees ?? [];
};

export const employeeApi = {
  getAll: async (): Promise<Employee[]> => pickList(await api.get("/employees")),

  getById: async (id: string): Promise<Employee> =>
    pickOne(await api.get(`/employees/${id}`)),

  create: async (payload: EmployeePayload): Promise<Employee> =>
    pickOne(await api.post("/employees", payload)),

  update: async (id: string, payload: Partial<EmployeePayload>): Promise<Employee> =>
    pickOne(await api.put(`/employees/${id}`, payload)),

  remove: async (id: string): Promise<void> => {
    await api.delete(`/employees/${id}`);
  },
};