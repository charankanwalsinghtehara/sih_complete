import {
  Activity,
  Blocks,
  CheckCircle2,
  FileCheck2,
  FileText,
  Network,
  ShieldAlert,
  ShieldCheck,
  Wrench
} from "lucide-react";

import { useEffect, useState } from "react";

import StatCard from "../components/StatCard";
import { DonutChart, SegmentedChart, StackedBarChart, NodeHealthChart } from "../components/MetricChart";
import QuickAction from "../components/QuickAction";
import NetworkCard from "../components/NetworkCard";
import ActivityList from "../components/ActivityList";
import StatusBadge from "../components/StatusBadge";

import {
  getDashboard
} from "../services/api";

function Dashboard({
  onNavigate
}) {
  const [data, setData] =
    useState(null);

  useEffect(() => {
    getDashboard()
      .then(setData);
  }, []);

  const stats =
    data?.stats || {
      documents: 24,
      verified: 18,
      modified: 3,
      blockchainHeight: 12,
      recoverySuccess: 5
    };

  const nodes =
    data?.nodes || [];

  const activities =
    data?.activities || [];

  return (
    <div className="dashboard-page">
      <section className="hero-banner">
        <div className="hero-copy">
          <div className="hero-kicker">
            <span />
            SECURETRACE WORKSPACE
          </div>

          <h1>
            Keep your evidence
            <br />
            <span>
              easy to trust.
            </span>
          </h1>

          <p>
            Add evidence, check its integrity, and keep a clear record of what happened —
            without digging through a wall of numbers.
          </p>

          <div className="hero-actions">
            <button
              className="hero-primary"
              onClick={() =>
                onNavigate(
                  "verification"
                )
              }
            >
              <ShieldCheck size={17} />

              Check a document
            </button>

            <button
              className="hero-secondary"
              onClick={() =>
                onNavigate(
                  "documents"
                )
              }
            >
              <FileText size={17} />

              Add a document
            </button>
          </div>
        </div>

        <div className="hero-visual">
          <div className="hero-orbit orbit-one" />
          <div className="hero-orbit orbit-two" />

          <div className="hero-shield">
            <ShieldCheck size={58} />
          </div>

          <div className="hero-chip chip-one">
            SHA-256
          </div>

          <div className="hero-chip chip-two">
            BLOCKCHAIN
          </div>

          <div className="hero-chip chip-three">
            WATERMARK
          </div>
        </div>
      </section>

      <section className="section-block">
        <div className="section-title-row">
          <div>
            <div className="section-kicker">
              TODAY
            </div>

            <h2>
              Integrity Overview
            </h2>
          </div>

          <StatusBadge
            status="System Ready"
          />
        </div>

        <div className="stats-grid">
          <StatCard
            icon={FileText}
            label="Protected Documents"
            description="Registered evidence records"
            tone="blue"
            visual={<DonutChart value={stats.verified} total={Math.max(stats.documents, 1)} label="verified" tone="blue" />}
          />

          <StatCard
            icon={CheckCircle2}
            label="Integrity Mix"
            description="Current document verification state"
            tone="green"
            visual={
              <StackedBarChart
                label="Document state"
                items={[
                  { key: "verified", label: "Verified", value: stats.verified, tone: "green" },
                  { key: "modified", label: "Modified", value: stats.modified, tone: "orange" },
                  { key: "pending", label: "Pending", value: Math.max(stats.documents - stats.verified - stats.modified, 0), tone: "neutral" },
                ]}
              />
            }
          />

          <StatCard
            icon={ShieldAlert}
            label="Modification Risk"
            description="Share of records needing review"
            tone="orange"
            visual={<DonutChart value={stats.modified} total={Math.max(stats.documents, 1)} label="review" tone="orange" />}
          />

          <StatCard
            icon={Blocks}
            label="Ledger Progress"
            description="Current chain position"
            tone="purple"
            visual={<SegmentedChart value={stats.blockchainHeight} total={Math.max(stats.blockchainHeight, 12)} label="ledger" tone="purple" />}
          />
        </div>
      </section>

      <section className="dashboard-grid-main">
        <div className="dashboard-column">
          <div className="section-title-row">
            <div>
              <div className="section-kicker">
                WORKFLOWS
              </div>

              <h2>
                Common tasks
              </h2>
            </div>
          </div>

          <div className="quick-actions-grid">
            <QuickAction
              icon={FileCheck2}
              title="Issue Document"
              description="Hash and watermark evidence"
              tone="blue"
              onClick={() =>
                onNavigate(
                  "documents"
                )
              }
            />

            <QuickAction
              icon={ShieldCheck}
              title="Verify Evidence"
              description="Run forensic integrity checks"
              tone="green"
              onClick={() =>
                onNavigate(
                  "verification"
                )
              }
            />

            <QuickAction
              icon={Blocks}
              title="Inspect Blockchain"
              description="Review immutable ledger"
              tone="purple"
              onClick={() =>
                onNavigate(
                  "blockchain"
                )
              }
            />

            <QuickAction
              icon={Network}
              title="Network Status"
              description="Monitor three validators"
              tone="orange"
              onClick={() =>
                onNavigate(
                  "network"
                )
              }
            />
          </div>
        </div>

        <div className="dashboard-column">
          <div className="section-title-row">
            <div>
              <div className="section-kicker">
                RECOVERY
              </div>

              <h2>
                Recovery status
              </h2>
            </div>
          </div>

          <div className="recovery-card">
            <div className="recovery-top">
              <div className="recovery-icon">
                <Wrench size={22} />
              </div>

              <StatusBadge
                status="Ready"
              />
            </div>

            <div className="recovery-chart-row">
              <DonutChart value={stats.recoverySuccess} total={Math.max(stats.documents, stats.recoverySuccess, 1)} label="recovered" tone="purple" />
              <div>
                <div className="recovery-value-label">Recovery success</div>
                <div className="recovery-title">Successful evidence recoveries</div>
                <div className="recovery-inline-status">Reed-Solomon engine operational</div>
              </div>
            </div>

            <p>
              If an evidence fragment is damaged, the recovery layer can rebuild supported files before you compare them.
            </p>

            <div className="recovery-progress">
              <div>
                <span>
                  Recovery engine
                </span>

                <strong>
                  Operational
                </strong>
              </div>

              <div className="progress-track">
                <div className="progress-fill" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="analytics-grid">
        <div className="analytics-card">
          <div className="section-title-row">
            <div>
              <div className="section-kicker">EVIDENCE DISTRIBUTION</div>
              <h2>Integrity Composition</h2>
            </div>
            <StatusBadge status="Live" />
          </div>
          <StackedBarChart
            label="Evidence composition"
            items={[
              { key: "verified", label: "Verified", value: stats.verified, tone: "green" },
              { key: "modified", label: "Modified", value: stats.modified, tone: "orange" },
              { key: "pending", label: "Pending", value: Math.max(stats.documents - stats.verified - stats.modified, 0), tone: "neutral" },
            ]}
          />
          <div className="analytics-note">The visual is calculated directly from the current dashboard telemetry.</div>
        </div>

        <div className="analytics-card">
          <div className="section-title-row">
            <div>
              <div className="section-kicker">VALIDATOR TELEMETRY</div>
              <h2>Network Availability</h2>
            </div>
            <StatusBadge status={nodes.length ? "Monitoring" : "No Nodes"} />
          </div>
          <NodeHealthChart nodes={nodes} />
          <div className="analytics-note">Validator state updates from the same node records used by the network view.</div>
        </div>
      </section>

      <section className="dashboard-grid-main bottom-grid">
        <div className="dashboard-column">
          <div className="section-title-row">
            <div>
              <div className="section-kicker">
                VALIDATOR NETWORK
              </div>

              <h2>
                Validator health
              </h2>
            </div>

            <button
              className="text-button"
              onClick={() =>
                onNavigate(
                  "network"
                )
              }
            >
              View network →
            </button>
          </div>

          <div className="node-grid">
            {nodes.map((node) => (
              <NetworkCard
                key={node.id}
                node={node}
              />
            ))}
          </div>
        </div>

        <div className="dashboard-column">
          <div className="section-title-row">
            <div>
              <div className="section-kicker">
                AUDIT TRAIL
              </div>

              <h2>
                Recent activity
              </h2>
            </div>

            <Activity size={17} />
          </div>

          <div className="activity-card">
            <ActivityList
              activities={activities}
            />
          </div>
        </div>
      </section>
    </div>
  );
}

export default Dashboard;