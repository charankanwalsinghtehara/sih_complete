import { ArrowUpRight } from "lucide-react";

export default function StatCard({
  label,
  description,
  icon: Icon,
  tone = "blue",
  trend,
  visual,
}) {
  return (
    <article className={`stat-card ${tone}`}>
      <div className="stat-card-top">
        <div className="stat-icon">
          {Icon ? <Icon size={19} /> : null}
        </div>
        {trend ? (
          <span className="stat-trend">
            <ArrowUpRight size={13} />
            {trend}
          </span>
        ) : null}
      </div>

      <div className="stat-visual">{visual}</div>

      <div className="stat-title">{label}</div>
      <div className="stat-subtitle">{description}</div>
    </article>
  );
}
