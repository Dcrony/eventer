import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import VerifiedBadge from "../components/ui/verified-badge";
import API from "../api/axios";
import { submitVerification, getMyVerification } from "../services/api/verification";
import Button from "../components/ui/button";
import Avatar from "../components/ui/avatar";
import { getProfileImageUrl } from "../utils/eventHelpers";

export default function VerificationPage() {
    const navigate = useNavigate();
    const [verification, setVerification] = useState(null);
    const [files, setFiles] = useState([]);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                const { data } = await getMyVerification();
                setVerification(data.verification || null);
            } catch (e) {
                // ignore
            }
        })();
    }, []);

    const onFiles = (e) => {
        setFiles(Array.from(e.target.files || []).slice(0, 6));
    };

    const handleSubmit = async () => {
        if (!files.length) return alert("Please select at least one document");
        try {
            setSubmitting(true);
            const fd = new FormData();
            files.forEach((f) => fd.append("documents", f));
            const types = files.map((f) => f.type || "document");
            fd.append("types", JSON.stringify(types));
            const { data } = await submitVerification(fd);
            setVerification(data.verification || null);
        } catch (e) {
            console.error(e);
            alert("Upload failed. Try again.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-4">
            <div className="bg-white border border-gray-200 rounded-xl p-5">
                <div className="flex items-center gap-4">
                    <Avatar src={getProfileImageUrl({})} name={"You"} className="w-16 h-16" />
                    <div>
                        <h2 className="text-lg font-bold">Organizer Verification</h2>
                        <p className="text-sm text-gray-500">Submit official documents to get the verified organizer badge.</p>
                    </div>
                </div>

                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-semibold mb-2">Upload documents</label>
                        <input type="file" multiple accept="image/*,.pdf" onChange={onFiles} />
                        <p className="text-xs text-gray-400 mt-2">You can upload up to 6 files. Supported: images & PDF.</p>
                        <div className="mt-3 flex gap-2 flex-wrap">
                            {files.map((f, i) => (
                                <div key={i} className="px-2 py-1 bg-gray-100 rounded-md text-xs">{f.name}</div>
                            ))}
                        </div>
                        <div className="mt-4">
                            <Button onClick={handleSubmit} disabled={submitting}>
                                {submitting ? "Submitting..." : (verification ? "Resubmit documents" : "Submit for verification")}
                            </Button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold mb-2">Status</label>
                        <div className="p-3 border border-gray-100 rounded-md bg-gray-50">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <strong className="text-sm">{verification?.status ? verification.status.toUpperCase() : "No submission"}</strong>
                                        {verification?.status === "approved" && <VerifiedBadge user={{ isVerified: true, role: "organizer" }} />}
                                    </div>
                                    {verification?.status === "rejected" && (
                                        <p className="text-xs text-rose-500 mt-2">Reason: {verification.rejectionReason || "Not specified"}</p>
                                    )}
                                    {verification?.status === "pending" && (
                                        <p className="text-xs text-gray-500 mt-2">Your submission is under review. We'll notify you once complete.</p>
                                    )}
                                </div>
                                <div>
                                    {verification?.reviewedAt && <small className="text-xs text-gray-400">Reviewed: {new Date(verification.reviewedAt).toLocaleString()}</small>}
                                </div>
                            </div>
                            <div className="mt-3">
                                <h4 className="text-xs font-semibold">Submitted documents</h4>
                                <div className="mt-2 flex gap-2 flex-wrap">
                                    {verification?.documents?.length ? verification.documents.map((d, i) => (
                                        <a key={i} href={d.url} target="_blank" rel="noreferrer" className="px-2 py-1 bg-white border rounded text-xs">{d.type || 'document'}</a>
                                    )) : <p className="text-xs text-gray-400">No documents uploaded yet.</p>}
                                </div>
                            </div>
                        </div>
                        <div className="mt-4 text-sm text-gray-500">
                            <p>After approval the verified badge will appear across your profile and events. Verification may take up to 48 hours.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
