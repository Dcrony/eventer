import { useEffect, useState } from "react";
import {
    Search,
    ChevronLeft,
    ChevronRight,
    AlertCircle,
    CheckCircle2,
    XCircle,
    Clock,
    Eye,
    FileText,
    MessageSquare,
    User,
    Mail,
    Calendar,
    FileCheck,
    ZoomIn,
    Download,
    X,
    AlertTriangle,
    RefreshCw,
} from "lucide-react";
import AdminLayout from "../components/AdminLayout";
import { UserAvatar } from "../components/ui/avatar";
import adminService from "../services/adminService";
import { formatDate, formatNumber, getStatusTone } from "../utils/adminUtils";
import { useToast } from "../components/ui/toast";

// Reusable components
function StatCard({ icon: Icon, label, value, detail }) {
    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">{label}</p>
                    <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
                </div>
                {Icon && (
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-pink-50 text-pink-500">
                        <Icon size={18} />
                    </div>
                )}
            </div>
            {detail && <p className="mt-3 text-xs text-gray-500">{detail}</p>}
        </div>
    );
}

function SurfaceCard({ children, className = "" }) {
    return (
        <div className={`rounded-2xl border border-gray-200 bg-white p-5 shadow-sm ${className}`.trim()}>
            {children}
        </div>
    );
}

function LoadingSpinner({ label = "Loading..." }) {
    return (
        <div className="flex min-h-[240px] items-center justify-center rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="text-center">
                <div className="mx-auto h-8 w-8 border-3 border-pink-200 border-t-pink-500 rounded-full animate-spin" />
                <p className="mt-3 text-sm text-gray-500">{label}</p>
            </div>
        </div>
    );
}

function ErrorMessage({ message, onDismiss }) {
    return (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700 shadow-sm">
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                    <AlertCircle size={18} />
                    <span className="text-sm font-semibold">Error</span>
                </div>
                <button
                    onClick={onDismiss}
                    className="text-red-600 hover:text-red-800"
                >
                    <X size={16} />
                </button>
            </div>
            <p className="mt-2 text-sm">{message}</p>
        </div>
    );
}

