export default function BlurOverlay({ label = "Pro feature", cta = "Upgrade to Pro", onUpgrade }) {
    return (
        <div className="feature-blur-overlay" onClick={onUpgrade} role="button" tabIndex={0}>
            <div className="feature-blur-inner">
                <span className="feature-blur-label">{label}</span>
                <button type="button" className="feature-blur-cta">
                    {cta}
                </button>
            </div>
        </div>
    );
}
