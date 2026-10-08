import {
  CheckCircle2,
  CircleAlert,
  CircleX,
  LoaderCircle
} from "lucide-react";

function StatusBadge({
  status,
  size = "normal"
}) {
  const normalized =
    String(status || "")
      .toLowerCase()
      .replaceAll("_", " ")
      .trim();

  let type = "neutral";
  let Icon = LoaderCircle;

  if (
    normalized.includes("verified") ||
    normalized.includes("valid") ||
    normalized.includes("online") ||
    normalized.includes("connected") ||
    normalized.includes("success") ||
    normalized.includes("ready")
  ) {
    type = "success";
    Icon = CheckCircle2;
  } else if (
    normalized.includes("modified") ||
    normalized.includes("warning") ||
    normalized.includes("pending") ||
    normalized.includes("recovery") ||
    normalized.includes("demo")
  ) {
    type = "warning";
    Icon = CircleAlert;
  } else if (
    normalized.includes("invalid") ||
    normalized.includes("offline") ||
    normalized.includes("failed") ||
    normalized.includes("error")
  ) {
    type = "danger";
    Icon = CircleX;
  }

  return (
    <span
      className={`status-badge status-${type} status-${size}`}
    >
      <Icon size={13} />

      <span>
        {String(status || "Unknown")}
      </span>
    </span>
  );
}

export default StatusBadge;