export default function SettingsSection({ title, description, children, actions }) {
  return (
    <div className="settings-section">
      <div className="settings-section-heading">
        <div>
          <h3>{title}</h3>
          {description ? <p>{description}</p> : null}
        </div>
        {actions ? <div className="settings-section-actions">{actions}</div> : null}
      </div>
      <div className="settings-section-body">{children}</div>
    </div>
  );
}
