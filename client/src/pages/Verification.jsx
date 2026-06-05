import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, ArrowLeft, CheckCircle2, FileText } from "lucide-react";
import VerificationStatusCard from "../components/VerificationStatusCard";
import Button from "../components/ui/button";
import Avatar from "../components/ui/avatar";
import { getProfileImageUrl } from "../utils/eventHelpers";
import { submitVerification, getMyVerification } from "../services/api/verification";

export default function VerificationPage() {
    const navigate = useNavigate();
    const [verification, setVerification] = useState(null);
    const [files, setFiles] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [isOnboarding, setIsOnboarding] = useState(false);
    const [uploadSuccess, setUploadSuccess] = useState(false);

    useEffect(() => {
        // Check if coming from onboarding flow
        const showOnboarding = sessionStorage.getItem("showVerificationOnboarding");
        if (showOnboarding) {
            setIsOnboarding(true);
            sessionStorage.removeItem("showVerificationOnboarding");
        }

        // Fetch verification status
        (async () => {
            try {
                const { data } = await getMyVerification();
                setVerification(data.verification || null);
            } catch (e) {
                console.error("Failed to fetch verification:", e);
            }
        })();
    }, []);

    const onFiles = (e) => {
        setFiles(Array.from(e.target.files || []).slice(0, 6));
    };

    const handleSubmit = async () => {
        if (!files.length) {
            alert("Please select at least one document");
            return;
        }

        try {
            setSubmitting(true);
            const fd = new FormData();
            files.forEach((f) => fd.append("documents", f));
            const types = files.map((f) => f.type || "document");
            fd.append("types", JSON.stringify(types));
            const { data } = await submitVerification(fd);
            setVerification(data.verification || null);
            setFiles([]);
            setUploadSuccess(true);
            setTimeout(() => setUploadSuccess(false), 3000);
        } catch (e) {
            console.error(e);
            alert("Upload failed. Try again.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleContinue = () => {
        if (isOnboarding) {
            navigate("/dashboard", { replace: true });
        } else {
            navigate(-1);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-pink-50 to-white">
            {/* Header */}
            <div className="border-b border-gray-200 bg-white sticky top-0 z-40">
                <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
                    <button
                        onClick={handleContinue}
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                    >
                        <ArrowLeft size={20} />
                        <span className="text-sm font-medium">Back</span>
                    </button>
                    <h1 className="text-lg font-bold text-gray-900">Organizer Verification</h1>
                    <div className="w-[68px]" /> {/* Spacer for layout */}
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 py-8">
                {/* Onboarding Info */}
                {isOnboarding && (
                    <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                        <h2 className="font-bold text-blue-900 mb-2">Get verified to start selling</h2>
                        <p className="text-sm text-blue-700">
                            Verification helps build trust with attendees. Upload documents to verify your identity, and you'll be able to publish events and receive payouts.
                        </p>
                    </div>
                )}

                {/* Main Content */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Upload Section */}
                    <div className="bg-white border border-gray-200 rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 rounded-lg bg-pink-100 flex items-center justify-center">
                                <Upload size={24} className="text-pink-600" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900">Submit Documents</h3>
                                <p className="text-xs text-gray-500">Upload ID or business registration</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-900 mb-3">
                                    Upload Your Documents
                                </label>
                                <div className="relative">
                                    <input
                                        type="file"
                                        multiple
                                        accept="image/*,.pdf"
                                        onChange={onFiles}
                                        disabled={submitting}
                                        className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
                                    />
                                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-pink-500 transition-colors cursor-pointer">
                                        <Upload size={32} className="text-gray-300 mx-auto mb-2" />
                                        <p className="text-sm font-medium text-gray-600 mb-1">Click to upload files</p>
                                        <p className="text-xs text-gray-500">
                                            Up to 6 files. JPG, PNG, PDF supported.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* File List */}
                            {files.length > 0 && (
                                <div>
                                    <label className="text-xs font-semibold text-gray-600 mb-2 block">
                                        Selected Files ({files.length}/6)
                                    </label>
                                    <div className="space-y-2">
                                        {files.map((f, i) => (
                                            <div
                                                key={i}
                                                className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg"
                                            >
                                                <FileText size={16} className="text-gray-400" />
                                                <span className="text-sm text-gray-700 truncate flex-1">{f.name}</span>
                                                <span className="text-xs text-gray-500">
                                                    {(f.size / 1024).toFixed(0)}KB
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Success Message */}
                            {uploadSuccess && (
                                <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                                    <CheckCircle2 size={18} className="text-green-600" />
                                    <p className="text-sm text-green-700">
                                        Documents submitted successfully! We'll review within 48 hours.
                                    </p>
                                </div>
                            )}

                            {/* Submit Button */}
                            <Button
                                onClick={handleSubmit}
                                disabled={submitting || !files.length}
                                className="w-full"
                            >
                                {submitting ? "Uploading..." : verification?.status === "rejected" ? "Resubmit Documents" : "Submit for Verification"}
                            </Button>

                            <p className="text-xs text-gray-500 text-center">
                                Your documents are secure and only seen by our verification team.
                            </p>
                        </div>
                    </div>

                    {/* Status Section */}
                    <div className="space-y-6">
                        {/* Current Status */}
                        <div>
                            <h3 className="text-sm font-bold text-gray-900 mb-3">Verification Status</h3>
                            <VerificationStatusCard
                                verification={verification}
                                onStartVerification={handleContinue}
                            />
                        </div>

                        {/* Info Box */}
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                            <h4 className="font-semibold text-amber-900 mb-2 text-sm">What you need</h4>
                            <ul className="text-xs text-amber-800 space-y-2">
                                <li className="flex gap-2">
                                    <span>✓</span>
                                    <span>Government-issued ID (National ID, Passport, etc.)</span>
                                </li>
                                <li className="flex gap-2">
                                    <span>✓</span>
                                    <span>Business registration (if applicable)</span>
                                </li>
                                <li className="flex gap-2">
                                    <span>✓</span>
                                    <span>Clear, legible images or PDF scans</span>
                                </li>
                            </ul>
                        </div>

                        {/* Benefits Box */}
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <h4 className="font-semibold text-green-900 mb-2 text-sm">After Verification</h4>
                            <ul className="text-xs text-green-800 space-y-2">
                                <li className="flex gap-2">
                                    <span>✓</span>
                                    <span>Get a verified badge on your profile</span>
                                </li>
                                <li className="flex gap-2">
                                    <span>✓</span>
                                    <span>Publish large events (50+ tickets)</span>
                                </li>
                                <li className="flex gap-2">
                                    <span>✓</span>
                                    <span>Withdraw your earnings instantly</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Continue Button (Onboarding) */}
                {isOnboarding && (
                    <div className="mt-8 pt-8 border-t border-gray-200">
                        <button
                            onClick={handleContinue}
                            className="w-full py-3 rounded-lg bg-pink-500 text-white font-bold hover:bg-pink-600 transition-colors"
                        >
                            Continue to Dashboard
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

