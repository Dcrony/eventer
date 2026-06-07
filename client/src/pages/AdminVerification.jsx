import { useEffect, useState } from "react";
import {
    AlertTriangle,
    CheckCircle2,
    Clock,
    Download,
    Eye,
    FileCheck,
    FileText,
    Filter,
    Mail,
    MessageSquare,
    RefreshCw,
    Search,
    Shield,
    X,
    XCircle,
    ZoomIn,
} from "lucide-react";
import AdminLayout from "../components/AdminLayout";
import { UserAvatar } from "../components/ui/avatar";
import adminService from "../services/adminService";
import { formatDate, formatNumber } from "../utils/adminUtils";
import { useToast } from "../components/ui/toast";

const STATUS_CONFIG = {
    pending:               { bg: "bg-amber-50",  text: "text-amber-700",  border: "border-amber-200",  dot: "bg-amber-400",  label: "Pending Review" },
    approved:              { bg: "bg-green-50",  text: "text-green-700",  border: "border-green-200",  dot: "bg-green-500",  label: "Verified" },
    rejected:              { bg: "bg-red-50",    text: "text-red-700",    border: "border-red-200",    dot: "bg-red-500",    label: "Rejected" },
    resubmitted:           { bg: "bg-blue-50",   text: "text-blue-700",   border: "border-blue-200",   dot: "bg-blue-500",   label: "Resubmitted" },
    resubmission_required: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200", dot: "bg-orange-400", label: "Needs Resubmission" },
    suspended:             { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200", dot: "bg-purple-500", label: "Suspended" },
    under_investigation:   { bg: "bg-violet-50", text: "text-violet-700", border: "border-violet-200", dot: "bg-violet-500", label: "Under Investigation" },
};

const getRiskColor = (score) => score >= 70 ? "text-red-600" : score >= 40 ? "text-amber-500" : "text-green-600";
const getRiskBar   = (score) => score >= 70 ? "bg-red-500"  : score >= 40 ? "bg-amber-400"  : "bg-green-500";

function StatusPill({ status, size = "md" }) {
    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
    const pad = size === "sm" ? "px-2 py-0.5 text-[0.58rem]" : "px-2.5 py-1 text-xs";
    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full border font-bold ${cfg.bg} ${cfg.text} ${cfg.border} ${pad}`}>
            <span className={`inline-block h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
            {cfg.label}
        </span>
    );
}

