import React from "react";
import {
    CheckCircle2, Clock, XCircle, FileText, ShieldCheck,
    Eye, ArrowRight, AlertTriangle, Download, User,
    CalendarClock, BadgeCheck, ShieldX, RotateCcw
} from "lucide-react";
import VerifiedBadge from "./ui/verified-badge";

const ADMIN_ROLES = ["super_admin", "admin", "moderator", "finance_admin", "support_admin"];
const isAdminRole = (role) => ADMIN_ROLES.includes(role);

const statusConfig = {
    not_started: {
        icon: FileText,
        label: "Not Started",
        bgColor: "bg-gray-50",
        borderColor: "border-gray-200",
        textColor: "text-gray-600",
        badgeClass: "bg-gray-100 text-gray-600",
    },
    pending: {
        icon: Clock,
        label: "Pending Review",
        bgColor: "bg-blue-50",
        borderColor: "border-blue-200",
        textColor: "text-blue-600",
        badgeClass: "bg-blue-100 text-blue-700",
    },
    approved: {
        icon: CheckCircle2,
        label: "Verified",
        bgColor: "bg-green-50",
        borderColor: "border-green-200",
        textColor: "text-green-600",
        badgeClass: "bg-green-100 text-green-700",
    },
    rejected: {
        icon: XCircle,
        label: "Rejected",
        bgColor: "bg-red-50",
        borderColor: "border-red-200",
        textColor: "text-red-600",
        badgeClass: "bg-red-100 text-red-700",
    },
};

