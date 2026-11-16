interface Props {
  title: string;
  subtitle?: string;
}

export default function PageHeader({ title, subtitle }: Props) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h2 style={{ margin: 0, color: "var(--green-dark)" }}>{title}</h2>
      {subtitle && <p style={{ margin: "4px 0 0", opacity: 0.7 }}>{subtitle}</p>}
    </div>
  );
}