function StatusBadge({ status }) {
    const statusConfig = {
        pending: { bg: "bg-amber-50", text: "text-amber-700", label: "Pending Review" },
        approved: { bg: "bg-green-50", text: "text-green-700", label: "Verified" },
        rejected: { bg: "bg-red-50", text: "text-red-700", label: "Rejected" },
        resubmitted: { bg: "bg-blue-50", text: "text-blue-700", label: "Resubmitted" },
        resubmission_required: { bg: "bg-amber-50", text: "text-amber-700", label: "Resubmission Required" },
        suspended: { bg: "bg-red-50", text: "text-red-700", label: "Suspended" },
        under_investigation: { bg: "bg-purple-50", text: "text-purple-700", label: "Under Investigation" },
    };

    const config = statusConfig[status] || statusConfig.pending;
    return (
        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${config.bg} ${config.text}`}>
            {config.label}
        </span>
    );
}

function PaginationControls({ page, pages, onPrevious, onNext, total, label = "items" }) {
    return (
        <div className="flex items-center justify-between border-t border-gray-200 pt-4 mt-4">
            <p className="text-xs text-gray-500">
                Total <span className="font-semibold text-gray-700">{total}</span> {label}
            </p>
            <div className="flex gap-2">
                <button
                    onClick={onPrevious}
                    disabled={page === 1}
                    className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <ChevronLeft size={14} />
                    Previous
                </button>
                <span className="inline-flex items-center px-2 py-1.5 text-xs text-gray-500 font-semibold">
                    {page} of {pages}
                </span>
                <button
                    onClick={onNext}
                    disabled={page === pages}
                    className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Next
                    <ChevronRight size={14} />
                </button>
            </div>
        </div>
    );
}

function EmptyState({ icon: Icon, title, description }) {
    return (
        <div className="flex min-h-[240px] items-center justify-center rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="text-center">
                {Icon && <Icon size={48} className="mx-auto mb-4 text-gray-400" />}
                <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
                <p className="mt-1 text-xs text-gray-500">{description}</p>
            </div>
        </div>
    );
}

// Modal component
function Modal({ isOpen, title, children, onClose }) {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-gray-900">{title}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X size={20} />
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
}

// Document Preview Modal
function DocumentPreviewModal({ isOpen, document, onClose }) {
    if (!isOpen || !document) return null;

    const isPdf = document.url?.includes(".pdf") || document.url?.endsWith("pdf");

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-full max-w-2xl rounded-2xl border border-gray-200 bg-white shadow-lg overflow-hidden">
                <div className="flex items-center justify-between bg-gray-50 border-b border-gray-200 p-4">
                    <div>
                        <h2 className="text-sm font-bold text-gray-900">{document.filename || "Document"}</h2>
                        <p className="text-xs text-gray-500 mt-1">Type: {document.type}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X size={20} />
                    </button>
                </div>
                <div className="bg-gray-100 p-4 flex items-center justify-center" style={{ height: "500px" }}>
                    {isPdf ? (
                        <div className="text-center">
                            <FileText size={48} className="mx-auto mb-4 text-gray-400" />
                            <p className="text-sm text-gray-600 mb-4">PDF Document</p>
                            <a
                                href={document.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 rounded-lg bg-pink-500 text-white px-4 py-2 text-xs font-semibold hover:bg-pink-600"
                            >
                                <Download size={14} />
                                Open PDF
                            </a>
                        </div>
                    ) : (
                        <img
                            src={document.url}
                            alt={document.filename}
                            className="max-h-full max-w-full object-contain"
                        />
                    )}
                </div>
            </div>
        </div>
    );
}

// Main Verification Management Component
export default function AdminVerification() {
    const [verifications, setVerifications] = useState([]);
    const [selected, setSelected] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("pending");
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0, suspended: 0 });
    const [auditHistory, setAuditHistory] = useState([]);
    const toast = useToast();

    // Modals
    const [showApproveModal, setShowApproveModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [showResubmitModal, setShowResubmitModal] = useState(false);
    const [showSuspendModal, setShowSuspendModal] = useState(false);
    const [showDocPreview, setShowDocPreview] = useState(false);
    const [previewDoc, setPreviewDoc] = useState(null);

    // Form state for modals
    const [rejectReason, setRejectReason] = useState("");
    const [resubmitInstructions, setResubmitInstructions] = useState("");
    const [suspendReason, setSuspendReason] = useState("");
    const [suspendNotes, setSuspendNotes] = useState("");
    const [actionLoading, setActionLoading] = useState(false);

    const LIMIT = 20;

    // Load verifications list
    useEffect(() => {
        fetchVerifications();
    }, [page, statusFilter]);

    const fetchVerifications = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await adminService.getVerifications(page, LIMIT, { status: statusFilter });
            setVerifications(data.items || []);
            setTotal(data.pagination?.total || 0);
            setStats({
                pending: data.stats?.pending || 0,
                approved: data.stats?.approved || 0,
                rejected: data.stats?.rejected || 0,
                suspended: data.stats?.suspended || 0,
            });
        } catch (err) {
            setError(err.response?.data?.message || "Failed to load verifications");
        } finally {
            setLoading(false);
        }
    };

    const fetchVerificationDetails = async (id) => {
        try {
            setDetailsLoading(true);
            const data = await adminService.getVerificationDetails(id);
            setSelected(data.verification);

            // Fetch audit history
            const historyData = await adminService.getVerificationAuditHistory(id);
            setAuditHistory(historyData.auditHistory || []);
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to load verification details");
        } finally {
            setDetailsLoading(false);
        }
    };

    const handleSelectVerification = (verification) => {
        fetchVerificationDetails(verification._id);
    };

    const handleApprove = async () => {
        if (!selected) return;
        try {
            setActionLoading(true);
            await adminService.approveVerification(selected._id);
            toast.success("Verification approved successfully");
            setShowApproveModal(false);
            await fetchVerificationDetails(selected._id);
            fetchVerifications();
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to approve verification");
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = async () => {
        if (!selected || !rejectReason.trim()) {
            toast.error("Rejection reason is required");
            return;
        }
        try {
            setActionLoading(true);
            await adminService.rejectVerification(selected._id, rejectReason);
            toast.success("Verification rejected successfully");
            setShowRejectModal(false);
            setRejectReason("");
            await fetchVerificationDetails(selected._id);
            fetchVerifications();
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to reject verification");
        } finally {
            setActionLoading(false);
        }
    };

    const handleRequestResubmission = async () => {
        if (!selected || !resubmitInstructions.trim()) {
            toast.error("Resubmission instructions are required");
            return;
        }
        try {
            setActionLoading(true);
            await adminService.requestResubmission(selected._id, resubmitInstructions);
            toast.success("Resubmission request sent successfully");
            setShowResubmitModal(false);
            setResubmitInstructions("");
            await fetchVerificationDetails(selected._id);
            fetchVerifications();
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to request resubmission");
        } finally {
            setActionLoading(false);
        }
    };

    const handleSuspend = async () => {
        if (!selected || !suspendReason.trim()) {
            toast.error("Suspension reason is required");
            return;
        }
        try {
            setActionLoading(true);
            await adminService.suspendVerification(selected._id, suspendReason, suspendNotes);
            toast.success("Verification suspended successfully");
            setShowSuspendModal(false);
            setSuspendReason("");
            setSuspendNotes("");
            await fetchVerificationDetails(selected._id);
            fetchVerifications();
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to suspend verification");
        } finally {
            setActionLoading(false);
        }
    };

    const handlePreviewDocument = (doc) => {
        setPreviewDoc(doc);
        setShowDocPreview(true);
    };

    return (
        <AdminLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <FileCheck className="text-pink-500" size={24} />
                        Verification Management
                    </h1>
                    <p className="mt-1 text-sm text-gray-600">Review and manage organizer verification requests</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard icon={Clock} label="Pending Review" value={formatNumber(stats.pending)} />
                    <StatCard icon={CheckCircle2} label="Verified" value={formatNumber(stats.approved)} />
                    <StatCard icon={XCircle} label="Rejected" value={formatNumber(stats.rejected)} />
                    <StatCard icon={AlertTriangle} label="Suspended" value={formatNumber(stats.suspended)} />
                </div>

                {error && (
                    <ErrorMessage
                        message={error}
                        onDismiss={() => setError(null)}
                    />
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* List View */}
                    <div className="lg:col-span-2">
                        <SurfaceCard className="space-y-4">
                            {/* Filter Bar */}
                            <div className="flex gap-3 pb-4 border-b border-gray-200">
                                <div className="flex-1">
                                    <div className="relative">
                                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="text"
                                            placeholder="Search by organizer name or email..."
                                            value={search}
                                            onChange={(e) => {
                                                setSearch(e.target.value);
                                                setPage(1);
                                            }}
                                            className="w-full rounded-lg border-2 border-gray-200 bg-gray-50 pl-10 pr-4 py-2.5 text-sm placeholder-gray-400 focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
                                        />
                                    </div>
                                </div>
                                <select
                                    value={statusFilter}
                                    onChange={(e) => {
                                        setStatusFilter(e.target.value);
                                        setPage(1);
                                    }}
                                    className="rounded-lg border-2 border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-semibold text-gray-700 focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
                                >
                                    <option value="">All Statuses</option>
                                    <option value="pending">Pending Review</option>
                                    <option value="approved">Verified</option>
                                    <option value="rejected">Rejected</option>
                                    <option value="resubmission_required">Resubmission Required</option>
                                    <option value="suspended">Suspended</option>
                                </select>
                            </div>

                            {/* Verifications Table */}
                            {loading ? (
                                <LoadingSpinner label="Loading verifications..." />
                            ) : verifications.length === 0 ? (
                                <EmptyState
                                    icon={FileText}
                                    title="No Verifications"
                                    description="No verification requests match your filters"
                                />
                            ) : (
                                <>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b border-gray-200 bg-gray-50">
                                                    <th className="text-left px-4 py-3 font-bold uppercase tracking-wider text-gray-400">Organizer</th>
                                                    <th className="text-left px-4 py-3 font-bold uppercase tracking-wider text-gray-400">Status</th>
                                                    <th className="text-left px-4 py-3 font-bold uppercase tracking-wider text-gray-400">Submitted</th>
                                                    <th className="text-center px-4 py-3 font-bold uppercase tracking-wider text-gray-400">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {verifications.map((verification) => (
                                                    <tr
                                                        key={verification._id}
                                                        className="border-b border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors"
                                                        onClick={() => handleSelectVerification(verification)}
                                                    >
                                                        <td className="px-4 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <UserAvatar user={verification.organizer} size={32} />
                                                                <div>
                                                                    <p className="font-semibold text-gray-900">{verification.organizer.name}</p>
                                                                    <p className="text-xs text-gray-500">{verification.organizer.email}</p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-4">
                                                            <StatusBadge status={verification.status} />
                                                        </td>
                                                        <td className="px-4 py-4">
                                                            <p className="text-xs text-gray-600">{formatDate(verification.createdAt)}</p>
                                                            {verification.documents?.length > 0 && (
                                                                <p className="text-xs text-gray-500 mt-1">{verification.documents.length} document(s)</p>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-4 text-center">
                                                            <Eye size={16} className="mx-auto text-pink-500" />
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Pagination */}
                                    <PaginationControls
                                        page={page}
                                        pages={Math.ceil(total / LIMIT)}
                                        onPrevious={() => setPage(Math.max(1, page - 1))}
                                        onNext={() => setPage(page + 1)}
                                        total={total}
                                        label="verifications"
                                    />
                                </>
                            )}
                        </SurfaceCard>
                    </div>

                    {/* Detail View */}
                    <div className="lg:col-span-1">
                        <SurfaceCard className="space-y-5 sticky top-20">
                            {selected === null ? (
                                <EmptyState
                                    icon={Eye}
                                    title="Select a Request"
                                    description="Click on a verification request to view details"
                                />
                            ) : detailsLoading ? (
                                <LoadingSpinner label="Loading details..." />
                            ) : (
                                <>
                                    {/* Organizer Info */}
                                    <div>
                                        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Organizer Profile</h3>
                                        <div className="space-y-3">
                                            <div className="flex items-start gap-3">
                                                <UserAvatar user={selected.organizer} size={48} />
                                                <div>
                                                    <p className="font-semibold text-gray-900">{selected.organizer.name}</p>
                                                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                                        <Mail size={12} />
                                                        {selected.organizer.email}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-200">
                                                <div>
                                                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Status</p>
                                                    <StatusBadge status={selected.status} />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Risk Score</p>
                                                    <p className="mt-2 text-lg font-bold text-gray-900">{selected.risk_score || 0}/100</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Documents */}
                                    {selected.documents?.length > 0 && (
                                        <div>
                                            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Documents ({selected.documents.length})</h3>
                                            <div className="space-y-2">
                                                {selected.documents.map((doc, idx) => (
                                                    <button
                                                        key={idx}
                                                        onClick={() => handlePreviewDocument(doc)}
                                                        className="w-full text-left rounded-lg border border-gray-200 bg-gray-50 p-3 hover:bg-gray-100 transition-colors group"
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-xs font-semibold text-gray-900 truncate">{doc.filename || `Document ${idx + 1}`}</p>
                                                                <p className="text-xs text-gray-500 mt-1">{doc.type}</p>
                                                            </div>
                                                            <ZoomIn size={14} className="text-gray-400 group-hover:text-pink-500 ml-2 flex-shrink-0" />
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Submission Info */}
                                    <div>
                                        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Submission Info</h3>
                                        <div className="space-y-2 text-xs">
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Submitted</span>
                                                <span className="font-semibold text-gray-900">{formatDate(selected.createdAt)}</span>
                                            </div>
                                            {selected.reviewedAt && (
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Reviewed</span>
                                                    <span className="font-semibold text-gray-900">{formatDate(selected.reviewedAt)}</span>
                                                </div>
                                            )}
                                            {selected.submission_ip && (
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">IP Address</span>
                                                    <span className="font-mono text-gray-900 text-xs">{selected.submission_ip}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Admin Notes */}
                                    {selected.notes && (
                                        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                                            <p className="text-xs font-semibold text-blue-700 flex items-center gap-2 mb-2">
                                                <MessageSquare size={14} />
                                                Admin Notes
                                            </p>
                                            <p className="text-xs text-blue-600">{selected.notes}</p>
                                        </div>
                                    )}

                                    {/* Rejection Reason */}
                                    {selected.rejectionReason && (
                                        <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                                            <p className="text-xs font-semibold text-red-700 flex items-center gap-2 mb-2">
                                                <AlertCircle size={14} />
                                                Rejection Reason
                                            </p>
                                            <p className="text-xs text-red-600">{selected.rejectionReason}</p>
                                        </div>
                                    )}

                                    {/* Resubmission Instructions */}
                                    {selected.resubmissionInstructions && (
                                        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                                            <p className="text-xs font-semibold text-amber-700 flex items-center gap-2 mb-2">
                                                <AlertTriangle size={14} />
                                                Resubmission Required
                                            </p>
                                            <p className="text-xs text-amber-600 whitespace-pre-wrap">{selected.resubmissionInstructions}</p>
                                        </div>
                                    )}

                                    {/* Action Buttons */}
                                    {["pending", "resubmitted", "resubmission_required"].includes(selected.status) && (
                                        <div className="space-y-2 border-t border-gray-200 pt-4">
                                            <button
                                                onClick={() => setShowApproveModal(true)}
                                                className="w-full rounded-lg bg-green-500 text-white px-4 py-2.5 text-xs font-semibold hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
                                            >
                                                <CheckCircle2 size={14} />
                                                Approve
                                            </button>
                                            <button
                                                onClick={() => setShowRejectModal(true)}
                                                className="w-full rounded-lg bg-red-500 text-white px-4 py-2.5 text-xs font-semibold hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
                                            >
                                                <XCircle size={14} />
                                                Reject
                                            </button>
                                            <button
                                                onClick={() => setShowResubmitModal(true)}
                                                className="w-full rounded-lg bg-amber-500 text-white px-4 py-2.5 text-xs font-semibold hover:bg-amber-600 transition-colors flex items-center justify-center gap-2"
                                            >
                                                <RefreshCw size={14} />
                                                Request Resubmission
                                            </button>
                                            <button
                                                onClick={() => setShowSuspendModal(true)}
                                                className="w-full rounded-lg bg-purple-500 text-white px-4 py-2.5 text-xs font-semibold hover:bg-purple-600 transition-colors flex items-center justify-center gap-2"
                                            >
                                                <AlertTriangle size={14} />
                                                Suspend Investigation
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}
                        </SurfaceCard>
                    </div>
                </div>
            </div>

            {/* Modals */}
            <Modal isOpen={showApproveModal} title="Approve Verification" onClose={() => setShowApproveModal(false)}>
                <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                        Are you sure you want to approve this verification? The organizer will receive a notification and can immediately publish events.
                    </p>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setShowApproveModal(false)}
                            className="flex-1 rounded-lg border border-gray-200 text-gray-700 px-4 py-2 text-sm font-semibold hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleApprove}
                            disabled={actionLoading}
                            className="flex-1 rounded-lg bg-green-500 text-white px-4 py-2 text-sm font-semibold hover:bg-green-600 disabled:opacity-50"
                        >
                            {actionLoading ? "Approving..." : "Approve"}
                        </button>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={showRejectModal} title="Reject Verification" onClose={() => setShowRejectModal(false)}>
                <div className="space-y-4">
                    <textarea
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="Explain why this verification is being rejected..."
                        rows="4"
                        className="w-full rounded-lg border-2 border-gray-200 bg-gray-50 p-3 text-sm focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
                    />
                    <div className="flex gap-3">
                        <button
                            onClick={() => {
                                setShowRejectModal(false);
                                setRejectReason("");
                            }}
                            className="flex-1 rounded-lg border border-gray-200 text-gray-700 px-4 py-2 text-sm font-semibold hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleReject}
                            disabled={actionLoading || !rejectReason.trim()}
                            className="flex-1 rounded-lg bg-red-500 text-white px-4 py-2 text-sm font-semibold hover:bg-red-600 disabled:opacity-50"
                        >
                            {actionLoading ? "Rejecting..." : "Reject"}
                        </button>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={showResubmitModal} title="Request Resubmission" onClose={() => setShowResubmitModal(false)}>
                <div className="space-y-4">
                    <textarea
                        value={resubmitInstructions}
                        onChange={(e) => setResubmitInstructions(e.target.value)}
                        placeholder="Provide specific instructions for resubmission (e.g., which documents are missing or unclear)..."
                        rows="4"
                        className="w-full rounded-lg border-2 border-gray-200 bg-gray-50 p-3 text-sm focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
                    />
                    <div className="flex gap-3">
                        <button
                            onClick={() => {
                                setShowResubmitModal(false);
                                setResubmitInstructions("");
                            }}
                            className="flex-1 rounded-lg border border-gray-200 text-gray-700 px-4 py-2 text-sm font-semibold hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleRequestResubmission}
                            disabled={actionLoading || !resubmitInstructions.trim()}
                            className="flex-1 rounded-lg bg-amber-500 text-white px-4 py-2 text-sm font-semibold hover:bg-amber-600 disabled:opacity-50"
                        >
                            {actionLoading ? "Sending..." : "Send Request"}
                        </button>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={showSuspendModal} title="Suspend Verification" onClose={() => setShowSuspendModal(false)}>
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                            Suspension Reason (Required)
                        </label>
                        <textarea
                            value={suspendReason}
                            onChange={(e) => setSuspendReason(e.target.value)}
                            placeholder="Why is this verification being suspended?"
                            rows="3"
                            className="w-full rounded-lg border-2 border-gray-200 bg-gray-50 p-3 text-sm focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                            Investigation Notes (Optional)
                        </label>
                        <textarea
                            value={suspendNotes}
                            onChange={(e) => setSuspendNotes(e.target.value)}
                            placeholder="Internal investigation notes..."
                            rows="3"
                            className="w-full rounded-lg border-2 border-gray-200 bg-gray-50 p-3 text-sm focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
                        />
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => {
                                setShowSuspendModal(false);
                                setSuspendReason("");
                                setSuspendNotes("");
                            }}
                            className="flex-1 rounded-lg border border-gray-200 text-gray-700 px-4 py-2 text-sm font-semibold hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSuspend}
                            disabled={actionLoading || !suspendReason.trim()}
                            className="flex-1 rounded-lg bg-purple-500 text-white px-4 py-2 text-sm font-semibold hover:bg-purple-600 disabled:opacity-50"
                        >
                            {actionLoading ? "Suspending..." : "Suspend"}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Document Preview Modal */}
            <DocumentPreviewModal
                isOpen={showDocPreview}
                document={previewDoc}
                onClose={() => setShowDocPreview(false)}
            />
        </AdminLayout>
    );
}
