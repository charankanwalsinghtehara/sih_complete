import { useMemo, useState } from "react";
import {
  FileText,
  Search,
  ShieldCheck,
  ShieldAlert,
  Upload,
  MoreHorizontal,
  Eye,
  Fingerprint,
  Clock3,
  UserRound,
  Hash,
  CheckCircle2,
  AlertTriangle,
  FileCheck2,
  Filter,
  ChevronDown,
  X,
  Plus,
  ArrowUpRight,
} from "lucide-react";

const initialDocuments = [
  { id: "DOC-001", name: "Financial_Report_2026.pdf", owner: "Finance Department", type: "PDF Document", size: "2.4 MB", status: "Verified", hash: "a84f91...72c1", updated: "Today, 10:42 AM", watermark: "WM-FIN-001" },
  { id: "DOC-002", name: "Employee_Records.pdf", owner: "HR Department", type: "PDF Document", size: "1.8 MB", status: "Verified", hash: "4b91ac...18fe", updated: "Today, 09:18 AM", watermark: "WM-HR-014" },
  { id: "DOC-003", name: "Contract_Agreement.pdf", owner: "Legal Department", type: "PDF Document", size: "3.1 MB", status: "Suspicious", hash: "c91d20...55aa", updated: "Yesterday, 04:32 PM", watermark: "WM-LGL-007" },
  { id: "DOC-004", name: "Research_Data_2026.pdf", owner: "Research Department", type: "PDF Document", size: "4.7 MB", status: "Verified", hash: "8f72bc...11da", updated: "Yesterday, 02:14 PM", watermark: "WM-RSH-023" },
  { id: "DOC-005", name: "Security_Policy.pdf", owner: "Security Department", type: "PDF Document", size: "1.2 MB", status: "Verified", hash: "b271aa...94ce", updated: "Sep 24, 2026", watermark: "WM-SEC-031" },
];

