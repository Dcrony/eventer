import { ArrowUpRight, Bolt, Globe, Sparkles, Users } from "lucide-react";
import Modal from "./ui/modal";
import Button from "./ui/button";
import useInstallPrompt from "../hooks/useInstallPrompt";

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

    if (!showPrompt) {
        return null;
    }

    const title = isIos ? "Add TickiSpot to your Home Screen" : "Install TickiSpot";
    const subtitle = isIos
        ? "Tap Share and then Add to Home Screen for the best mobile experience."
        : "Install TickiSpot as an app for faster access to tickets, live streams, and analytics.";

    return (
        <Modal
            open={showPrompt}
            onClose={dismiss}
            title={title}
            description={subtitle}
            className="pwa-install-modal-overlay"
            contentClassName="max-w-md w-full"
        >
            <div className="space-y-6">
                {/* Hero Section */}
                <div className="flex items-start gap-4 p-4 rounded-xl bg-gradient-to-br from-pink-50 to-purple-50 border border-pink-100">
                    <img src="/icon.svg" alt="TickiSpot logo" className="w-12 h-12" />
                    <div>
                        <h4 className="text-sm font-bold text-gray-900 mb-1">Keep TickiSpot handy</h4>
                        <p className="text-xs text-gray-600 leading-relaxed">
                            Open events, manage tickets, and watch live streams faster from your home screen.
                        </p>
                    </div>
                </div>

                {/* Benefits Grid */}
                <div className="space-y-3">
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Why install?</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {featureList.map((item) => {
                            const Icon = item.icon;
                            return (
                                <div key={item.title} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 border border-gray-200">
                                    <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-pink-100 flex items-center justify-center text-pink-500">
                                        <Icon size={16} />
                                    </div>
                                    <div>
                                        <strong className="text-xs font-bold text-gray-900 block mb-0.5">{item.title}</strong>
                                        <p className="text-[0.7rem] text-gray-500 leading-relaxed">{item.description}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* iOS Note */}
                {isIos && (
                    <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
                        <strong className="text-xs font-bold text-blue-800 block mb-1">For iPhone/iPad users</strong>
                        <p className="text-xs text-blue-700">
                            Tap the share icon and choose <strong>Add to Home Screen</strong> to install TickiSpot.
                        </p>
                    </div>
                )}

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <button
                        onClick={install}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-pink-500 text-white text-sm font-bold transition-all duration-200 hover:bg-pink-600 hover:-translate-y-0.5 shadow-md shadow-pink-500/25"
                    >
                        {canInstall ? "Install App" : "Add to Home Screen"}
                        <ArrowUpRight size={16} />
                    </button>
                    <button
                        onClick={dismiss}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full border-2 border-gray-200 bg-white text-gray-600 text-sm font-bold transition-all duration-200 hover:border-pink-300 hover:text-pink-500"
                    >
                        Maybe later
                    </button>
                </div>
            </div>
        </Modal>
    );
}