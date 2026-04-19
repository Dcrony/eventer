import './avatar.css';

export default function Avatar({ src, alt, name = "U", className = "" }) {
  const letter = String(name || "U").charAt(0).toUpperCase();

  return (
    <div className={`avatar ${className}`}>
      {src ? (
        <img src={src} alt={alt || name} className="avatar-img" />
      ) : (
        <div className="avatar-fallback">
          {letter}
        </div>
      )}
    </div>
  );
}

