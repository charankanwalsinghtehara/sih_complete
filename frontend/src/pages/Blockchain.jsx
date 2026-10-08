import {
  Blocks,
  CheckCircle2,
  Fingerprint,
  Link2,
  ShieldCheck
} from "lucide-react";

import { useEffect, useState } from "react";

import StatusBadge from "../components/StatusBadge";
import BlockchainTable from "../components/BlockchainTable";
import { DonutChart, SegmentedChart } from "../components/MetricChart";

import {
  getBlockchain
} from "../services/api";

function Blockchain() {
  const [data, setData] =
    useState({
      valid: true,
      height: 8,
      blocks: []
    });

  useEffect(() => {
    getBlockchain()
      .then(setData);
  }, []);

  return (
    <div className="page-container">
      <div className="page-heading-large">
        <div>
          <div className="section-kicker">
            DISTRIBUTED LEDGER
          </div>

          <h1>
            Blockchain Integrity
          </h1>

          <p>
            Inspect the SecureTrace chain of evidence
            and verify block relationships.
          </p>
        </div>

        <StatusBadge
          status={
            data.valid
              ? "Chain Valid"
              : "Chain Invalid"
          }
        />
      </div>

      <div className="blockchain-summary-grid">
        <SummaryBox
          icon={Blocks}
          label="CHAIN HEIGHT"
          visual={<SegmentedChart value={data.height} total={Math.max(data.height, 12)} label="ledger" tone="blue" />}
          tone="blue"
        />

        <SummaryBox
          icon={Link2}
          label="BLOCKS"
          visual={<DonutChart value={data.blocks.length} total={Math.max(data.height, data.blocks.length, 1)} label="indexed" tone="purple" />}
          tone="purple"
        />

        <SummaryBox
          icon={CheckCircle2}
          label="VALIDATION"
          visual={<DonutChart value={data.valid ? 1 : 0} total={1} label={data.valid ? "passed" : "failed"} tone={data.valid ? "green" : "orange"} />}
          tone="green"
        />

        <SummaryBox
          icon={Fingerprint}
          label="HASHING"
          visual={<div className="hash-visual"><span>SHA</span><strong>256</strong><small>SECURE HASH</small></div>}
          tone="orange"
        />
      </div>

      <section className="professional-card">
        <div className="card-heading">
          <div className="card-heading-icon purple">
            <Blocks size={19} />
          </div>

          <div>
            <h2>
              Ledger Blocks
            </h2>

            <p>
              Every block references its predecessor,
              forming the SecureTrace integrity chain.
            </p>
          </div>
        </div>

        <BlockchainTable
          blocks={data.blocks}
        />
      </section>

      <section className="integrity-explanation">
        <div className="integrity-icon">
          <ShieldCheck size={21} />
        </div>

        <div>
          <strong>
            Chain validation
          </strong>

          <p>
            SecureTrace verifies stored block hashes,
            previous-hash links, transaction integrity
            and sequential block indices.
          </p>
        </div>
      </section>
    </div>
  );
}

function SummaryBox({
  icon: Icon,
  label,
  visual,
  tone
}) {
  return (
    <div className={`summary-box summary-box-${tone}`}>
      <div className="summary-box-header">
        <div className={`summary-icon summary-${tone}`}>
          <Icon size={18} />
        </div>
        <span>{label}</span>
      </div>
      <div className="summary-visual">{visual}</div>
    </div>
  );
}

export default Blockchain;