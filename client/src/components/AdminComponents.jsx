import { Loader2, AlertTriangle, CheckCircle2 } from "lucide-react";

export function StatCard({ icon: Icon, label, value, detail }) {
    return (
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <p className="text-sm font-semibold text-slate-400 uppercase tracking-[0.2em]">{label}</p>
                    <p className="mt-3 text-3xl font-bold text-slate-950">{value}</p>
                </div>
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-pink-50 text-pink-600">
                    <Icon size={20} />
                </div>
            </div>
            {detail ? <p className="mt-4 text-sm text-slate-500">{detail}</p> : null}
        </div>
    );
}

export function LoadingSpinner() {
    return (
        <div className="flex min-h-[240px] items-center justify-center rounded-3xl border border-slate-200 bg-white shadow-sm">
            <Loader2 className="h-10 w-10 animate-spin text-pink-500" />
        </div>
    );
}

export function ErrorMessage({ message, onDismiss }) {
    return (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-4 text-rose-700 shadow-sm">
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                    <AlertTriangle size={18} />
                    <span className="text-sm font-semibold">Error</span>
                </div>
                {onDismiss ? (
                    <button onClick={onDismiss} className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-600">
                        Dismiss
                    </button>
                ) : null}
            </div>
            <p className="mt-2 text-sm leading-6">{message}</p>
        </div>
    );
}

export function SuccessMessage({ message }) {
    return (
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-700 shadow-sm">
            <div className="flex items-center gap-2">
                <CheckCircle2 size={18} />
                <span className="text-sm font-medium">{message}</span>
            </div>
        </div>
    );
}

export function WarningMessage({ message }) {
    return (
        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-4 text-amber-700 shadow-sm">
            <div className="flex items-center gap-2">
                <ExclamationTriangle size={18} />
                <span className="text-sm font-medium">{message}</span>
            </div>
        </div>
    );
}
