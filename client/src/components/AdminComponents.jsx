import {
    AlertTriangle,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Loader2,
    SearchX,
} from "lucide-react";

export function StatCard({ icon: Icon, label, value, detail, accent = false }) {
    return (
        <div className="relative rounded-2xl border border-gray-100 bg-white p-5 overflow-hidden">
            <div className={`absolute top-0 left-0 right-0 h-0.5 ${accent ? "bg-pink-500" : "bg-gray-100"}`} />
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-gray-400">{label}</p>
                    <p className="mt-2 text-2xl font-black text-gray-900 tabular-nums">{value}</p>
                </div>
                {Icon ? (
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-pink-50 text-pink-500">
                        <Icon size={18} />
                    </div>
                ) : null}
            </div>
            {detail ? <p className="mt-2 text-xs text-gray-400 leading-relaxed">{detail}</p> : null}
        </div>
    );
}

export function SurfaceCard({ children, className = "" }) {
    return (
        <div className={`rounded-2xl border border-gray-100 bg-white p-5 ${className}`.trim()}>
            {children}
        </div>
    );
}

export function LoadingSpinner({ label = "Loading..." }) {
    return (
        <div className="flex min-h-[220px] items-center justify-center rounded-2xl border border-gray-100 bg-white">
            <div className="text-center">
                <div className="mx-auto h-8 w-8 rounded-full border-2 border-pink-100 border-t-pink-500 animate-spin" />
                <p className="mt-3 text-xs font-medium text-gray-400">{label}</p>
            </div>
        </div>
    );
}

export function ErrorMessage({ message, onDismiss }) {
    return (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-red-700">
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                    <AlertTriangle size={15} className="text-red-500 flex-shrink-0" />
                    <span className="text-xs font-bold uppercase tracking-widest text-red-600">Error</span>
                </div>
                {onDismiss ? (
                    <button
                        onClick={onDismiss}
                        className="text-xs font-semibold text-red-400 hover:text-red-600 transition-colors"
                    >
                        Dismiss
                    </button>
                ) : null}
            </div>
            <p className="mt-1.5 text-sm leading-relaxed text-red-700">{message}</p>
        </div>
    );
}

export function SuccessMessage({ message }) {
    return (
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
            <div className="flex items-center gap-2">
                <CheckCircle2 size={15} className="text-emerald-500" />
                <span className="text-sm font-medium text-emerald-700">{message}</span>
            </div>
        </div>
    );
}

export function WarningMessage({ message }) {
    return (
        <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
            <div className="flex items-center gap-2">
                <AlertTriangle size={15} className="text-amber-500" />
                <span className="text-sm font-medium text-amber-700">{message}</span>
            </div>
        </div>
    );
}

export function EmptyState({ icon: Icon = SearchX, title, description, action }) {
    return (
        <div className="flex min-h-[220px] items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 px-6 py-10 text-center">
            <div>
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100">
                    <Icon size={20} className="text-gray-300" />
                </div>
                <h3 className="text-sm font-bold text-gray-700">{title}</h3>
                <p className="mt-1 max-w-xs text-xs text-gray-400 leading-relaxed">{description}</p>
                {action ? <div className="mt-4">{action}</div> : null}
            </div>
        </div>
    );
}

export function StatusBadge({ tone = "gray", children }) {
    const tones = {
        green: "bg-emerald-50 text-emerald-700 border-emerald-100",
        amber: "bg-amber-50 text-amber-700 border-amber-100",
        red: "bg-red-50 text-red-700 border-red-100",
        pink: "bg-pink-50 text-pink-700 border-pink-100",
        gray: "bg-gray-50 text-gray-600 border-gray-100",
        blue: "bg-blue-50 text-blue-700 border-blue-100",
        slate: "bg-slate-50 text-slate-600 border-slate-100",
        emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
        rose: "bg-rose-50 text-rose-700 border-rose-100",
        purple: "bg-purple-50 text-purple-700 border-purple-100",
    };

    return (
        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${tones[tone] || tones.gray}`}>
            {children}
        </span>
    );
}

export function PaginationControls({ page, pages, onPrevious, onNext, total, label = "results" }) {
    return (
        <div className="flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-4 md:flex-row md:items-center md:justify-between">
            <p className="text-xs text-gray-400">
                Page <span className="font-semibold text-gray-700">{page}</span> of <span className="font-semibold text-gray-700">{pages}</span>
                {typeof total === "number" ? <span> · <span className="font-semibold text-gray-700">{total.toLocaleString()}</span> {label}</span> : ""}
            </p>
            <div className="flex items-center gap-2">
                <button
                    type="button"
                    onClick={onPrevious}
                    disabled={page <= 1}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-600 transition-all hover:border-pink-200 hover:text-pink-500 disabled:cursor-not-allowed disabled:opacity-40"
                >
                    <ChevronLeft size={13} />
                    Previous
                </button>
                <button
                    type="button"
                    onClick={onNext}
                    disabled={page >= pages}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-600 transition-all hover:border-pink-200 hover:text-pink-500 disabled:cursor-not-allowed disabled:opacity-40"
                >
                    Next
                    <ChevronRight size={13} />
                </button>
            </div>
        </div>
    );
}

export function SectionHeader({ icon: Icon, title, subtitle, action }) {
    return (
        <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
                {Icon && (
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-pink-50 text-pink-500">
                        <Icon size={17} />
                    </div>
                )}
                <div>
                    <h3 className="text-sm font-bold text-gray-900">{title}</h3>
                    {subtitle && <p className="mt-0.5 text-xs text-gray-400">{subtitle}</p>}
                </div>
            </div>
            {action && <div>{action}</div>}
        </div>
    );
}

export function TableWrapper({ children }) {
    return (
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-100 text-sm">
                    {children}
                </table>
            </div>
        </div>
    );
}

export function TableHead({ columns }) {
    return (
        <thead className="bg-gray-50">
            <tr>
                {columns.map((col) => (
                    <th key={col} className="px-4 py-3 text-left text-[0.65rem] font-bold uppercase tracking-[0.12em] text-gray-400">
                        {col}
                    </th>
                ))}
            </tr>
        </thead>
    );
}

export function PinkButton({ onClick, disabled, children, size = "md", variant = "solid", className = "" }) {
    const sizes = {
        sm: "px-3 py-1.5 text-xs",
        md: "px-4 py-2 text-sm",
        lg: "px-5 py-2.5 text-sm",
    };
    const variants = {
        solid: "bg-pink-500 text-white hover:bg-pink-600 border-transparent",
        outline: "bg-white text-pink-600 border-pink-200 hover:bg-pink-50",
        ghost: "bg-transparent text-pink-600 border-transparent hover:bg-pink-50",
    };
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={`inline-flex items-center gap-2 rounded-xl border font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${sizes[size]} ${variants[variant]} ${className}`}
        >
            {children}
        </button>
    );
}