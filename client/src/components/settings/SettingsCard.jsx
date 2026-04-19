export default function SettingsCard({
  title,
  description,
  icon,
  action,
  children,
  tone = "default",
}) {
  return (
    <section className={`settings-card settings-card-${tone}`}>
      <header className="settings-card-header">
        <div className="settings-card-title-wrap">
          <span className="settings-card-icon">{icon}</span>
          <div>
            <h2>{title}</h2>
            {description ? <p>{description}</p> : null}
          </div>
        </div>
        {action ? <div className="settings-card-action">{action}</div> : null}
      </header>
      <div className="settings-card-body">{children}</div>
    </section>
  );
}
