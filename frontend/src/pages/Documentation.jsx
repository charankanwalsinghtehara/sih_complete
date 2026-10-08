import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Code2,
  FileCheck2,
  Fingerprint,
  Hash,
  HelpCircle,
  LockKeyhole,
  Search,
  ShieldCheck,
  Terminal,
} from "lucide-react";

const sections = [
  {
    icon: BookOpen,
    title: "Getting started",
    description: "Understand the SecureTrace workspace and complete your first verification.",
    meta: "5 min read",
  },
  {
    icon: FileCheck2,
    title: "Document verification",
    description: "Learn how integrity checks, watermarks, and verification records work together.",
    meta: "7 min read",
  },
  {
    icon: Code2,
    title: "API reference",
    description: "Integrate document registration and verification into your own workflow.",
    meta: "Reference",
  },
  {
    icon: LockKeyhole,
    title: "Security model",
    description: "Review hashing, identity protection, local-first storage, and audit controls.",
    meta: "6 min read",
  },
];

const quickLinks = [
  { icon: Terminal, label: "CLI & API setup", detail: "Connect your first integration" },
  { icon: Hash, label: "SHA-256 integrity", detail: "Understand document fingerprints" },
  { icon: Fingerprint, label: "Watermark identities", detail: "Protect document ownership" },
];

function Documentation() {
  return (
    <div className="page documentation-page">
      <section className="documentation-hero">
        <div className="documentation-hero-copy">
          <div className="documentation-kicker">
            <BookOpen size={14} />
            SECURETRACE DOCUMENTATION
          </div>

          <h1>Everything you need to work securely.</h1>
          <p>
            Guides, reference material, and practical workflows for managing
            protected documents and verifying their integrity.
          </p>

          <div className="documentation-search">
            <Search size={17} />
            <input
              type="search"
              placeholder="Search guides, API reference, security..."
              aria-label="Search documentation"
            />
            <span className="search-shortcut">⌘ K</span>
          </div>
        </div>

        <div className="documentation-hero-mark" aria-hidden="true">
          <div className="docs-ring docs-ring-one" />
          <div className="docs-ring docs-ring-two" />
          <div className="docs-center-icon">
            <ShieldCheck size={35} />
          </div>
          <span className="docs-chip docs-chip-top">SHA-256</span>
          <span className="docs-chip docs-chip-bottom">VERIFIED</span>
        </div>
      </section>

      <div className="documentation-layout">
        <main>
          <div className="documentation-section-heading">
            <div>
              <p className="section-kicker">EXPLORE THE PLATFORM</p>
              <h2>Guides & reference</h2>
            </div>
            <span>Updated for v0.7.0</span>
          </div>

          <div className="documentation-card-grid">
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <button className="documentation-card" key={section.title}>
                  <div className="documentation-card-icon">
                    <Icon size={19} />
                  </div>
                  <div className="documentation-card-copy">
                    <div className="documentation-card-title">
                      <h3>{section.title}</h3>
                      <ChevronRight size={17} />
                    </div>
                    <p>{section.description}</p>
                    <span>{section.meta}</span>
                  </div>
                </button>
              );
            })}
          </div>

          <section className="documentation-callout">
            <div className="callout-icon">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <p className="section-kicker">RECOMMENDED PATH</p>
              <h3>Start with document verification</h3>
              <p>
                Register a document, inspect its integrity hash, then verify
                the record against the protected source.
              </p>
            </div>
            <button className="documentation-link-button">
              Open guide <ArrowRight size={15} />
            </button>
          </section>
        </main>

        <aside className="documentation-sidebar">
          <div className="documentation-side-panel">
            <p className="section-kicker">QUICK REFERENCE</p>
            <h3>Core concepts</h3>

            <div className="documentation-quick-links">
              {quickLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <button key={link.label} className="documentation-quick-link">
                    <span className="quick-link-icon"><Icon size={15} /></span>
                    <span>
                      <strong>{link.label}</strong>
                      <small>{link.detail}</small>
                    </span>
                    <ChevronRight size={14} />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="documentation-help-panel">
            <div className="help-icon">
              <HelpCircle size={17} />
            </div>
            <div>
              <strong>Need help?</strong>
              <p>Check the common questions before opening a support request.</p>
              <button>View FAQs <ArrowRight size={13} /></button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default Documentation;
