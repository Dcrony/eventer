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
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-400">{label}</p>
                    <p className="mt-2 text-2xl font-extrabold text-gray-900">{value}</p>
                </div>
                {Icon ? (
                    <div className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-pink-50 text-pink-500">
                        <Icon size={20} />
                    </div>
                ) : null}
            </div>
            {detail ? <p className="mt-3 text-xs text-gray-500">{detail}</p> : null}
        </div>
    );
}

export function SurfaceCard({ children, className = "" }) {
    return <div className={`rounded-xl border border-gray-200 bg-white p-5 shadow-sm ${className}`.trim()}>{children}</div>;
}

export function LoadingSpinner({ label = "Loading..." }) {
    return (
        <div className="flex min-h-[240px] items-center justify-center rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="text-center">
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-pink-500" />
                <p className="mt-2 text-sm text-gray-500">{label}</p>
            </div>
        </div>
    );
}

export function ErrorMessage({ message, onDismiss }) {
    return (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700 shadow-sm">
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                    <AlertTriangle size={16} />
                    <span className="text-xs font-bold uppercase tracking-wider">Error</span>
                </div>
                {onDismiss ? (
                    <button onClick={onDismiss} className="text-xs font-bold uppercase tracking-wider text-red-600 hover:text-red-700">
                        Dismiss
                    </button>
                ) : null}
            </div>
            <p className="mt-1 text-sm leading-relaxed">{message}</p>
        </div>
    );
}

export function SuccessMessage({ message }) {
    return (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-green-700 shadow-sm">
            <div className="flex items-center gap-2">
                <CheckCircle2 size={16} />
                <span className="text-sm font-medium">{message}</span>
            </div>
        </div>
    );
}

export function WarningMessage({ message }) {
    return (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-700 shadow-sm">
            <div className="flex items-center gap-2">
                <AlertTriangle size={16} />
                <span className="text-sm font-medium">{message}</span>
            </div>
        </div>
    );
}

export function EmptyState({ icon: Icon = SearchX, title, description, action }) {
    return (
        <div className="flex min-h-[240px] items-center justify-center rounded-xl border border-gray-200 bg-white px-6 py-10 text-center shadow-sm">
            <div>
                <Icon className="mx-auto h-10 w-10 text-gray-300" />
                <h3 className="mt-3 text-sm font-bold text-gray-900">{title}</h3>
                <p className="mt-1 max-w-md text-xs text-gray-500 leading-relaxed">{description}</p>
                {action ? <div className="mt-4">{action}</div> : null}
            </div>
        </div>
    );
}

export function StatusBadge({ tone = "gray", children }) {
    const tones = {
        green: "bg-green-100 text-green-700",
        amber: "bg-amber-100 text-amber-700",
        red: "bg-red-100 text-red-700",
        pink: "bg-pink-100 text-pink-700",
        gray: "bg-gray-100 text-gray-700",
        blue: "bg-blue-100 text-blue-700",
        slate: "bg-slate-100 text-slate-700",
        emerald: "bg-emerald-100 text-emerald-700",
        rose: "bg-rose-100 text-rose-700",
    };

    return (
        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${tones[tone] || tones.gray}`}>
            {children}
        </span>
    );
}

export function PaginationControls({ page, pages, onPrevious, onNext, total, label = "results" }) {
    return (
        <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
            <p className="text-xs text-gray-500">
                Page {page} of {pages} {typeof total === "number" ? `- ${total.toLocaleString()} ${label}` : ""}
            </p>
            <div className="flex flex-wrap items-center gap-2">
                <button
                    type="button"
                    onClick={onPrevious}
                    disabled={page <= 1}
                    className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-600 transition-all duration-200 hover:border-pink-300 hover:text-pink-500 disabled:cursor-not-allowed disabled:opacity-40"
                >
                    <ChevronLeft size={14} />
                    Previous
                </button>
                <button
                    type="button"
                    onClick={onNext}
                    disabled={page >= pages}
                    className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-600 transition-all duration-200 hover:border-pink-300 hover:text-pink-500 disabled:cursor-not-allowed disabled:opacity-40"
                >
                    Next
                    <ChevronRight size={14} />
                </button>
            </div>
        </div>
    );
}