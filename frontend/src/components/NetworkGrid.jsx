import { Server, Wifi, Database } from "lucide-react";
import StatusBadge from "./StatusBadge";

export default function NetworkGrid({ nodes = [] }) {
  return (
    <div className="network-grid">
      {nodes.map((node) => (
        <div className="network-node" key={node.id}>
          <div className="network-node-header">
            <div className="node-icon">
              <Server size={19} />
            </div>

            <StatusBadge status={node.status} />
          </div>

          <h3>{node.name}</h3>

          <p>{node.address}</p>

          <div className="node-metrics">
            <div>
              <span>Height</span>
              <strong>{node.height ?? 0}</strong>
            </div>

            <div>
              <span>Latency</span>
              <strong>{node.latency ?? "--"}</strong>
            </div>

            <div>
              <span>Ledger</span>
              <strong>
                <Database size={13} />
                Synced
              </strong>
            </div>
          </div>

          <div className="node-connection">
            <Wifi size={14} />
            Secure local connection
          </div>
        </div>
      ))}
    </div>
  );
}