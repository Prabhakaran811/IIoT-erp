import { useMemo } from "react";
import type { Employee } from "../../employees/employeeTypes";
import {
  WEEKDAYS,
  buildMonthGrid,
  dayKey,
  eachDay,
  employeeInfo,
  isWeeklyOff,
  localKey,
  typeClass,
  type EmployeeLeave,
} from "../employeeLeaveTypes";

interface Props {
  leaves: EmployeeLeave[];
  employees: Employee[];
  year: number;
  month: number; // 0-11
  onDayClick: (key: string) => void;
}

const MAX_CHIPS = 3;

export default function LeaveCalendar({ leaves, employees, year, month, onDayClick }: Props) {
  const cells = useMemo(() => buildMonthGrid(year, month), [year, month]);
  const today = localKey();

  // day key -> leaves on that day (weekly off days are skipped)
  const byDay = useMemo(() => {
    const map: Record<string, EmployeeLeave[]> = {};
    leaves.forEach((l) => {
      eachDay(dayKey(l.fromDate), dayKey(l.toDate)).forEach((k) => {
        if (isWeeklyOff(k)) return;
        if (!map[k]) map[k] = [];
        map[k].push(l);
      });
    });
    return map;
  }, [leaves]);

  return (
    <div className="lv-cal-scroll">
      <div className="lv-cal">
        {WEEKDAYS.map((d) => (
          <div className="lv-cal-head" key={d}>
            {d}
          </div>
        ))}

        {cells.map((c) => {
          const items = byDay[c.key] ?? [];
          const off = isWeeklyOff(c.key);
          return (
            <div
              key={c.key}
              className={`lv-cell ${c.inMonth ? "" : "out"} ${off ? "off" : ""} ${
                c.key === today ? "today" : ""
              }`}
              onClick={() => onDayClick(c.key)}
            >
              <div className="lv-cell-day">{c.day}</div>

              {items.slice(0, MAX_CHIPS).map((l) => {
                const info = employeeInfo(l, employees);
                return (
                  <div
                    key={l._id}
                    className={`lv-chip lv-chip-sm ${typeClass(l.leaveType)}`}
                    title={`${info.name} - ${l.leaveType} (${l.duration})`}
                  >
                    {info.name.split(" ")[0]}
                    {l.duration === "Half Day" && <b> ½</b>}
                  </div>
                );
              })}
              {items.length > MAX_CHIPS && (
                <div className="lv-more">+{items.length - MAX_CHIPS} more</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}