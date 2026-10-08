import { useMemo } from "react";

function polarToCartesian(cx, cy, radius, angle) {
  const angleInRadians = ((angle - 90) * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(angleInRadians),
    y: cy + radius * Math.sin(angleInRadians),
  };
}

function arcPath(cx, cy, radius, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, radius, endAngle);
  const end = polarToCartesian(cx, cy, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  return [
    `M ${start.x} ${start.y}`,
    `A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`,
  ].join(" ");
}

export function DonutChart({ value = 0, total = 1, label = "", tone = "blue" }) {
  const ratio = Math.max(0, Math.min(1, total ? value / total : 0));
  const percentage = Math.round(ratio * 100);
  const endAngle = Math.max(0.1, ratio * 360);

  return (
    <div className={`metric-visual metric-${tone}`} aria-label={`${label}: ${percentage}%`}>
      <svg viewBox="0 0 100 100" className="metric-donut" role="img">
        <circle className="metric-track" cx="50" cy="50" r="39" fill="none" strokeWidth="8" />
        <path
          className="metric-progress"
          d={arcPath(50, 50, 39, 0, endAngle)}
          fill="none"
          strokeWidth="8"
          strokeLinecap="round"
        />
      </svg>
      <div className="metric-center">
        <strong>{percentage}%</strong>
        <span>{label}</span>
      </div>
    </div>
  );
}

export function SegmentedChart({ value = 0, total = 1, label = "", tone = "purple" }) {
  const segments = useMemo(() => {
    const count = Math.max(6, Math.min(18, total || 6));
    const filled = Math.round((value / Math.max(total, 1)) * count);
    return Array.from({ length: count }, (_, index) => index < filled);
  }, [value, total]);

  return (
    <div className={`segment-visual segment-${tone}`} aria-label={`${label}: ${value} of ${total}`}>
      <div className="segment-bars">
        {segments.map((filled, index) => (
          <span key={index} className={filled ? "is-filled" : ""} />
        ))}
      </div>
      <div className="segment-caption">
        <span>{label}</span>
        <strong>{value} / {total}</strong>
      </div>
    </div>
  );
}

export function StackedBarChart({ items = [], label = "", tone = "green" }) {
  const total = items.reduce((sum, item) => sum + Math.max(0, item.value || 0), 0);

  return (
    <div className={`stacked-visual stacked-${tone}`}>
      <div className="stacked-track" aria-label={label}>
        {items.map((item) => (
          <span
            key={item.key}
            className={`stacked-segment stacked-${item.tone || "neutral"}`}
            style={{ width: `${total ? (item.value / total) * 100 : 0}%` }}
            title={`${item.label}: ${item.value}`}
          />
        ))}
      </div>
      <div className="stacked-legend">
        {items.map((item) => (
          <span key={item.key}>
            <i className={`legend-dot legend-${item.tone || "neutral"}`} />
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export function NodeHealthChart({ nodes = [] }) {
  const online = nodes.filter((node) => node.online).length;
  const total = Math.max(nodes.length, 1);

  return (
    <div className="node-health-visual">
      <div className="node-health-bars">
        {nodes.map((node) => (
          <div className="node-health-item" key={node.id}>
            <div className={`node-health-bar ${node.online ? "online" : "offline"}`}>
              <span />
            </div>
            <small>{node.id}</small>
          </div>
        ))}
      </div>
      <div className="node-health-caption">
        <span>Validator availability</span>
        <strong>{online}/{total} online</strong>
      </div>
    </div>
  );
}
