import React from "react";
import { CheckCircle2, Clock, XCircle, FileText, ShieldCheck, Eye } from "lucide-react";
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
    },
    pending: {
        icon: Clock,
        label: "Pending Review",
        bgColor: "bg-blue-50",
        borderColor: "border-blue-200",
        textColor: "text-blue-600",
    },
    approved: {
        icon: CheckCircle2,
        label: "Verified",
        bgColor: "bg-green-50",
        borderColor: "border-green-200",
        textColor: "text-green-600",
    },
    rejected: {
        icon: XCircle,
        label: "Rejected",
        bgColor: "bg-red-50",
        borderColor: "border-red-200",
        textColor: "text-red-600",
    },
};

// ─── Compact banner (used in Dashboard top section) ──────────────────────────
function CompactView({ config, status, isVerified, rejectionReason, userRole }) {
    const Icon = config.icon;
    const adminView = isAdminRole(userRole);

    return (
        <div className={`flex items-center gap-3 p-3 rounded-lg border ${config.bgColor} ${config.borderColor}`}>
            {adminView && (
                <ShieldCheck size={16} className="text-gray-400 flex-shrink-0" />
            )}
            <Icon size={20} className={`${config.textColor} flex-shrink-0`} />
            <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold ${config.textColor}`}>{config.label}</p>
                {status === "rejected" && rejectionReason && (
                    <p className={`text-xs ${config.textColor} opacity-75 truncate`}>{rejectionReason}</p>
                )}
            </div>
            {isVerified && <VerifiedBadge size="sm" />}
            {adminView && (
                <span className="text-[0.6rem] font-bold uppercase tracking-widest text-gray-400 bg-white border border-gray-200 px-2 py-0.5 rounded-full whitespace-nowrap">
                    Admin view
                </span>
            )}
        </div>
    );
}

// ─── Admin full view ─────────────────────────────────────────────────────────
function AdminView({ config, status, isVerified, rejectionReason, documents, createdAt, onApprove, onReject, userRole }) {
    const Icon = config.icon;

    // These roles can take approval/rejection actions
    const canAction = ["super_admin", "admin", "moderator"].includes(userRole);
    // finance_admin and support_admin see documents but cannot act
    const isReadOnly = ["finance_admin", "support_admin"].includes(userRole);

    return (
        <div className={`border rounded-xl p-5 ${config.bgColor} ${config.borderColor}`}>
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center">
                        <Icon size={20} className={config.textColor} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <h3 className={`font-bold text-base ${config.textColor}`}>{config.label}</h3>
                            <span className="text-[0.6rem] font-bold uppercase tracking-widest text-gray-400 bg-white border border-gray-200 px-2 py-0.5 rounded-full">
                                {isReadOnly ? "Read-only" : "Admin"}
                            </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                            {status === "not_started" && "Organizer has not submitted any documents yet"}
                            {status === "pending" && "Documents are awaiting admin review"}
                            {status === "approved" && "Organizer is verified and fully active"}
                            {status === "rejected" && "Verification was rejected — organizer may resubmit"}
                        </p>
                    </div>
                </div>
                {isVerified && <VerifiedBadge />}
            </div>

            {/* Rejection reason on file */}
            {status === "rejected" && rejectionReason && (
                <div className="bg-white border border-red-200 rounded-lg p-3 mb-4">
                    <p className="text-xs font-semibold text-red-600 mb-1">Rejection Reason on File:</p>
                    <p className="text-sm text-red-600">{rejectionReason}</p>
                </div>
            )}

            {/* Submitted documents */}
            {documents && documents.length > 0 ? (
                <div className="bg-white border border-gray-200 rounded-lg p-3 mb-4">
                    <p className="text-xs font-semibold text-gray-600 mb-2 flex items-center gap-1.5">
                        <Eye size={13} />
                        Submitted Documents ({documents.length})
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {documents.map((doc, idx) => (
                            <a
                                key={idx}
                                href={doc.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-700 transition-colors flex items-center gap-1"
                                title={doc.filename}
                            >
                                <FileText size={11} />
                                {doc.type || "Document"} {idx + 1}
                            </a>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="bg-white border border-gray-100 rounded-lg p-3 mb-4">
                    <p className="text-xs text-gray-400 italic">No documents have been submitted yet.</p>
                </div>
            )}

            {createdAt && (
                <p className="text-xs text-gray-500 mb-4">
                    Submitted: {new Date(createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </p>
            )}

            {/* Action buttons — only for roles with action permissions */}
            {canAction && status === "pending" && (
                <div className="flex gap-3">
                    {onApprove && (
                        <button
                            onClick={onApprove}
                            className="flex-1 py-2 px-4 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                        >
                            <CheckCircle2 size={15} />
                            Approve
                        </button>
                    )}
                    {onReject && (
                        <button
                            onClick={onReject}
                            className="flex-1 py-2 px-4 rounded-lg bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
                        >
                            <XCircle size={15} />
                            Reject
                        </button>
                    )}
                </div>
            )}

            {/* Revoke an already-approved verification */}
            {canAction && status === "approved" && onReject && (
                <button
                    onClick={onReject}
                    className="w-full py-2 px-4 rounded-lg border border-red-200 text-red-600 text-sm font-semibold hover:bg-red-50 transition-colors"
                >
                    Revoke Verification
                </button>
            )}

            {/* Override-approve a rejected verification */}
            {canAction && status === "rejected" && onApprove && (
                <button
                    onClick={onApprove}
                    className="w-full py-2 px-4 rounded-lg border border-green-200 text-green-700 text-sm font-semibold hover:bg-green-50 transition-colors"
                >
                    Override — Approve Anyway
                </button>
            )}
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
                            {status === "pending" && "Your documents are under review"}
                            {status === "approved" && "You are now verified to publish events"}
                            {status === "rejected" && "Your verification was rejected"}
                        </p>
                    </div>
                </div>
                {isVerified && <VerifiedBadge />}
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
                <p className="text-xs text-gray-500">
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
/**
 * VerificationStatusCard
 *
 * Props:
 *   verification        — verification object { status, isVerified, rejectionReason, documents, createdAt }
 *   userRole            — current user's role string
 *                         Organizer:  "organizer"
 *                         Full admin: "super_admin" | "admin" | "moderator"
 *                         Read-only:  "finance_admin" | "support_admin"
 *   onStartVerification — organizer only: navigates to /verification
 *   onApprove           — admin only: called when admin clicks Approve / Override-Approve
 *   onReject            — admin only: called when admin clicks Reject / Revoke
 *   compact             — renders the slim banner variant (used in Dashboard top)
 */
export default function VerificationStatusCard({
    verification,
    userRole,
    onStartVerification,
    onApprove,
    onReject,
    compact = false,
}) {
    if (!verification) return null;

    const { status, isVerified, rejectionReason, documents, createdAt } = verification;
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