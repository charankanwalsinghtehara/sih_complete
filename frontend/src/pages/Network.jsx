import {
  CheckCircle2,
  Network as NetworkIcon,
  ShieldCheck
} from "lucide-react";

import { useEffect, useState } from "react";

import NetworkCard from "../components/NetworkCard";
import { DonutChart } from "../components/MetricChart";
import StatusBadge from "../components/StatusBadge";

import {
  getNetwork
} from "../services/api";

function Network() {
  const [data, setData] =
    useState({
      consensus: true,
      nodes: []
    });

  const loadNetwork = () => {
    getNetwork()
      .then(setData);
  };

  useEffect(() => {
    loadNetwork();

    const interval =
      setInterval(
        loadNetwork,
        5000
      );

    return () =>
      clearInterval(interval);
  }, []);

  const onlineNodes =
    data.nodes.filter(
      (node) => node.online
    ).length;

  return (
    <div className="page-container">
      <div className="page-heading-large">
        <div>
          <div className="section-kicker">
            DISTRIBUTED VALIDATION
          </div>

          <h1>
            Three-Node Network
          </h1>

          <p>
            Monitor node health, ledger synchronization
            and validation consensus.
          </p>
        </div>

        <StatusBadge
          status={
            data.consensus
              ? "Consensus Ready"
              : "Consensus Pending"
          }
        />
      </div>

      <div className="network-overview">
        <div className="network-overview-main">
          <div className="network-large-icon">
            <NetworkIcon size={27} />
          </div>

          <DonutChart
            value={onlineNodes}
            total={Math.max(data.nodes.length, 1)}
            label="online"
            tone="green"
          />

          <div className="network-health-copy">
            <span>NETWORK HEALTH</span>
            <strong>Validator availability</strong>
            <small>Live node status from the validation network</small>
          </div>
        </div>

        <div className="network-consensus">
          <CheckCircle2 size={18} />

          <div>
            <strong>
              2-of-3 Consensus
            </strong>

            <span>
              Majority validation threshold
            </span>
          </div>
        </div>

        <div className="network-security">
          <ShieldCheck size={18} />

          <div>
            <strong>
              Protected Ledger
            </strong>

            <span>
              Node validation enabled
            </span>
          </div>
        </div>
      </div>

      <div className="node-grid-large">
        {data.nodes.map((node) => (
          <NetworkCard
            key={node.id}
            node={node}
          />
        ))}
      </div>

      <section className="professional-card">
        <div className="card-heading">
          <div className="card-heading-icon blue">
            <NetworkIcon size={19} />
          </div>

          <div>
            <h2>
              Network Architecture
            </h2>

            <p>
              SecureTrace distributes validation across
              three local nodes.
            </p>
          </div>
        </div>

        <div className="architecture">
          {data.nodes.map(
            (node, index) => (
              <div
                className="architecture-node"
                key={node.id}
              >
                <div className="architecture-circle">
                  <ShieldCheck
                    size={19}
                  />
                </div>

                <strong>
                  {node.id}
                </strong>

                <span>
                  Validator
                </span>

                {index <
                  data.nodes.length -
                    1 && (
                  <div className="architecture-connection" />
                )}
              </div>
            )
          )}
        </div>
      </section>
    </div>
  );
}

export default Network;