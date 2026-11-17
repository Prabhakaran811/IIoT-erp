import api from "../../services/api";
import type { EmployeeLeave, EmployeeRef, LeavePayload } from "./employeeLeaveTypes";

/* eslint-disable @typescript-eslint/no-explicit-any */
const pickOne = (res: any): EmployeeLeave => res.data?.data ?? res.data?.leave ?? res.data;

const pickList = (res: any): EmployeeLeave[] => {
  const d = res.data;
  if (Array.isArray(d)) return d;
  return d?.data ?? d?.leaves ?? [];
};

export interface EmployeeHistory {
  employee?: EmployeeRef;
  totalRecords: number;
  totalLeaveDays: number;
  records: EmployeeLeave[];
}

export const employeeLeaveApi = {
  getAll: async (): Promise<EmployeeLeave[]> => pickList(await api.get("/employee-leaves")),

  getById: async (id: string): Promise<EmployeeLeave> =>
    pickOne(await api.get(`/employee-leaves/${id}`)),

  // one employee's leave history
  getByEmployee: async (employeeId: string): Promise<EmployeeHistory> => {
    const d = (await api.get(`/employee-leaves/employee/${employeeId}`)).data;
    const records: EmployeeLeave[] = Array.isArray(d) ? d : d?.data ?? [];
    return {
      employee: d?.employee,
      totalRecords: d?.totalRecords ?? records.length,
      totalLeaveDays: d?.totalLeaveDays ?? 0,
      records,
    };
  },

  // server-side monthly report (the page builds the same report from getAll)
  getMonthly: async (month: number, year: number) =>
    (await api.get("/employee-leaves/monthly", { params: { month, year } })).data,

  create: async (payload: LeavePayload): Promise<EmployeeLeave> =>
    pickOne(await api.post("/employee-leaves", payload)),

  update: async (id: string, payload: Partial<LeavePayload>): Promise<EmployeeLeave> =>
    pickOne(await api.put(`/employee-leaves/${id}`, payload)),

  remove: async (id: string): Promise<void> => {
    await api.delete(`/employee-leaves/${id}`);
  },
};