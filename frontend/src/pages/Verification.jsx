import {
  Fingerprint,
  FileSearch,
  ShieldCheck,
  Wrench
} from "lucide-react";

import { useState } from "react";

import FileDropzone from "../components/FileDropzone";
import VerificationResult from "../components/VerificationResult";

import {
  verifyDocument
} from "../services/api";

function Verification() {
  const [file, setFile] =
    useState(null);

  const [watermarkId, setWatermarkId] =
    useState("");

  const [result, setResult] =
    useState(null);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const verify = async () => {
    if (!file) {
      setError(
        "Select the suspected evidence document."
      );

      return;
    }

    if (!watermarkId.trim()) {
      setError(
        "Enter the watermark identifier."
      );

      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response =
        await verifyDocument(
          file,
          watermarkId
        );

      setResult(response);
    } catch (verificationError) {
      setError(
        verificationError.message ||
          "Verification failed."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-heading-large">
        <div>
          <div className="section-kicker">
            FORENSIC ANALYSIS
          </div>

          <h1>
            Evidence Verification
          </h1>

          <p>
            Determine whether a document matches its issued
            watermark, cryptographic hash and blockchain record.
          </p>
        </div>
      </div>

      <div className="verification-layout">
        <section className="professional-card">
          <div className="card-heading">
            <div className="card-heading-icon purple">
              <FileSearch size={19} />
            </div>

            <div>
              <h2>
                Verification Input
              </h2>

              <p>
                Submit the evidence for forensic comparison.
              </p>
            </div>
          </div>

          <div className="verification-methods">
            <div className="method-card active">
              <Fingerprint size={19} />

              <div>
                <strong>
                  SHA-256
                </strong>

                <span>
                  Content integrity
                </span>
              </div>
            </div>

            <div className="method-card active">
              <ShieldCheck size={19} />

              <div>
                <strong>
                  Watermark
                </strong>

                <span>
                  Issued identity
                </span>
              </div>
            </div>

            <div className="method-card active">
              <Wrench size={19} />

              <div>
                <strong>
                  Recovery
                </strong>

                <span>
                  Error correction
                </span>
              </div>
            </div>
          </div>

          <FileDropzone
            file={file}
            onFileSelected={setFile}
          />

          <label className="professional-field">
            <span>
              Watermark Identifier
            </span>

            <div className="input-with-icon">
              <Fingerprint size={16} />

              <input
                value={watermarkId}
                onChange={(event) =>
                  setWatermarkId(
                    event.target.value
                  )
                }
                placeholder="WM-FORENSIC-001"
              />
            </div>
          </label>

          {error && (
            <div className="error-banner">
              {error}
            </div>
          )}

          <button
            className="primary-action verification-action"
            disabled={loading}
            onClick={verify}
          >
            <ShieldCheck size={18} />

            {loading
              ? "Running Forensic Analysis..."
              : "Run Forensic Verification"}
          </button>

          <div className="verification-note">
            <ShieldCheck size={14} />

            <span>
              Verification compares the submitted
              evidence against registered SecureTrace records.
            </span>
          </div>
        </section>

        <section className="analysis-preview">
          <div className="analysis-header">
            <div>
              <div className="section-kicker">
                VERIFICATION PIPELINE
              </div>

              <h2>
                Multi-Layer Integrity Check
              </h2>
            </div>
          </div>

          <div className="pipeline">
            <PipelineStep
              number="01"
              title="Identify"
              description="Extract document watermark"
              icon={Fingerprint}
            />

            <div className="pipeline-line" />

            <PipelineStep
              number="02"
              title="Hash"
              description="Calculate SHA-256"
              icon={FileSearch}
            />

            <div className="pipeline-line" />

            <PipelineStep
              number="03"
              title="Validate"
              description="Query blockchain record"
              icon={ShieldCheck}
            />

            <div className="pipeline-line" />

            <PipelineStep
              number="04"
              title="Recover"
              description="Attempt redundancy recovery"
              icon={Wrench}
            />
          </div>
        </section>
      </div>

      <VerificationResult
        result={result}
      />
    </div>
  );
}

function PipelineStep({
  number,
  title,
  description,
  icon: Icon
}) {
  return (
    <div className="pipeline-step">
      <div className="pipeline-icon">
        <Icon size={18} />
      </div>

      <div className="pipeline-number">
        {number}
      </div>

      <strong>
        {title}
      </strong>

      <span>
        {description}
      </span>
    </div>
  );
}

export default Verification;