export default function SettingsToggle({ icon, label, description, checked, onChange }) {
  return (
    <label className="settings-toggle">
      <div className="settings-toggle-copy">
        <span className="settings-toggle-icon">{icon}</span>
        <div>
          <strong>{label}</strong>
          {description ? <p>{description}</p> : null}
        </div>
      </div>
      <span className={`settings-toggle-switch ${checked ? "is-on" : ""}`}>
        <input type="checkbox" checked={checked} onChange={onChange} />
        <span className="settings-toggle-thumb" />
      </span>
    </label>
  );
}
