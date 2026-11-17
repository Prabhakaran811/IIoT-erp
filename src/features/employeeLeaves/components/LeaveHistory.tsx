import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { employeeLeaveApi, type EmployeeHistory } from "../employeeLeaveApi";
import { initials, type Employee } from "../../employees/employeeTypes";
import {
  dayKey,
  fmtDays,
  leaveTotalDays,
  typeClass,
} from "../employeeLeaveTypes";
import { formatDate, getErrorMessage } from "../../../utils/helpers";

interface Props {
  employeeId: string;
  employees: Employee[];
  onClose: () => void;
}

export default function LeaveHistory({ employeeId, employees, onClose }: Props) {
  const [data, setData] = useState<EmployeeHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const result = await employeeLeaveApi.getByEmployee(employeeId);
        if (!cancelled) setData(result);
      } catch (e) {
        if (!cancelled) setError(getErrorMessage(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [employeeId]);

  const local = employees.find((e) => e._id === employeeId);
  const name = data?.employee?.employeeName ?? local?.employeeName ?? "Employee";
  const code = data?.employee?.employeeCode ?? local?.employeeCode ?? "";
  const records = [...(data?.records ?? [])].sort((a, b) =>
    dayKey(b.fromDate).localeCompare(dayKey(a.fromDate))
  );

  return (
    <>
      <div className="cm-overlay" onClick={onClose} />
      <aside className="cm-drawer lv-drawer">
        <div className="cm-drawer-head">
          <div className="cm-customer">
            <div className="cm-avatar lv-avatar-light">{initials(name)}</div>
            <div>
              <h3>{name}</h3>
              <p>{code} · Leave history</p>
            </div>
          </div>
          <button className="cm-icon-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="cm-drawer-body">
          {loading ? (
            <div className="cm-state"><div className="cm-spinner" />Loading history...</div>
          ) : error ? (
            <div className="lv-clash">{error}</div>
          ) : (
            <>
              <div className="lv-history-stats">
                <div>
                  <span>Leave records</span>
                  <strong>{data?.totalRecords ?? 0}</strong>
                </div>
                <div>
                  <span>Total leave days</span>
                  <strong>{fmtDays(data?.totalLeaveDays ?? 0)}</strong>
                </div>
              </div>

              {records.length === 0 ? (
                <p className="cm-sub">No leave recorded for this employee.</p>
              ) : (
                records.map((l) => (
                  <div className="lv-history-item" key={l._id}>
                    <div className="lv-history-top">
                      <span className={`lv-chip ${typeClass(l.leaveType)}`}>{l.leaveType}</span>
                      <strong>{fmtDays(leaveTotalDays(l))} day(s)</strong>
                    </div>
                    <div className="cm-name-sm">
                      {formatDate(l.fromDate)}
                      {dayKey(l.fromDate) !== dayKey(l.toDate) && ` to ${formatDate(l.toDate)}`}
                      <span className="cm-code"> · {l.duration}</span>
                    </div>
                    {l.reason && <div className="cm-sub">{l.reason}</div>}
                    {l.remarks && <div className="cm-sub">{l.remarks}</div>}
                  </div>
                ))
              )}
            </>
          )}
        </div>
      </aside>
    </>
  );
}