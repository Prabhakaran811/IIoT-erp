import { Download } from "lucide-react";
import { initials } from "../../employees/employeeTypes";
import {
  MONTH_NAMES,
  fmtDays,
  pad,
  typeClass,
  type MonthlySummary,
} from "../employeeLeaveTypes";

interface Props {
  summary: MonthlySummary;
  year: number;
  month: number;
  onHistory: (employeeId: string) => void;
}

export default function LeaveReport({ summary, year, month, onHistory }: Props) {
  const exportCsv = () => {
    const header = ["Employee code", "Employee name", "Department", "Leave records", "Leave days", "Breakdown"];
    const lines = summary.rows.map((r) => [
      r.code,
      r.name,
      r.department,
      r.count,
      fmtDays(r.days),
      Object.entries(r.byType)
        .map(([t, d]) => `${t}: ${fmtDays(d)}`)
        .join("; "),
    ]);
    const csv = [header, ...lines]
      .map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `leave-report-${year}-${pad(month + 1)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (summary.rows.length === 0) {
    return (
      <div className="cm-state">
        <strong>No leave in {MONTH_NAMES[month]} {year}</strong>
        <span>Nobody has leave recorded for this month.</span>
      </div>
    );
  }

  return (
    <>
      <div className="lv-report-bar">
        <span>
          {summary.rows.length} employee{summary.rows.length > 1 ? "s" : ""} on leave ·{" "}
          <strong>{fmtDays(summary.totalDays)}</strong> leave day(s)
        </span>
        <button className="cm-btn ghost" onClick={exportCsv}>
          <Download size={16} /> Download CSV
        </button>
      </div>

      <div className="cm-table-wrap">
        <table className="cm-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Department</th>
              <th>Records</th>
              <th>Leave days</th>
              <th>Breakdown</th>
            </tr>
          </thead>
          <tbody>
            {summary.rows.map((r) => (
              <tr key={r.id} className="lv-click" onClick={() => onHistory(r.id)} title="View history">
                <td>
                  <div className="cm-customer">
                    <div className="cm-avatar">{initials(r.name)}</div>
                    <div>
                      <div className="cm-name">{r.name}</div>
                      <div className="cm-code">{r.code}</div>
                    </div>
                  </div>
                </td>
                <td>{r.department || "-"}</td>
                <td>{r.count}</td>
                <td>
                  <span className="lv-days">{fmtDays(r.days)}</span>
                </td>
                <td>
                  <div className="lv-breakdown">
                    {Object.entries(r.byType).map(([t, d]) => (
                      <span key={t} className={`lv-chip ${typeClass(t)}`}>
                        {t}: {fmtDays(d)}
                      </span>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}