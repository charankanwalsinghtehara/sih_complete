import {
  CheckCircle2,
  FileKey2,
  Fingerprint,
  ShieldCheck,
  Wrench
} from "lucide-react";

import StatusBadge from "./StatusBadge";

function VerificationResult({
  result
}) {
  if (!result) {
    return null;
  }

  const checks = [
    {
      title: "Watermark",
      value: result.watermark_match
        ? "Matched"
        : "Not Matched",
      valid: result.watermark_match,
      icon: FileKey2
    },
    {
      title: "SHA-256",
      value: result.document_hash_match
        ? "Integrity Match"
        : "Hash Mismatch",
      valid: result.document_hash_match,
      icon: Fingerprint
    },
    {
      title: "Blockchain",
      value: result.blockchain_valid
        ? "Ledger Valid"
        : "Ledger Invalid",
      valid: result.blockchain_valid,
      icon: ShieldCheck
    },
    {
      title: "Recovery",
      value: result.recovery_attempted
        ? result.recovery_successful
          ? "Recovered"
          : "Recovery Failed"
        : "Not Required",
      valid:
        !result.recovery_attempted ||
        result.recovery_successful,
      icon: Wrench
    }
  ];

  return (
    <section className="verification-result">
      <div className="result-heading">
        <div className="result-heading-left">
          <div className="result-success-icon">
            <CheckCircle2 size={25} />
          </div>

          <div>
            <div className="result-eyebrow">
              FORENSIC ANALYSIS COMPLETE
            </div>

            <h2>
              Verification Result
            </h2>
          </div>
        </div>

        <StatusBadge
          status={result.status}
        />
      </div>

      <div className="verification-check-grid">
        {checks.map((check) => {
          const Icon = check.icon;

          return (
            <div
              className={`verification-check ${
                check.valid
                  ? "check-valid"
                  : "check-invalid"
              }`}
              key={check.title}
            >
              <Icon size={19} />

              <div>
                <span>
                  {check.title}
                </span>

                <strong>
                  {check.value}
                </strong>
              </div>
            </div>
          );
        })}
      </div>

      <div className="result-hashes">
        <div>
          <span>
            Calculated SHA-256
          </span>

          <code>
            {result.calculated_hash}
          </code>
        </div>

        <div>
          <span>
            Recorded SHA-256
          </span>

          <code>
            {result.recorded_hash}
          </code>
        </div>
      </div>

      <div className="result-details">
        <div>
          <span>
            Transaction ID
          </span>

          <strong>
            {result.matched_transaction_id ||
              "Not found"}
          </strong>
        </div>

        <div>
          <span>
            Recipient
          </span>

          <strong>
            {result.matched_recipient_id ||
              "Unknown"}
          </strong>
        </div>
      </div>

      <div className="result-message">
        <ShieldCheck size={17} />

        <span>
          {result.message}
        </span>
      </div>
    </section>
  );
}

export default VerificationResult;