// ─── Compact banner (used in Dashboard top section) ──────────────────────────
function CompactView({ config, status, isVerified, rejectionReason, userRole, onStartVerification }) {
    const Icon = config.icon;
    const adminView = isAdminRole(userRole);
    const isClickable = !adminView && (status === "not_started" || status === "rejected");

    const subtitleMap = {
        not_started: "Tap to submit your documents, takes under 2 minutes",
        rejected: rejectionReason || "Tap to resubmit your documents",
        pending: "Your documents are under review. We'll notify you within 48 hours.",
        approved: "Your account is fully verified.",
    };

    return (
        <div
            className={`flex items-center gap-3 p-3 rounded-lg border ${config.bgColor} ${config.borderColor} transition-all ${
                isClickable ? "cursor-pointer hover:-translate-y-0.5 hover:shadow-md active:scale-[0.99]" : ""
            }`}
            onClick={isClickable ? onStartVerification : undefined}
            role={isClickable ? "button" : undefined}
            tabIndex={isClickable ? 0 : undefined}
            onKeyDown={isClickable ? (e) => e.key === "Enter" && onStartVerification?.() : undefined}
        >
            {adminView && <ShieldCheck size={16} className="text-gray-400 flex-shrink-0" />}
            <Icon size={20} className={`${config.textColor} flex-shrink-0`} />
            <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold ${config.textColor}`}>
                    {status === "not_started" ? "Get verified to publish events" : config.label}
                </p>
                <p className={`text-xs ${config.textColor} opacity-75 truncate`}>
                    {subtitleMap[status]}
                </p>
            </div>
            {isVerified && <VerifiedBadge verificationStatus="approved" size="sm" />}
            {adminView && (
                <span className="text-[0.6rem] font-bold uppercase tracking-widest text-gray-400 bg-white border border-gray-200 px-2 py-0.5 rounded-full whitespace-nowrap">
                    Admin view
                </span>
            )}
            {isClickable && <ArrowRight size={15} className={`${config.textColor} flex-shrink-0`} />}
        </div>
    );
}

// ─── Admin full view ─────────────────────────────────────────────────────────
function AdminView({ config, status, isVerified, rejectionReason, documents, createdAt, updatedAt, organizer, onApprove, onReject, userRole }) {
    const Icon = config.icon;
    const canAction = ["super_admin", "admin", "moderator"].includes(userRole);
    const isReadOnly = ["finance_admin", "support_admin"].includes(userRole);

    const statusDescMap = {
        not_started: "Organizer has not submitted any documents yet.",
        pending:     "Documents submitted and awaiting admin review.",
        approved:    "Organizer is verified and fully active.",
        rejected:    "Verification was rejected, organizer may resubmit.",
    };

    return (
        <div className={`border rounded-2xl overflow-hidden ${config.borderColor}`}>

            {/* ── Header bar ── */}
            <div className={`${config.bgColor} px-5 py-4 flex items-start justify-between gap-4`}>
                <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-white/80 flex items-center justify-center shadow-sm flex-shrink-0">
                        <Icon size={22} className={config.textColor} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <h3 className={`font-extrabold text-sm ${config.textColor}`}>{config.label}</h3>
                            <span className={`text-[0.58rem] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full border ${config.badgeClass} border-current/20`}>
                                {status.replace("_", " ")}
                            </span>
                            <span className="text-[0.58rem] font-bold uppercase tracking-widest text-gray-400 bg-white border border-gray-200 px-2 py-0.5 rounded-full">
                                {isReadOnly ? "Read-only" : "Admin"}
                            </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{statusDescMap[status]}</p>
                    </div>
                </div>
                {isVerified && <VerifiedBadge verificationStatus="approved" />}
            </div>

            <div className="bg-white p-5 space-y-4">

                {/* ── Organizer info (if provided) ── */}
                {organizer && (
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                        <div className="w-9 h-9 rounded-full bg-pink-100 flex items-center justify-center flex-shrink-0">
                            <User size={16} className="text-pink-500" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs font-bold text-gray-900 truncate">{organizer.name || organizer.username}</p>
                            <p className="text-[0.65rem] text-gray-400 truncate">{organizer.email}</p>
                        </div>
                    </div>
                )}

                {/* ── Timeline ── */}
                <div className="grid grid-cols-2 gap-3">
                    {createdAt && (
                        <div className="flex items-start gap-2 p-3 rounded-xl bg-gray-50 border border-gray-100">
                            <CalendarClock size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="text-[0.58rem] font-bold uppercase tracking-widest text-gray-400">Submitted</p>
                                <p className="text-xs font-semibold text-gray-800 mt-0.5">
                                    {new Date(createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                </p>
                            </div>
                        </div>
                    )}
                    {updatedAt && status !== "not_started" && (
                        <div className="flex items-start gap-2 p-3 rounded-xl bg-gray-50 border border-gray-100">
                            <RotateCcw size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="text-[0.58rem] font-bold uppercase tracking-widest text-gray-400">Last updated</p>
                                <p className="text-xs font-semibold text-gray-800 mt-0.5">
                                    {new Date(updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Rejection reason ── */}
                {status === "rejected" && rejectionReason && (
                    <div className="flex items-start gap-3 p-3 rounded-xl bg-red-50 border border-red-200">
                        <AlertTriangle size={15} className="text-red-500 mt-0.5 flex-shrink-0" />
                        <div>
                            <p className="text-xs font-extrabold text-red-700 mb-0.5">Rejection Reason on File</p>
                            <p className="text-xs text-red-600">{rejectionReason}</p>
                        </div>
                    </div>
                )}

                {/* ── Documents ── */}
                <div>
                    <p className="text-xs font-extrabold text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                        <Eye size={12} /> Submitted Documents
                    </p>
                    {documents && documents.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {documents.map((doc, idx) => (
                                <a
                                    key={idx}
                                    href={doc.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    title={doc.filename}
                                    className="flex items-center gap-2.5 px-3 py-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 hover:border-gray-300 rounded-xl transition-colors group"
                                >
                                    <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center flex-shrink-0 group-hover:border-pink-200 transition-colors">
                                        <FileText size={14} className="text-gray-400 group-hover:text-pink-400 transition-colors" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs font-semibold text-gray-800 truncate">
                                            {doc.type || "Document"} {idx + 1}
                                        </p>
                                        {doc.filename && (
                                            <p className="text-[0.6rem] text-gray-400 truncate">{doc.filename}</p>
                                        )}
                                    </div>
                                    <Download size={12} className="text-gray-300 group-hover:text-pink-400 transition-colors flex-shrink-0" />
                                </a>
                            ))}
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 p-3 rounded-xl bg-gray-50 border border-dashed border-gray-200">
                            <FileText size={14} className="text-gray-300" />
                            <p className="text-xs text-gray-400 italic">No documents have been submitted yet.</p>
                        </div>
                    )}
                </div>

                {/* ── Action buttons ── */}
                {canAction && (
                    <div className="pt-1">
                        {/* Pending → Approve / Reject */}
                        {status === "pending" && (
                            <div className="flex gap-3">
                                {onApprove && (
                                    <button
                                        onClick={onApprove}
                                        className="flex-1 py-2.5 px-4 rounded-xl bg-green-600 text-white text-xs font-extrabold hover:bg-green-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                                    >
                                        <BadgeCheck size={15} /> Approve & Verify
                                    </button>
                                )}
                                {onReject && (
                                    <button
                                        onClick={onReject}
                                        className="flex-1 py-2.5 px-4 rounded-xl bg-red-500 text-white text-xs font-extrabold hover:bg-red-600 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                                    >
                                        <XCircle size={15} /> Reject
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Approved → Revoke */}
                        {status === "approved" && onReject && (
                            <button
                                onClick={onReject}
                                className="w-full py-2.5 px-4 rounded-xl border border-red-200 bg-red-50 text-red-600 text-xs font-extrabold hover:bg-red-100 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                            >
                                <ShieldX size={15} /> Revoke Verification
                            </button>
                        )}

                        {/* Rejected → Override approve */}
                        {status === "rejected" && onApprove && (
                            <button
                                onClick={onApprove}
                                className="w-full py-2.5 px-4 rounded-xl border border-green-200 bg-green-50 text-green-700 text-xs font-extrabold hover:bg-green-100 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                            >
                                <BadgeCheck size={15} /> Override, Approve Anyway
                            </button>
                        )}

                        {/* Not started, no actions available */}
                        {status === "not_started" && (
                            <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200">
                                <AlertTriangle size={13} className="text-amber-500 flex-shrink-0" />
                                <p className="text-xs text-amber-700">No documents submitted yet. Actions will be available once the organizer submits documents.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Organizer full view ──────────────────────────────────────────────────────
function OrganizerView({ config, status, isVerified, rejectionReason, documents, createdAt, onStartVerification }) {
    const Icon = config.icon;

    return (
        <div className={`border rounded-xl p-5 ${config.bgColor} ${config.borderColor}`}>
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center">
                        <Icon size={20} className={config.textColor} />
                    </div>
                    <div>
                        <h3 className={`font-bold text-base ${config.textColor}`}>{config.label}</h3>
                        <p className="text-xs text-gray-600 mt-0.5">
                            {status === "not_started" && "Submit documents to get verified"}
                            {status === "pending"     && "Your documents are under review"}
                            {status === "approved"    && "You are now verified to publish events"}
                            {status === "rejected"    && "Your verification was rejected"}
                        </p>
                    </div>
                </div>
                {isVerified && <VerifiedBadge verificationStatus="approved" />}
            </div>

            {status === "rejected" && (
                <div className="bg-white border border-red-200 rounded-lg p-3 mb-4">
                    <p className="text-xs font-semibold text-red-600 mb-1">Rejection Reason:</p>
                    <p className="text-sm text-red-600">{rejectionReason || "No reason provided"}</p>
                </div>
            )}

            {documents && documents.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg p-3 mb-4">
                    <p className="text-xs font-semibold text-gray-600 mb-2">Submitted Documents: {documents.length}</p>
                    <div className="flex flex-wrap gap-2">
                        {documents.map((doc, idx) => (
                            <a
                                key={idx}
                                href={doc.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-700 transition-colors"
                                title={doc.filename}
                            >
                                {doc.type || "Document"} {idx + 1}
                            </a>
                        ))}
                    </div>
                </div>
            )}

            {createdAt && (
                <p className="text-xs text-gray-500 mb-4">
                    Submitted: {new Date(createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </p>
            )}

            {status === "not_started" && onStartVerification && (
                <button
                    onClick={onStartVerification}
                    className="mt-4 w-full py-2 px-4 rounded-lg bg-pink-500 text-white text-sm font-semibold hover:bg-pink-600 transition-colors"
                >
                    Start Verification
                </button>
            )}

            {status === "rejected" && onStartVerification && (
                <button
                    onClick={onStartVerification}
                    className="mt-4 w-full py-2 px-4 rounded-lg bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 transition-colors"
                >
                    Resubmit Documents
                </button>
            )}
        </div>
    );
}

// ─── Main export ──────────────────────────────────────────────────────────────
export default function VerificationStatusCard({
    verification,
    userRole,
    onStartVerification,
    onApprove,
    onReject,
    compact = false,
}) {
    if (!verification) return null;

    const { status, isVerified, rejectionReason, documents, createdAt, updatedAt, organizer } = verification;
    const config = statusConfig[status] || statusConfig.not_started;
    const adminView = isAdminRole(userRole);

    if (compact) {
        return (
            <CompactView
                config={config}
                status={status}
                isVerified={isVerified}
                rejectionReason={rejectionReason}
                userRole={userRole}
                onStartVerification={onStartVerification}
            />
        );
    }

    if (adminView) {
        return (
            <AdminView
                config={config}
                status={status}
                isVerified={isVerified}
                rejectionReason={rejectionReason}
                documents={documents}
                createdAt={createdAt}
                updatedAt={updatedAt}
                organizer={organizer}
                onApprove={onApprove}
                onReject={onReject}
                userRole={userRole}
            />
        );
    }

    return (
        <OrganizerView
            config={config}
            status={status}
            isVerified={isVerified}
            rejectionReason={rejectionReason}
            documents={documents}
            createdAt={createdAt}
            onStartVerification={onStartVerification}
        />
    );
}
