import React from "react";
import { AlertCircle, CheckCircle2, Clock, XCircle, FileText } from "lucide-react";
import VerifiedBadge from "./ui/verified-badge";

/**
 * Reusable component for displaying organizer verification status
 * Shows current verification state, rejection reason, and action prompts
 */
export default function VerificationStatusCard({ verification, onStartVerification, compact = false }) {
    if (!verification) return null;

    const { status, isVerified, rejectionReason, documents, createdAt } = verification;

    const statusConfig = {
        not_started: {
            icon: FileText,
            label: "Not Started",
            color: "gray",
            bgColor: "bg-gray-50",
            borderColor: "border-gray-200",
            textColor: "text-gray-600",
            badge: "Verification pending",
        },
        pending: {
            icon: Clock,
            label: "Pending Review",
            color: "blue",
            bgColor: "bg-blue-50",
            borderColor: "border-blue-200",
            textColor: "text-blue-600",
            badge: "Under review",
        },
        approved: {
            icon: CheckCircle2,
            label: "Verified",
            color: "green",
            bgColor: "bg-green-50",
            borderColor: "border-green-200",
            textColor: "text-green-600",
            badge: "Verified",
        },
        rejected: {
            icon: XCircle,
            label: "Rejected",
            color: "red",
            bgColor: "bg-red-50",
            borderColor: "border-red-200",
            textColor: "text-red-600",
            badge: "Rejected",
        },
    };

    const config = statusConfig[status] || statusConfig.not_started;
    const Icon = config.icon;

    if (compact) {
        return (
            <div className={`flex items-center gap-3 p-3 rounded-lg border ${config.bgColor} ${config.borderColor}`}>
                <Icon size={20} className={config.textColor} />
                <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold ${config.textColor}`}>{config.label}</p>
                    {status === "rejected" && rejectionReason && (
                        <p className={`text-xs ${config.textColor} opacity-75 truncate`}>{rejectionReason}</p>
                    )}
                </div>
                {isVerified && <VerifiedBadge size="sm" />}
            </div>
        );
    }

    return (
        <div className={`border rounded-xl p-5 ${config.bgColor} ${config.borderColor}`}>
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg bg-white flex items-center justify-center`}>
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
