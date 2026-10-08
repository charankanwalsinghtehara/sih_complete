import {
  Blocks,
  CheckCircle2,
  FilePlus2,
  ShieldAlert
} from "lucide-react";

function ActivityList({
  activities
}) {
  const getIcon = (type) => {
    switch (type) {
      case "document":
        return FilePlus2;

      case "warning":
        return ShieldAlert;

      case "block":
        return Blocks;

      default:
        return CheckCircle2;
    }
  };

  return (
    <div className="activity-list">
      {activities.map(
        (activity, index) => {
          const Icon = getIcon(
            activity.type
          );

          return (
            <div
              className="activity-item"
              key={
                activity.id ||
                index
              }
            >
              <div
                className={`activity-icon activity-${activity.type}`}
              >
                <Icon size={16} />
              </div>

              <div className="activity-content">
                <strong>
                  {activity.title}
                </strong>

                <span>
                  {activity.description}
                </span>
              </div>

              <time>
                {activity.time}
              </time>
            </div>
          );
        }
      )}
    </div>
  );
}

export default ActivityList;