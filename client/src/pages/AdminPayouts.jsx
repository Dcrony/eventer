import { useEffect, useState } from "react";
import AdminLayout from "../components/AdminLayout";
import { listPayouts, adminAction } from "../services/api/payouts";
import { formatCurrency, formatDateTime } from "../utils/adminUtils";
import { useToast } from "../components/ui/toast";

export default function AdminPayouts() {
    const toast = useToast();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetch = async () => {
        try {
            setLoading(true);
            const res = await listPayouts({ page: 1, limit: 50 });
            setItems(res.items || []);
        } catch (e) {
            toast.error(e.response?.data?.message || "Failed to load payouts");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetch(); }, []);

    const doAction = async (id, action) => {
        try {
            const res = await adminAction(id, action, `${action} by admin`);
            toast.success(`${action} queued`);
            fetch();
        } catch (e) {
            toast.error(e.response?.data?.message || "Action failed");
        }
    };

    return (
        <AdminLayout title="Payouts" description="Review and manage organizer payouts.">
            <div className="space-y-4">
                <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                    <h3 className="text-sm font-semibold text-gray-700">Recent Payouts</h3>
                    <div className="mt-3 overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead className="text-left text-xs text-gray-500">
                                <tr>
                                    <th className="px-3 py-2">Organizer</th>
                                    <th className="px-3 py-2">Amount</th>
                                    <th className="px-3 py-2">State</th>
                                    <th className="px-3 py-2">Created</th>
                                    <th className="px-3 py-2">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((p) => (
                                    <tr key={p._id} className="border-t">
                                        <td className="px-3 py-2">{p.organizer?.name || p.organizer?.username}</td>
                                        <td className="px-3 py-2">{formatCurrency(p.netAmount || 0)}</td>
                                        <td className="px-3 py-2">{p.state}</td>
                                        <td className="px-3 py-2">{formatDateTime(p.createdAt)}</td>
                                        <td className="px-3 py-2">
                                            <div className="flex gap-2">
                                                <button onClick={() => doAction(p._id, "release")} className="rounded bg-green-600 px-3 py-1 text-xs text-white">Release</button>
                                                <button onClick={() => doAction(p._id, "freeze")} className="rounded bg-yellow-500 px-3 py-1 text-xs text-white">Freeze</button>
                                                <button onClick={() => doAction(p._id, "refund")} className="rounded bg-red-600 px-3 py-1 text-xs text-white">Refund</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {loading && <div className="mt-2 text-sm text-gray-500">Loading...</div>}
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
