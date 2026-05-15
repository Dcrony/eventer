import { ArrowUpRight, Bolt, Globe, Sparkles, Users, X } from "lucide-react";
import useInstallPrompt from "../hooks/useInstallPrompt";
import { useEffect, useRef } from "react";

const featureList = [
    {
        icon: Bolt,
        title: "Faster access",
        description: "Launch TickiSpot quickly from your home screen without opening the browser.",
    },
    {
        icon: Users,
        title: "Real-time ticket updates",
        description: "Receive faster event and ticket updates while browsing or watching live streams.",
    },
    {
        icon: Globe,
        title: "Live streaming ready",
        description: "Watch live events and manage tickets from a native-like experience.",
    },
    {
        icon: Sparkles,
        title: "Premium mobile UX",
        description: "Enjoy a native-app-like interface optimized for phones and tablets.",
    },
];

export default function PwaInstallModal() {
    const { canInstall, install, isIos, showPrompt, dismiss } = useInstallPrompt();
    const overlayRef = useRef(null);

    // Lock body scroll while open (matches FollowersModal)
    useEffect(() => {
        document.body.style.overflow = showPrompt ? "hidden" : "";
        return () => { document.body.style.overflow = ""; };
    }, [showPrompt]);

    // Escape key dismiss (matches FollowersModal)
    useEffect(() => {
        if (!showPrompt) return;
        const handler = (e) => { if (e.key === "Escape") dismiss(); };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [showPrompt, dismiss]);

    if (!showPrompt) return null;

    return (
        <div
            ref={overlayRef}
            className="fixed inset-0 z-[10010] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4"
            onClick={(e) => { if (e.target === overlayRef.current) dismiss(); }}
        >
            <div className="relative w-full sm:max-w-md bg-white sm:rounded-2xl rounded-t-2xl overflow-hidden shadow-2xl border border-gray-200 flex flex-col max-h-[85vh] sm:max-h-[600px] animate-slide-up">

                {/* Header — matches FollowersModal exactly */}
                <div className="flex items-center justify-between px-5 pt-5 pb-3 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <img src="/icon.svg" alt="TickiSpot" className="w-8 h-8 rounded-xl" />
                        <div>
                            <h2 className="text-base font-extrabold tracking-tight text-gray-900 leading-tight">
                                {isIos ? "Add to Home Screen" : "Install TickiSpot"}
                            </h2>
                            <p className="text-[0.7rem] text-gray-400 leading-tight mt-0.5">
                                Get the full app experience
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={dismiss}
                        className="w-8 h-8 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-400 transition-all duration-200 hover:bg-red-50 hover:border-red-200 hover:text-red-500 hover:rotate-90"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Scrollable body */}
                <div className="flex-1 overflow-y-auto">

                    {/* Hero strip — uses same bg treatment as modal list area */}
                    <div className="px-5 pb-4 flex-shrink-0 border-b border-gray-100">
                        <div className="flex items-start gap-3 p-3.5 rounded-xl bg-gradient-to-br from-pink-50 to-purple-50 border border-pink-100">
                            <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-pink-100 flex items-center justify-center">
                                <Sparkles size={16} className="text-pink-500" />
                            </div>
                            <p className="text-xs text-gray-600 leading-relaxed">
                                {isIos
                                    ? "Tap the share icon then choose Add to Home Screen for the best mobile experience."
                                    : "Install TickiSpot as an app for faster access to tickets, live streams, and analytics."}
                            </p>
                        </div>
                    </div>

                    {/* Features — styled like the user rows in FollowersModal */}
                    <div className="flex-shrink-0">
                        <p className="px-5 pt-4 pb-2 text-xs font-bold uppercase tracking-wider text-gray-400">
                            Why install?
                        </p>
                        {featureList.map((item) => {
                            const Icon = item.icon;
                            return (
                                <div
                                    key={item.title}
                                    className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors duration-150 border-b border-gray-50 last:border-b-0"
                                >
                                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-pink-50 border border-pink-100 flex items-center justify-center text-pink-500 shadow-sm">
                                        <Icon size={16} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <strong className="text-sm font-bold text-gray-900 block">
                                            {item.title}
                                        </strong>
                                        <p className="text-xs text-gray-400 leading-relaxed mt-0.5">
                                            {item.description}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* iOS note */}
                    {isIos && (
                        <div className="px-5 py-4 border-t border-gray-100">
                            <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200">
                                <strong className="text-xs font-bold text-blue-800 block mb-1">
                                    For iPhone / iPad
                                </strong>
                                <p className="text-xs text-blue-700 leading-relaxed">
                                    Tap the <strong>Share</strong> icon at the bottom of Safari, then choose{" "}
                                    <strong>Add to Home Screen</strong>.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer — matches FollowersModal footer count bar */}
                <div className="px-5 py-3 border-t border-gray-100 flex-shrink-0 bg-gray-50">
                    <div className="flex flex-col sm:flex-row gap-2.5">
                        <button
                            onClick={install}
                            className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-pink-500 text-white text-sm font-bold transition-all duration-200 hover:bg-pink-600 hover:-translate-y-0.5 shadow-md shadow-pink-500/25"
                        >
                            {canInstall ? "Install App" : "Add to Home Screen"}
                            <ArrowUpRight size={15} />
                        </button>
                        <button
                            onClick={dismiss}
                            className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full border-2 border-gray-200 bg-white text-gray-600 text-sm font-bold transition-all duration-200 hover:border-pink-300 hover:text-pink-500"
                        >
                            Maybe later
                        </button>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes slide-up {
                    from { opacity: 0; transform: translateY(24px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                .animate-slide-up { animation: slide-up 0.25s cubic-bezier(0.34,1.56,0.64,1); }
            `}</style>
        </div>
    );
}