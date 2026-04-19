import { useEffect, useState } from "react";
import { getProfileImageUrl } from "../../utils/eventHelpers";
import "./avatar.css";

/** One or two initials from display name */
export function getAvatarInitials(name) {
  if (name == null || name === "") return "U";
  const t = String(name).trim();
  if (!t) return "U";
  const parts = t.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  if (t.length >= 2) return t.slice(0, 2).toUpperCase();
  return t.charAt(0).toUpperCase();
}

/**
 * Rounds profile image with automatic initials fallback when missing or failed to load.
 */
export default function Avatar({ src, alt, name = "User", className = "" }) {
  const [imgFailed, setImgFailed] = useState(false);
  const displayName = name || alt || "User";
  const initials = getAvatarInitials(displayName);

  useEffect(() => {
    setImgFailed(false);
  }, [src]);

  const showFallback = !src || imgFailed;

  return (
    <div
      className={`avatar ${initials.length > 1 ? "avatar--two" : ""} ${className}`.trim()}
      role="img"
      aria-label={alt || displayName}
    >
      {!showFallback ? (
        <img
          src={src}
          alt={alt || displayName || ""}
          className="avatar-img"
          onError={() => setImgFailed(true)}
        />
      ) : (
        <div className="avatar-fallback">{initials}</div>
      )}
    </div>
  );
}

/** Convenience: resolves `profilePic` / Cloudinary / legacy paths via getProfileImageUrl */
export function UserAvatar({ user, name: nameProp, className = "", alt }) {
  const src = user ? getProfileImageUrl(user) : null;
  const name = nameProp ?? user?.name ?? user?.username ?? "User";
  return <Avatar src={src} name={name} className={className} alt={alt} />;
}
