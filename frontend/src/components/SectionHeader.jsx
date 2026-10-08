import { ArrowUpRight } from "lucide-react";

export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  tone = "blue",
  trend,
}) {
  return (
    <div className={`stat-card ${tone}`}>
      <div className="stat-card-top">
        <div className="stat-icon">
          {Icon ? <Icon size={21} /> : null}
        </div>

        {trend ? (
          <span className="stat-trend">
            <ArrowUpRight size={14} />
            {trend}
          </span>
        ) : null}
      </div>

      <div className="stat-value">{value}</div>

      <div className="stat-title">{title}</div>

      {subtitle ? (
        <div className="stat-subtitle">{subtitle}</div>
      ) : null}
    </div>
  );
}