import type { Employee } from "../employees/employeeTypes";

export const LEAVE_TYPES = [
  "Casual Leave",
  "Sick Leave",
  "Earned Leave",
  "Loss of Pay",
  "Compensatory Off",
  "Maternity Leave",
  "Paternity Leave",
] as const;

export const LEAVE_DURATIONS = ["Full Day", "Half Day"] as const;

// Weekly off days (0 = Sunday ... 6 = Saturday).
// Set this to match how your backend counts working days, e.g. [0, 6] for Sat + Sun.
export const WEEKLY_OFF_DAYS: number[] = [0];

export const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
export const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export interface EmployeeRef {
  _id: string;
  employeeCode?: string;
  employeeName?: string;
  department?: string;
  designation?: string;
}

export interface EmployeeLeave {
  _id: string;
  employee: string | EmployeeRef;
  leaveType: string;
  fromDate: string;
  toDate: string;
  duration: string;
  totalDays?: number; // calculated by the backend
  reason: string;
  remarks: string;
  recordedBy: string;
  createdAt?: string;
  updatedAt?: string;
}

// totalDays is NOT part of the payload: the backend calculates it
export interface LeavePayload {
  employee: string;
  leaveType: string;
  fromDate: string;
  toDate: string;
  duration: string;
  reason: string;
  remarks: string;
  recordedBy: string;
}

/* ---------- date helpers (all work on yyyy-mm-dd keys) ---------- */
export const pad = (n: number) => String(n).padStart(2, "0");
export const dayKey = (d?: string) => (d ? d.slice(0, 10) : "");
const parseKey = (k: string) => new Date(k + "T00:00:00Z");
const toKey = (d: Date) => d.toISOString().slice(0, 10);

// today in the user's own time zone
export const localKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export const eachDay = (from: string, to: string): string[] => {
  const out: string[] = [];
  const end = parseKey(to);
  let d = parseKey(from);
  if (isNaN(d.getTime()) || isNaN(end.getTime())) return out;
  while (d <= end && out.length < 400) {
    out.push(toKey(d));
    d = new Date(d.getTime() + 86400000);
  }
  return out;
};

export const isWeeklyOff = (key: string) => WEEKLY_OFF_DAYS.includes(parseKey(key).getUTCDay());
const weight = (duration: string) => (duration === "Half Day" ? 0.5 : 1);

export const workingDays = (from: string, to: string, duration: string) =>
  eachDay(from, to).filter((k) => !isWeeklyOff(k)).length * weight(duration);

export const leaveTotalDays = (l: EmployeeLeave) =>
  typeof l.totalDays === "number" ? l.totalDays : workingDays(dayKey(l.fromDate), dayKey(l.toDate), l.duration);

export const fmtDays = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));

export const overlaps = (aFrom: string, aTo: string, bFrom: string, bTo: string) =>
  aFrom <= bTo && bFrom <= aTo;

export const monthRange = (year: number, month0: number) => {
  const lastDay = new Date(Date.UTC(year, month0 + 1, 0)).getUTCDate();
  return {
    start: `${year}-${pad(month0 + 1)}-01`,
    end: `${year}-${pad(month0 + 1)}-${pad(lastDay)}`,
    lastDay,
  };
};

// Monday-first grid with leading/trailing days of the neighbouring months
export const buildMonthGrid = (year: number, month0: number) => {
  const first = new Date(Date.UTC(year, month0, 1));
  const offset = (first.getUTCDay() + 6) % 7;
  const { lastDay } = monthRange(year, month0);
  const total = Math.ceil((offset + lastDay) / 7) * 7;
  const startMs = first.getTime() - offset * 86400000;
  return Array.from({ length: total }, (_, i) => {
    const d = new Date(startMs + i * 86400000);
    return { key: toKey(d), day: d.getUTCDate(), inMonth: d.getUTCMonth() === month0 };
  });
};

export const leavesOnDay = (leaves: EmployeeLeave[], key: string) =>
  isWeeklyOff(key)
    ? []
    : leaves.filter((l) => dayKey(l.fromDate) <= key && key <= dayKey(l.toDate));

export const typeClass = (t: string) => "lv-" + t.toLowerCase().replace(/[^a-z]+/g, "-");

/* ---------- employee lookup (populated object or plain id) ---------- */
export const employeeInfo = (l: EmployeeLeave, employees: Employee[]) => {
  const ref = typeof l.employee === "object" && l.employee ? l.employee : undefined;
  const id = ref ? ref._id : (l.employee as string);
  const e = employees.find((x) => x._id === id);
  return {
    id,
    name: ref?.employeeName ?? e?.employeeName ?? "Unknown",
    code: ref?.employeeCode ?? e?.employeeCode ?? "",
    department: ref?.department ?? e?.department ?? "",
  };
};

/* ---------- monthly report ---------- */
export interface SummaryRow {
  id: string;
  name: string;
  code: string;
  department: string;
  count: number;
  days: number;
  byType: Record<string, number>;
}

export interface MonthlySummary {
  records: EmployeeLeave[];
  totalDays: number;
  rows: SummaryRow[];
}

const daysInRange = (l: EmployeeLeave, start: string, end: string) => {
  const from = dayKey(l.fromDate) > start ? dayKey(l.fromDate) : start;
  const to = dayKey(l.toDate) < end ? dayKey(l.toDate) : end;
  if (from > to) return 0;
  return workingDays(from, to, l.duration);
};

export const buildMonthlySummary = (
  leaves: EmployeeLeave[],
  employees: Employee[],
  year: number,
  month0: number
): MonthlySummary => {
  const { start, end } = monthRange(year, month0);
  const records = leaves.filter((l) => dayKey(l.fromDate) <= end && dayKey(l.toDate) >= start);
  const map = new Map<string, SummaryRow>();
  let totalDays = 0;

  records.forEach((l) => {
    const info = employeeInfo(l, employees);
    const inside = dayKey(l.fromDate) >= start && dayKey(l.toDate) <= end;
    // leaves fully inside the month use the server's totalDays, others are prorated
    const days = inside && typeof l.totalDays === "number" ? l.totalDays : daysInRange(l, start, end);
    const row = map.get(info.id) ?? {
      id: info.id,
      name: info.name,
      code: info.code,
      department: info.department,
      count: 0,
      days: 0,
      byType: {},
    };
    row.count += 1;
    row.days += days;
    row.byType[l.leaveType] = (row.byType[l.leaveType] ?? 0) + days;
    map.set(info.id, row);
    totalDays += days;
  });

  const rows = Array.from(map.values()).sort(
    (a, b) => b.days - a.days || a.name.localeCompare(b.name)
  );
  return { records, totalDays, rows };
};