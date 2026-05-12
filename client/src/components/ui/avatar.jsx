import { useEffect, useState } from "react";
import { getProfileImageUrl } from "../../utils/eventHelpers";

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
export default function Avatar({ src, alt, name = "User", className = "", size = "md" }) {
  const [imgFailed, setImgFailed] = useState(false);
  const displayName = name || alt || "User";
  const initials = getAvatarInitials(displayName);

  const sizeClasses = {
    xs: "h-6 w-6 text-[10px]",
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-12 w-12 text-base",
    xl: "h-16 w-16 text-lg",
  };

  useEffect(() => {
    setImgFailed(false);
  }, [src]);

  const showFallback = !src || imgFailed;

  return (
    <div
      className={`relative flex-shrink-0 overflow-hidden rounded-full border border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center font-semibold text-gray-500 ${sizeClasses[size]} ${className}`}
      role="img"
      aria-label={alt || displayName}
    >
      {!showFallback ? (
        <img
          src={src}
          alt={alt || displayName || ""}
          className="h-full w-full object-cover"
          onError={() => setImgFailed(true)}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-pink-100 to-pink-200 font-bold text-pink-600">
          {initials}
        </div>
      )}
    </div>
  );
}

/** Convenience: resolves `profilePic` / Cloudinary / legacy paths via getProfileImageUrl */
export function UserAvatar({ user, name: nameProp, className = "", alt, size = "md" }) {
  const src = user ? getProfileImageUrl(user) : null;
  const name = nameProp ?? user?.name ?? user?.username ?? "User";
  return <Avatar src={src} name={name} className={className} alt={alt} size={size} />;
}