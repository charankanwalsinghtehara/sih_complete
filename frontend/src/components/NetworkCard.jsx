import {
  Server,
  ShieldCheck
} from "lucide-react";

import StatusBadge from "./StatusBadge";

function NetworkCard({
  node
}) {
  return (
    <div className="network-card">
      <div className="network-card-top">
        <div className="node-avatar">
          <Server size={17} />
        </div>

        <StatusBadge
          status={
            node.online
              ? "ONLINE"
              : "OFFLINE"
          }
          size="small"
        />
      </div>

      <div className="node-name">
        {node.id}
      </div>

      <div className="node-address">
        {node.address}
      </div>

      <div className="node-metrics">
        <div>
          <span>
            Ledger
          </span>

          <strong>
            #{node.height}
          </strong>
        </div>

        <div>
          <span>
            Role
          </span>

          <strong>
            Validator
          </strong>
        </div>
      </div>

      <div className="node-footer">
        <ShieldCheck size={13} />

        <span>
          Integrity validation enabled
        </span>
      </div>
    </div>
  );
}

export default NetworkCard;