export default function Documents() {
  const [documents, setDocuments] = useState(initialDocuments);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selected, setSelected] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [menuId, setMenuId] = useState(null);
  const [toast, setToast] = useState("");

  const filteredDocuments = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return documents.filter((document) => {
      const matchesQuery = !normalized || [document.name, document.id, document.owner, document.hash, document.watermark]
        .some((value) => value.toLowerCase().includes(normalized));
      const matchesStatus = statusFilter === "All" || document.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [documents, query, statusFilter]);

  const verified = documents.filter((document) => document.status === "Verified").length;
  const suspicious = documents.filter((document) => document.status === "Suspicious").length;

  const flash = (message) => {
    setToast(message);
    window.clearTimeout(window.__secureTraceToast);
    window.__secureTraceToast = window.setTimeout(() => setToast(""), 2600);
  };

  const verifyDocument = (document) => {
    if (document.status === "Verified") {
      flash(`${document.id} integrity is already verified.`);
      return;
    }
    setDocuments((current) => current.map((item) => item.id === document.id ? { ...item, status: "Verified", updated: "Just now" } : item));
    flash(`${document.id} marked as verified after integrity review.`);
  };

  const createDocument = (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") || "").trim();
    const owner = String(form.get("owner") || "").trim();
    if (!name || !owner) return;
    const nextNumber = documents.length + 1;
    const next = {
      id: `DOC-${String(nextNumber).padStart(3, "0")}`,
      name: name.endsWith(".pdf") ? name : `${name}.pdf`,
      owner,
      type: "PDF Document",
      size: "Pending",
      status: "Verified",
      hash: "pending...record",
      updated: "Just now",
      watermark: `WM-NEW-${String(nextNumber).padStart(3, "0")}`,
    };
    setDocuments((current) => [next, ...current]);
    setShowCreate(false);
    event.currentTarget.reset();
    flash(`${next.id} was added to the protected registry.`);
  };

  return (
    <div className="page documents-page" onClick={() => menuId && setMenuId(null)}>
      <section className="documents-hero">
        <div className="documents-hero-copy">
          <div className="documents-title-row">
            <div className="documents-title-icon"><FileText size={23} /></div>
            <div>
              <p className="eyebrow">SECURE DOCUMENT REGISTRY</p>
              <h1>Documents</h1>
            </div>
          </div>
          <p className="page-description">
            Manage protected documents, watermark identities, integrity hashes, and verification records from one secure workspace.
          </p>
          <div className="documents-hero-meta">
            <span><ShieldCheck size={14} /> SHA-256 integrity enabled</span>
            <span><Fingerprint size={14} /> Watermark identity active</span>
          </div>
        </div>
        <button className="primary-button document-upload-button" onClick={() => setShowCreate(true)}>
          <Upload size={17} /> Issue New Document
        </button>
      </section>

      <div className="document-summary-grid">
        <SummaryCard icon={FileText} label="Total Documents" value={documents.length} description="Registered documents" tone="blue" />
        <SummaryCard icon={ShieldCheck} label="Verified" value={verified} description="Integrity confirmed" tone="green" />
        <SummaryCard icon={ShieldAlert} label="Suspicious" value={suspicious} description="Requires investigation" tone="orange" />
        <SummaryCard icon={Fingerprint} label="Watermarked" value={documents.length} description="Identity protected" tone="purple" />
      </div>

      <section className="documents-registry-panel">
        <div className="documents-toolbar">
          <label className="document-search">
            <Search size={17} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} type="search" placeholder="Search name, ID, owner or hash..." aria-label="Search documents" />
            {query && <button type="button" className="clear-search" onClick={() => setQuery("")} aria-label="Clear search"><X size={14} /></button>}
          </label>
          <div className="document-filter-wrap" onClick={(event) => event.stopPropagation()}>
            <button type="button" className="document-filter-button" onClick={() => setStatusFilter(statusFilter === "All" ? "Verified" : statusFilter === "Verified" ? "Suspicious" : "All")}>
              <Filter size={15} /> {statusFilter === "All" ? "All Status" : statusFilter} <ChevronDown size={14} />
            </button>
          </div>
          <span className="document-result-count">{filteredDocuments.length} of {documents.length} records</span>
        </div>

        <div className="documents-section-header">
          <div>
            <p className="eyebrow">DOCUMENT REGISTRY</p>
            <h2>Protected Documents</h2>
            <p>Every record is linked to a SHA-256 integrity fingerprint and watermark identity.</p>
          </div>
          <div className="registry-live"><span /> Live registry</div>
        </div>

        {filteredDocuments.length ? (
          <div className="document-card-grid">
            {filteredDocuments.map((document) => (
              <DocumentCard
                key={document.id}
                document={document}
                menuOpen={menuId === document.id}
                onMenu={(event) => { event.stopPropagation(); setMenuId(menuId === document.id ? null : document.id); }}
                onView={() => { setSelected(document); setMenuId(null); }}
                onVerify={() => { verifyDocument(document); setMenuId(null); }}
              />
            ))}
          </div>
        ) : (
          <div className="documents-empty-state">
            <Search size={26} />
            <h3>No documents found</h3>
            <p>Try another search term or reset the status filter.</p>
            <button type="button" className="secondary-action" onClick={() => { setQuery(""); setStatusFilter("All"); }}>Reset filters</button>
          </div>
        )}
      </section>

      {toast && <div className="document-toast" role="status"><CheckCircle2 size={16} /> {toast}</div>}

      {selected && (
        <div className="document-modal-backdrop" onClick={() => setSelected(null)}>
          <section className="document-modal" role="dialog" aria-modal="true" aria-labelledby="document-modal-title" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <div><p className="eyebrow">DOCUMENT RECORD</p><h2 id="document-modal-title">{selected.name}</h2></div>
              <button type="button" className="modal-close" onClick={() => setSelected(null)} aria-label="Close"><X size={18} /></button>
            </div>
            <div className="modal-status-line"><StatusBadge status={selected.status} /><span>{selected.id}</span><span>{selected.size}</span></div>
            <div className="modal-detail-grid">
              <Detail label="Owner" value={selected.owner} icon={UserRound} />
              <Detail label="Watermark" value={selected.watermark} icon={Fingerprint} />
              <Detail label="SHA-256" value={selected.hash} icon={Hash} />
              <Detail label="Last updated" value={selected.updated} icon={Clock3} />
            </div>
            <div className="modal-integrity"><ShieldCheck size={18} /><div><strong>Integrity record</strong><p>This document is associated with a protected verification record. The visible hash is the registry fingerprint.</p></div></div>
            <div className="modal-actions"><button type="button" className="secondary-action" onClick={() => setSelected(null)}>Close</button><button type="button" className="verify-action verified-action" onClick={() => { verifyDocument(selected); setSelected({ ...selected, status: "Verified", updated: "Just now" }); }}><FileCheck2 size={15} /> Verify record</button></div>
          </section>
        </div>
      )}

      {showCreate && (
        <div className="document-modal-backdrop" onClick={() => setShowCreate(false)}>
          <form className="document-modal create-modal" onSubmit={createDocument} onClick={(event) => event.stopPropagation()}>
            <div className="modal-header"><div><p className="eyebrow">NEW REGISTRY RECORD</p><h2>Issue document</h2></div><button type="button" className="modal-close" onClick={() => setShowCreate(false)} aria-label="Close"><X size={18} /></button></div>
            <p className="modal-intro">Create a protected demo record with a watermark identity and integrity placeholder.</p>
            <label className="modal-field"><span>Document name</span><input name="name" placeholder="e.g. Board_Report_2026.pdf" autoFocus required /></label>
            <label className="modal-field"><span>Owner / department</span><input name="owner" placeholder="e.g. Legal Department" required /></label>
            <div className="modal-actions"><button type="button" className="secondary-action" onClick={() => setShowCreate(false)}>Cancel</button><button type="submit" className="primary-button"><Plus size={15} /> Add to registry</button></div>
          </form>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value, description, tone }) {
  return <div className={`document-summary-card ${tone}`}><div className="summary-card-top"><div className="summary-icon"><Icon size={19} /></div><span className="summary-card-dot" /></div><div className="summary-value">{value}</div><div className="summary-label">{label}</div><div className="summary-description">{description}</div></div>;
}

function StatusBadge({ status }) {
  const verified = status === "Verified";
  return <span className={`document-status ${verified ? "verified" : "suspicious"}`}>{verified ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}{status}</span>;
}

function Detail({ label, value, icon: Icon }) {
  return <div className="modal-detail"><Icon size={15} /><span>{label}</span><strong>{value}</strong></div>;
}

function DocumentCard({ document, menuOpen, onMenu, onView, onVerify }) {
  const isVerified = document.status === "Verified";
  return <article className={`document-card ${isVerified ? "document-verified" : "document-suspicious"}`}>
    <div className="document-card-top"><div className="document-file-icon"><FileText size={21} /></div><div className="document-menu"><button type="button" className="document-more-button" aria-label={`Options for ${document.name}`} onClick={onMenu}><MoreHorizontal size={18} /></button>{menuOpen && <div className="document-menu-popover"><button type="button" onClick={onView}><Eye size={14} /> View details</button><button type="button" onClick={onVerify}><FileCheck2 size={14} /> {isVerified ? "Run verification" : "Investigate"}</button></div>}</div></div>
    <div className="document-card-info"><div className="document-type">{document.type}</div><h3 title={document.name}>{document.name}</h3><div className="document-id">{document.id}</div></div>
    <div className="document-status-row"><StatusBadge status={document.status} /><span className="document-size">{document.size}</span></div>
    <div className="document-metadata"><Meta icon={UserRound} label="Owner" value={document.owner} /><Meta icon={Fingerprint} label="Watermark" value={document.watermark} /><Meta icon={Hash} label="SHA-256" value={document.hash} /><Meta icon={Clock3} label="Last updated" value={document.updated} /></div>
    <div className="document-card-actions"><button type="button" className="secondary-action" onClick={onView}><Eye size={15} /> View details</button><button type="button" className={`verify-action ${isVerified ? "verified-action" : "warning-action"}`} onClick={onVerify}><FileCheck2 size={15} /> {isVerified ? "Verify" : "Investigate"}</button></div>
    <div className="document-card-footer"><span><ShieldCheck size={12} /> Protected record</span><ArrowUpRight size={13} /></div>
  </article>;
}

function Meta({ icon: Icon, label, value }) {
  return <div className="metadata-item"><Icon size={13} /><div><span>{label}</span><strong>{value}</strong></div></div>;
}
