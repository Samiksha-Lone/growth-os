interface InsightCardProps {
  title: string;
  insight: string;
  label?: string;
}

export function InsightCard({ title, insight, label }: InsightCardProps) {
  return (
    <div className="insight-card">
      {label && <div className="insight-card-label">{label}</div>}
      <div className="insight-card-title">{title}</div>
      <p className="insight-card-text">{insight}</p>
    </div>
  );
}
