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
        description: "Enjoy a native app-like interface optimized for phones and tablets.",
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
            contentClassName="pwa-install-modal-shell"
        >
            <div className="pwa-install-modal-body">
                <div className="pwa-install-hero">
                    <img src="/icon.svg" alt="TickiSpot logo" className="pwa-install-logo" />
                    <div>
                        <h4>Keep TickiSpot handy</h4>
                        <p>Open events, manage tickets, and watch live streams faster from your home screen.</p>
                    </div>
                </div>

                <div className="pwa-install-benefits">
                    {featureList.map((item) => {
                        const Icon = item.icon;
                        return (
                            <div key={item.title} className="pwa-install-benefit">
                                <div className="pwa-install-benefit-icon">
                                    <Icon size={18} />
                                </div>
                                <div>
                                    <strong>{item.title}</strong>
                                    <p>{item.description}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {isIos ? (
                    <div className="pwa-install-ios-note">
                        <strong>For iPhone/iPad users</strong>
                        <p>Tap the share icon and choose <strong>Add to Home Screen</strong> to install TickiSpot.</p>
                    </div>
                ) : null}

                <div className="pwa-install-actions">
                    <Button onClick={install} className="pwa-install-action-button" size="lg">
                        {canInstall ? "Install App" : "Add to Home Screen"}
                        <ArrowUpRight size={16} />
                    </Button>
                    <Button variant="secondary" onClick={dismiss} size="lg">
                        Maybe later
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