function StatCard({ icon: Icon, label, value, accent = "pink" }) {
    const colors = {
        pink:    { bar: "bg-pink-500",    icon: "bg-pink-50 text-pink-600"    },
        amber:   { bar: "bg-amber-400",   icon: "bg-amber-50 text-amber-600"  },
        emerald: { bar: "bg-green-500",   icon: "bg-green-50 text-green-600"  },
        purple:  { bar: "bg-purple-500",  icon: "bg-purple-50 text-purple-600"},
    };
    const c = colors[accent] || colors.pink;
    return (
        <div className="relative rounded-2xl border border-gray-100 bg-white p-4 overflow-hidden hover:border-pink-100 hover:shadow-md transition-all duration-200">
            <div className={`absolute top-0 left-0 right-0 h-0.5 ${c.bar}`} />
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-[0.6rem] font-bold uppercase tracking-widest text-gray-400">{label}</p>
                    <p className="mt-2 text-2xl font-black text-gray-900 tabular-nums">{value}</p>
                </div>
                <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${c.icon}`}>
                    <Icon size={16} />
                </div>
            </div>
        </div>
    );
}

function ActionModal({ isOpen, title, icon: Icon, iconBg = "bg-gray-100 text-gray-600", children, onClose }) {
    if (!isOpen) return null;
    return (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.4)", padding: "1rem" }}>
            <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white overflow-hidden shadow-2xl">
                <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/80 px-5 py-4">
                    <div className="flex items-center gap-2.5">
                        {Icon && (
                            <div className={`flex h-7 w-7 items-center justify-center rounded-xl ${iconBg}`}>
                                <Icon size={13} />
                            </div>
                        )}
                        <h2 className="text-sm font-bold text-gray-900">{title}</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="flex h-7 w-7 items-center justify-center rounded-xl text-gray-400 transition-colors hover:bg-pink-50 hover:text-pink-500"
                    >
                        <X size={14} />
                    </button>
                </div>
                <div className="p-5">{children}</div>
            </div>
        </div>
    );
}

function DocumentModal({ isOpen, doc, onClose }) {
    if (!isOpen || !doc) return null;
    const isPdf = doc.url?.toLowerCase().includes(".pdf");
    return (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.5)", padding: "1rem" }}>
            <div className="w-full max-w-2xl rounded-2xl border border-gray-100 bg-white overflow-hidden shadow-2xl">
                <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/80 px-5 py-3.5">
                    <div>
                        <p className="text-sm font-bold text-gray-900 truncate max-w-xs">{doc.filename || "Document"}</p>
                        <p className="text-[0.6rem] text-gray-400 mt-0.5">{doc.type}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <a
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-xl bg-pink-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-pink-600 transition-colors"
                        >
                            <Download size={12} />
                            Open
                        </a>
                        <button
                            onClick={onClose}
                            className="flex h-8 w-8 items-center justify-center rounded-xl text-gray-400 hover:bg-pink-50 hover:text-pink-500 transition-colors"
                        >
                            <X size={14} />
                        </button>
                    </div>
                </div>
                <div className="flex h-[460px] items-center justify-center bg-gray-50">
                    {isPdf ? (
                        <div className="text-center">
                            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white border border-gray-100 shadow-sm">
                                <FileText size={28} className="text-pink-300" />
                            </div>
                            <p className="text-sm text-gray-400 mb-4">PDF preview unavailable</p>
                            <a
                                href={doc.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 rounded-xl bg-pink-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-pink-600 transition-colors"
                            >
                                <Download size={14} />
                                Open PDF
                            </a>
                        </div>
                    ) : (
                        <img src={doc.url} alt={doc.filename} className="max-h-full max-w-full object-contain" />
                    )}
                </div>
            </div>
        </div>
    );
}

function ModalTextarea({ label, required, value, onChange, placeholder, rows = 4, maxLength = 500, focusColor = "focus:border-pink-400 focus:ring-pink-50" }) {
    return (
        <div>
            <label className="block text-[0.6rem] font-bold uppercase tracking-widest text-gray-400 mb-2">
                {label} {required && <span className="text-red-400">*</span>}
            </label>
            <textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                rows={rows}
                className={`w-full rounded-xl border border-gray-100 bg-gray-50 p-3 text-xs text-gray-800 placeholder-gray-300 outline-none resize-none transition focus:ring-2 ${focusColor}`}
            />
            {maxLength && <p className="mt-1 text-[0.58rem] text-gray-300 text-right">{value.length} / {maxLength}</p>}
        </div>
    );
}

function ModalActions({ onCancel, onConfirm, confirmLabel, confirmClass, loading, disabled }) {
    return (
        <div className="flex gap-2.5">
            <button
                onClick={onCancel}
                className="flex-1 h-9 rounded-xl border border-gray-200 text-xs font-bold text-gray-500 transition-colors hover:bg-gray-50 hover:border-gray-300"
            >
                Cancel
            </button>
            <button
                onClick={onConfirm}
                disabled={loading || disabled}
                className={`flex-1 h-9 rounded-xl text-xs font-bold text-white transition-colors disabled:opacity-50 ${confirmClass}`}
            >
                {loading ? "Working..." : confirmLabel}
            </button>
        </div>
    );
}

export default function AdminVerification() {
    const [verifications, setVerifications] = useState([]);
    const [selected, setSelected] = useState(null);
    const [loading, setLoading] = useState(false);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("pending");
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0, suspended: 0 });
    const [auditHistory, setAuditHistory] = useState([]);
    const toast = useToast();

    const [modals, setModals] = useState({ approve: false, reject: false, resubmit: false, suspend: false, doc: false });
    const [previewDoc, setPreviewDoc] = useState(null);
    const [rejectReason, setRejectReason] = useState("");
    const [resubmitInstructions, setResubmitInstructions] = useState("");
    const [suspendReason, setSuspendReason] = useState("");
    const [suspendNotes, setSuspendNotes] = useState("");
    const [actionLoading, setActionLoading] = useState(false);

    const LIMIT = 20;

    const openModal  = (key) => setModals((m) => ({ ...m, [key]: true }));
    const closeModal = (key) => setModals((m) => ({ ...m, [key]: false }));

    useEffect(() => { fetchVerifications(); }, [page, statusFilter]);

    const fetchVerifications = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await adminService.getVerifications(page, LIMIT, { status: statusFilter });
            setVerifications(data.items || []);
            setTotal(data.pagination?.total || 0);
            setStats({
                pending:   data.stats?.pending   || 0,
                approved:  data.stats?.approved  || 0,
                rejected:  data.stats?.rejected  || 0,
                suspended: data.stats?.suspended || 0,
            });
        } catch (err) {
            setError(err.response?.data?.message || "Failed to load verifications");
        } finally {
            setLoading(false);
        }
    };

    const fetchDetails = async (id) => {
        try {
            setDetailsLoading(true);
            const data = await adminService.getVerificationDetails(id);
            setSelected(data.verification);
            const historyData = await adminService.getVerificationAuditHistory(id);
            setAuditHistory(historyData.auditHistory || []);
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to load details");
        } finally {
            setDetailsLoading(false);
        }
    };

    const handleApprove = async () => {
        if (!selected) return;
        try {
            setActionLoading(true);
            await adminService.approveVerification(selected._id);
            toast.success("Verification approved.");
            closeModal("approve");
            await fetchDetails(selected._id);
            fetchVerifications();
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to approve");
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = async () => {
        if (!selected || !rejectReason.trim()) { toast.error("Rejection reason is required"); return; }
        try {
            setActionLoading(true);
            await adminService.rejectVerification(selected._id, rejectReason);
            toast.success("Verification rejected.");
            closeModal("reject");
            setRejectReason("");
            await fetchDetails(selected._id);
            fetchVerifications();
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to reject");
        } finally {
            setActionLoading(false);
        }
    };

    const handleResubmit = async () => {
        if (!selected || !resubmitInstructions.trim()) { toast.error("Instructions are required"); return; }
        try {
            setActionLoading(true);
            await adminService.requestResubmission(selected._id, resubmitInstructions);
            toast.success("Resubmission request sent.");
            closeModal("resubmit");
            setResubmitInstructions("");
            await fetchDetails(selected._id);
            fetchVerifications();
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to request resubmission");
        } finally {
            setActionLoading(false);
        }
    };

    const handleSuspend = async () => {
        if (!selected || !suspendReason.trim()) { toast.error("Suspension reason is required"); return; }
        try {
            setActionLoading(true);
            await adminService.suspendVerification(selected._id, suspendReason, suspendNotes);
            toast.success("Verification suspended.");
            closeModal("suspend");
            setSuspendReason("");
            setSuspendNotes("");
            await fetchDetails(selected._id);
            fetchVerifications();
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to suspend");
        } finally {
            setActionLoading(false);
        }
    };

    const filtered = verifications.filter((v) => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return v.organizer?.name?.toLowerCase().includes(q) || v.organizer?.email?.toLowerCase().includes(q);
    });

    const pages = Math.ceil(total / LIMIT) || 1;
    const isActionable = selected && ["pending", "resubmitted", "resubmission_required"].includes(selected.status);

    return (
        <AdminLayout
            title="Verification Management"
            description="Review, approve, and action organizer identity verification requests."
        >
            <div className="space-y-4">
                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                    <StatCard icon={Clock}        label="Pending Review" value={formatNumber(stats.pending)}   accent="amber"   />
                    <StatCard icon={CheckCircle2} label="Verified"       value={formatNumber(stats.approved)}  accent="emerald" />
                    <StatCard icon={XCircle}      label="Rejected"       value={formatNumber(stats.rejected)}  accent="pink"    />
                    <StatCard icon={Shield}       label="Suspended"      value={formatNumber(stats.suspended)} accent="purple"  />
                </div>

                {error && (
                    <div className="flex items-center gap-3 rounded-2xl border border-red-100 bg-red-50 p-4">
                        <AlertTriangle size={14} className="text-red-400 flex-shrink-0" />
                        <p className="flex-1 text-xs text-red-700">{error}</p>
                        <button onClick={() => setError(null)} className="text-red-300 hover:text-red-500 transition-colors">
                            <X size={13} />
                        </button>
                    </div>
                )}

                {/* Main grid */}
                <div className="grid gap-4 lg:grid-cols-5">
                    {/* List panel */}
                    <div className="lg:col-span-3">
                        <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden shadow-sm">
                            {/* Toolbar */}
                            <div className="flex flex-col gap-2.5 border-b border-gray-100 bg-gray-50/60 p-4 sm:flex-row">
                                <div className="relative flex-1">
                                    <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-pink-300 pointer-events-none" />
                                    <input
                                        type="text"
                                        placeholder="Search name or email..."
                                        value={search}
                                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                                        className="h-9 w-full rounded-xl border border-gray-100 bg-white pl-8 pr-4 text-xs text-gray-800 placeholder-gray-300 outline-none transition focus:border-pink-300 focus:ring-2 focus:ring-pink-50"
                                    />
                                </div>
                                <div className="relative flex-shrink-0">
                                    <Filter size={11} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-pink-300" />
                                    <select
                                        value={statusFilter}
                                        onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                                        className="h-9 rounded-xl border border-gray-100 bg-white pl-8 pr-8 text-xs font-medium text-gray-700 outline-none appearance-none focus:border-pink-300 focus:ring-2 focus:ring-pink-50"
                                    >
                                        <option value="">All Statuses</option>
                                        <option value="pending">Pending</option>
                                        <option value="approved">Verified</option>
                                        <option value="rejected">Rejected</option>
                                        <option value="resubmission_required">Needs Resubmission</option>
                                        <option value="suspended">Suspended</option>
                                    </select>
                                </div>
                                <button
                                    onClick={fetchVerifications}
                                    className="flex h-9 items-center gap-1.5 rounded-xl border border-gray-100 bg-white px-3 text-xs font-bold text-gray-500 transition-colors hover:border-pink-200 hover:text-pink-500"
                                >
                                    <RefreshCw size={11} />
                                    Refresh
                                </button>
                            </div>

                            {loading ? (
                                <div className="flex min-h-[240px] items-center justify-center p-5">
                                    <div className="text-center">
                                        <div className="mx-auto h-7 w-7 rounded-full border-2 border-pink-100 border-t-pink-500 animate-spin" />
                                        <p className="mt-2 text-xs text-gray-400">Loading verifications...</p>
                                    </div>
                                </div>
                            ) : filtered.length === 0 ? (
                                <div className="flex min-h-[240px] items-center justify-center p-5 text-center">
                                    <div>
                                        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-pink-50">
                                            <FileText size={20} className="text-pink-300" />
                                        </div>
                                        <p className="text-sm font-bold text-gray-700">No verifications found</p>
                                        <p className="mt-1 text-xs text-gray-400">Try adjusting the status filter</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-4 space-y-2">
                                    {filtered.map((v) => {
                                        const isActive = selected?._id === v._id;
                                        return (
                                            <button
                                                key={v._id}
                                                onClick={() => fetchDetails(v._id)}
                                                className={`w-full rounded-xl border p-3.5 text-left transition-all group ${
                                                    isActive
                                                        ? "border-pink-200 bg-pink-50"
                                                        : "border-gray-100 bg-white hover:border-pink-100 hover:bg-pink-50/30"
                                                }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <UserAvatar user={v.organizer} size={36} />
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center justify-between gap-2">
                                                            <p className="text-xs font-bold text-gray-900 truncate">{v.organizer?.name}</p>
                                                            <StatusPill status={v.status} size="sm" />
                                                        </div>
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            <p className="text-[0.58rem] text-gray-400 truncate">{v.organizer?.email}</p>
                                                            {v.documents?.length > 0 && (
                                                                <span className="text-[0.55rem] font-bold text-gray-300 flex-shrink-0">
                                                                    {v.documents.length} doc{v.documents.length !== 1 ? "s" : ""}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <Eye size={12} className={`flex-shrink-0 transition-colors ${isActive ? "text-pink-500" : "text-gray-200 group-hover:text-pink-300"}`} />
                                                </div>
                                                <p className="mt-1.5 pl-[48px] text-[0.55rem] text-gray-300">{formatDate(v.createdAt)}</p>
                                            </button>
                                        );
                                    })}

                                    {/* Pagination */}
                                    <div className="flex items-center justify-between border-t border-gray-100 pt-3 mt-2">
                                        <p className="text-xs text-gray-400">
                                            <span className="font-bold text-gray-700">{total}</span> total
                                        </p>
                                        <div className="flex items-center gap-1.5">
                                            <button
                                                onClick={() => setPage(Math.max(1, page - 1))}
                                                disabled={page === 1}
                                                className="inline-flex items-center h-8 px-3 rounded-xl border border-gray-100 text-xs font-bold text-gray-500 hover:border-pink-200 hover:text-pink-500 disabled:opacity-40 transition-colors"
                                            >
                                                Prev
                                            </button>
                                            <span className="text-xs text-gray-400 tabular-nums px-1">{page} / {pages}</span>
                                            <button
                                                onClick={() => setPage(Math.min(pages, page + 1))}
                                                disabled={page === pages}
                                                className="inline-flex items-center h-8 px-3 rounded-xl border border-gray-100 text-xs font-bold text-gray-500 hover:border-pink-200 hover:text-pink-500 disabled:opacity-40 transition-colors"
                                            >
                                                Next
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Detail panel */}
                    <div className="lg:col-span-2">
                        <div className="sticky top-4 rounded-2xl border border-gray-100 bg-white overflow-hidden shadow-sm">
                            {!selected ? (
                                <div className="flex min-h-[360px] items-center justify-center p-5 text-center">
                                    <div>
                                        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-pink-50">
                                            <Eye size={20} className="text-pink-300" />
                                        </div>
                                        <p className="text-sm font-bold text-gray-700">Select a request</p>
                                        <p className="mt-1 text-xs text-gray-400">Click any verification to review</p>
                                    </div>
                                </div>
                            ) : detailsLoading ? (
                                <div className="flex min-h-[360px] items-center justify-center p-5">
                                    <div className="text-center">
                                        <div className="mx-auto h-7 w-7 rounded-full border-2 border-pink-100 border-t-pink-500 animate-spin" />
                                        <p className="mt-2 text-xs text-gray-400">Loading details...</p>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {/* Status bar */}
                                    <div className={`flex items-center justify-between gap-3 border-b px-5 py-3 ${STATUS_CONFIG[selected.status]?.bg || "bg-gray-50"} ${STATUS_CONFIG[selected.status]?.border || "border-gray-100"}`}>
                                        <StatusPill status={selected.status} />
                                        <p className="text-[0.58rem] font-bold text-gray-400">{formatDate(selected.createdAt)}</p>
                                    </div>

                                    <div className="max-h-[calc(100vh-240px)] overflow-y-auto p-5 space-y-5">
                                        {/* Organizer */}
                                        <div className="flex items-center gap-3">
                                            <UserAvatar user={selected.organizer} size={44} />
                                            <div className="min-w-0">
                                                <p className="font-bold text-gray-900 text-sm">{selected.organizer?.name}</p>
                                                <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                                                    <Mail size={10} />
                                                    {selected.organizer?.email}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Risk score */}
                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <p className="text-[0.6rem] font-bold uppercase tracking-widest text-gray-400">Risk Score</p>
                                                <span className={`text-xs font-bold ${getRiskColor(selected.risk_score || 0)}`}>
                                                    {(selected.risk_score || 0) >= 70 ? "High Risk" : (selected.risk_score || 0) >= 40 ? "Medium Risk" : "Low Risk"}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="h-1.5 flex-1 rounded-full bg-gray-100 overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full transition-all duration-700 ${getRiskBar(selected.risk_score || 0)}`}
                                                        style={{ width: `${Math.min(100, selected.risk_score || 0)}%` }}
                                                    />
                                                </div>
                                                <span className={`text-sm font-black tabular-nums ${getRiskColor(selected.risk_score || 0)}`}>
                                                    {selected.risk_score || 0}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Documents */}
                                        {selected.documents?.length > 0 && (
                                            <div>
                                                <p className="text-[0.6rem] font-bold uppercase tracking-widest text-gray-400 mb-2">
                                                    Documents · {selected.documents.length}
                                                </p>
                                                <div className="space-y-1.5">
                                                    {selected.documents.map((doc, idx) => (
                                                        <button
                                                            key={idx}
                                                            onClick={() => { setPreviewDoc(doc); openModal("doc"); }}
                                                            className="group w-full rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5 text-left transition-all hover:border-pink-100 hover:bg-pink-50/40"
                                                        >
                                                            <div className="flex items-center gap-2.5">
                                                                <div className="flex h-7 w-7 items-center justify-center rounded-xl border border-gray-100 bg-white flex-shrink-0">
                                                                    <FileText size={12} className="text-gray-300 group-hover:text-pink-400 transition-colors" />
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-xs font-bold text-gray-800 truncate">{doc.filename || `Document ${idx + 1}`}</p>
                                                                    <p className="text-[0.55rem] text-gray-400">{doc.type}</p>
                                                                </div>
                                                                <ZoomIn size={11} className="text-gray-200 group-hover:text-pink-400 flex-shrink-0 transition-colors" />
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Submission info */}
                                        <div>
                                            <p className="text-[0.6rem] font-bold uppercase tracking-widest text-gray-400 mb-2">Submission Info</p>
                                            <div className="divide-y divide-gray-50 rounded-xl border border-gray-100 overflow-hidden">
                                                <div className="flex justify-between items-center px-3 py-2 bg-gray-50/40">
                                                    <span className="text-xs text-gray-400">Submitted</span>
                                                    <span className="text-xs font-bold text-gray-800">{formatDate(selected.createdAt)}</span>
                                                </div>
                                                {selected.reviewedAt && (
                                                    <div className="flex justify-between items-center px-3 py-2 bg-gray-50/40">
                                                        <span className="text-xs text-gray-400">Reviewed</span>
                                                        <span className="text-xs font-bold text-gray-800">{formatDate(selected.reviewedAt)}</span>
                                                    </div>
                                                )}
                                                {selected.submission_ip && (
                                                    <div className="flex justify-between items-center px-3 py-2 bg-gray-50/40">
                                                        <span className="text-xs text-gray-400">IP Address</span>
                                                        <span className="font-mono text-xs text-gray-600">{selected.submission_ip}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Contextual messages */}
                                        {selected.notes && (
                                            <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-3">
                                                <p className="text-[0.6rem] font-bold uppercase tracking-widest text-blue-500 flex items-center gap-1 mb-1.5">
                                                    <MessageSquare size={9} /> Admin Notes
                                                </p>
                                                <p className="text-xs text-blue-700 leading-relaxed">{selected.notes}</p>
                                            </div>
                                        )}
                                        {selected.rejectionReason && (
                                            <div className="rounded-xl border border-red-100 bg-red-50/60 p-3">
                                                <p className="text-[0.6rem] font-bold uppercase tracking-widest text-red-500 flex items-center gap-1 mb-1.5">
                                                    <XCircle size={9} /> Rejection Reason
                                                </p>
                                                <p className="text-xs text-red-700 leading-relaxed">{selected.rejectionReason}</p>
                                            </div>
                                        )}
                                        {selected.resubmissionInstructions && (
                                            <div className="rounded-xl border border-amber-100 bg-amber-50/60 p-3">
                                                <p className="text-[0.6rem] font-bold uppercase tracking-widest text-amber-600 flex items-center gap-1 mb-1.5">
                                                    <AlertTriangle size={9} /> Resubmission Required
                                                </p>
                                                <p className="text-xs text-amber-700 leading-relaxed whitespace-pre-wrap">{selected.resubmissionInstructions}</p>
                                            </div>
                                        )}

                                        {/* Audit trail */}
                                        {auditHistory.length > 0 && (
                                            <div>
                                                <p className="text-[0.6rem] font-bold uppercase tracking-widest text-gray-400 mb-3">Audit Trail</p>
                                                <div className="space-y-2">
                                                    {auditHistory.slice(0, 5).map((entry, idx) => (
                                                        <div key={idx} className="flex gap-3 rounded-xl border border-gray-100 bg-gray-50/60 px-3 py-2.5">
                                                            <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-pink-100 text-[0.55rem] font-black text-pink-600">
                                                                {entry.action?.[0]?.toUpperCase() || "?"}
                                                            </div>
                                                            <div className="min-w-0 flex-1">
                                                                <p className="text-xs font-bold text-gray-800 capitalize">{entry.action?.replace(/_/g, " ").toLowerCase()}</p>
                                                                {entry.details && <p className="text-[0.58rem] text-gray-400 mt-0.5 truncate">{entry.details}</p>}
                                                                <p className="text-[0.55rem] text-gray-300 mt-0.5">{formatDate(entry.createdAt)}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Action buttons */}
                                        {isActionable && (
                                            <div className="space-y-2 border-t border-gray-100 pt-4">
                                                <p className="text-[0.6rem] font-bold uppercase tracking-widest text-gray-400 mb-3">Actions</p>
                                                <button
                                                    onClick={() => openModal("approve")}
                                                    className="flex h-9 w-full items-center justify-center gap-2 rounded-xl bg-green-500 text-xs font-bold text-white hover:bg-green-600 transition-colors"
                                                >
                                                    <CheckCircle2 size={13} /> Approve Verification
                                                </button>
                                                <button
                                                    onClick={() => openModal("reject")}
                                                    className="flex h-9 w-full items-center justify-center gap-2 rounded-xl bg-red-500 text-xs font-bold text-white hover:bg-red-600 transition-colors"
                                                >
                                                    <XCircle size={13} /> Reject Verification
                                                </button>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <button
                                                        onClick={() => openModal("resubmit")}
                                                        className="flex h-9 items-center justify-center gap-1.5 rounded-xl bg-amber-400 text-xs font-bold text-white hover:bg-amber-500 transition-colors"
                                                    >
                                                        <RefreshCw size={11} /> Resubmit
                                                    </button>
                                                    <button
                                                        onClick={() => openModal("suspend")}
                                                        className="flex h-9 items-center justify-center gap-1.5 rounded-xl bg-purple-500 text-xs font-bold text-white hover:bg-purple-600 transition-colors"
                                                    >
                                                        <AlertTriangle size={11} /> Suspend
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Approve Modal */}
            <ActionModal isOpen={modals.approve} title="Approve Verification" icon={CheckCircle2} iconBg="bg-green-100 text-green-600" onClose={() => closeModal("approve")}>
                <div className="space-y-4">
                    <div className="rounded-xl border border-green-100 bg-green-50/60 p-4">
                        <p className="text-xs text-green-800 leading-relaxed">
                            The organizer will be notified and can immediately publish events and access payouts.
                        </p>
                    </div>
                    <ModalActions onCancel={() => closeModal("approve")} onConfirm={handleApprove} confirmLabel="Confirm Approval" confirmClass="bg-green-500 hover:bg-green-600" loading={actionLoading} />
                </div>
            </ActionModal>

            {/* Reject Modal */}
            <ActionModal isOpen={modals.reject} title="Reject Verification" icon={XCircle} iconBg="bg-red-100 text-red-600" onClose={() => { closeModal("reject"); setRejectReason(""); }}>
                <div className="space-y-4">
                    <ModalTextarea label="Reason for rejection" required value={rejectReason} onChange={setRejectReason} placeholder="Explain why this verification is being rejected. This will be sent to the organizer." focusColor="focus:border-red-300 focus:ring-red-50" />
                    <ModalActions onCancel={() => { closeModal("reject"); setRejectReason(""); }} onConfirm={handleReject} confirmLabel="Reject" confirmClass="bg-red-500 hover:bg-red-600" loading={actionLoading} disabled={!rejectReason.trim()} />
                </div>
            </ActionModal>

            {/* Resubmit Modal */}
            <ActionModal isOpen={modals.resubmit} title="Request Resubmission" icon={RefreshCw} iconBg="bg-amber-100 text-amber-600" onClose={() => { closeModal("resubmit"); setResubmitInstructions(""); }}>
                <div className="space-y-4">
                    <ModalTextarea label="Resubmission instructions" required value={resubmitInstructions} onChange={setResubmitInstructions} placeholder="List which documents are missing, unclear, or need re-uploading..." focusColor="focus:border-amber-300 focus:ring-amber-50" />
                    <ModalActions onCancel={() => { closeModal("resubmit"); setResubmitInstructions(""); }} onConfirm={handleResubmit} confirmLabel="Send Request" confirmClass="bg-amber-500 hover:bg-amber-600" loading={actionLoading} disabled={!resubmitInstructions.trim()} />
                </div>
            </ActionModal>

            {/* Suspend Modal */}
            <ActionModal isOpen={modals.suspend} title="Suspend for Investigation" icon={AlertTriangle} iconBg="bg-purple-100 text-purple-600" onClose={() => { closeModal("suspend"); setSuspendReason(""); setSuspendNotes(""); }}>
                <div className="space-y-4">
                    <ModalTextarea label="Suspension reason" required value={suspendReason} onChange={setSuspendReason} placeholder="Why is this verification being suspended?" rows={3} focusColor="focus:border-purple-300 focus:ring-purple-50" />
                    <ModalTextarea label="Internal notes (optional)" value={suspendNotes} onChange={setSuspendNotes} placeholder="Internal investigation notes, not visible to the organizer..." rows={3} maxLength={null} focusColor="focus:border-purple-300 focus:ring-purple-50" />
                    <ModalActions onCancel={() => { closeModal("suspend"); setSuspendReason(""); setSuspendNotes(""); }} onConfirm={handleSuspend} confirmLabel="Suspend" confirmClass="bg-purple-500 hover:bg-purple-600" loading={actionLoading} disabled={!suspendReason.trim()} />
                </div>
            </ActionModal>

            {/* Document Modal */}
            <DocumentModal isOpen={modals.doc} doc={previewDoc} onClose={() => closeModal("doc")} />
        </AdminLayout>
    );
}