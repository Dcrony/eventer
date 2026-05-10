import {
    AlertTriangle,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Loader2,
    SearchX,
} from "lucide-react";

export function StatCard({ icon: Icon, label, value, detail }) {
    return (
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">{label}</p>
                    <p className="mt-3 text-3xl font-bold text-slate-950">{value}</p>
                </div>
                {Icon ? (
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-pink-50 text-pink-600">
                        <Icon size={20} />
                    </div>
                ) : null}
            </div>
            {detail ? <p className="mt-4 text-sm text-slate-500">{detail}</p> : null}
        </div>
    );
}

export function SurfaceCard({ children, className = "" }) {
    return <div className={`rounded-3xl border border-slate-200 bg-white p-5 shadow-sm ${className}`.trim()}>{children}</div>;
}

export function LoadingSpinner({ label = "Loading..." }) {
    return (
        <div className="flex min-h-[240px] items-center justify-center rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="text-center">
                <Loader2 className="mx-auto h-10 w-10 animate-spin text-pink-500" />
                <p className="mt-3 text-sm text-slate-500">{label}</p>
            </div>
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
                <AlertTriangle size={18} />
                <span className="text-sm font-medium">{message}</span>
            </div>
        </div>
    );
}

export function EmptyState({ icon: Icon = SearchX, title, description, action }) {
    return (
        <div className="flex min-h-[240px] items-center justify-center rounded-3xl border border-slate-200 bg-white px-6 py-10 text-center shadow-sm">
            <div>
                <Icon className="mx-auto h-12 w-12 text-slate-300" />
                <h3 className="mt-4 text-base font-semibold text-slate-900">{title}</h3>
                <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">{description}</p>
                {action ? <div className="mt-5">{action}</div> : null}
            </div>
        </div>
    );
}

export function StatusBadge({ tone = "slate", children }) {
    const tones = {
        emerald: "bg-emerald-100 text-emerald-700",
        amber: "bg-amber-100 text-amber-700",
        rose: "bg-rose-100 text-rose-700",
        pink: "bg-pink-100 text-pink-700",
        slate: "bg-slate-100 text-slate-700",
        blue: "bg-sky-100 text-sky-700",
    };

    return (
        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${tones[tone] || tones.slate}`}>
            {children}
        </span>
    );
}

export function PaginationControls({ page, pages, onPrevious, onNext, total, label = "results" }) {
    return (
        <div className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
            <p className="text-sm text-slate-500">
                Page {page} of {pages} {typeof total === "number" ? `- ${total} ${label}` : ""}
            </p>
            <div className="flex flex-wrap items-center gap-2">
                <button
                    type="button"
                    onClick={onPrevious}
                    disabled={page <= 1}
                    className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                    <ChevronLeft size={16} />
                    Previous
                </button>
                <button
                    type="button"
                    onClick={onNext}
                    disabled={page >= pages}
                    className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                    Next
                    <ChevronRight size={16} />
                </button>
            </div>
        </div>
    );
}
