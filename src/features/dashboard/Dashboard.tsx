import "./Dashboard.css";

const stats = [
  { label: "Customers", value: 0 },
  { label: "Active Projects", value: 0 },
  { label: "Devices", value: 0 },
  { label: "Open Orders", value: 0 },
];

export default function Dashboard() {
  return (
    <div>
      <h2>Dashboard</h2>
      <div className="stat-grid">
        {stats.map((s) => (
          <div className="stat-card" key={s.label}>
            <span>{s.label}</span>
            <strong>{s.value}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}