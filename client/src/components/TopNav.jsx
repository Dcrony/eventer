import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { X, ChevronRight, LogOut } from "lucide-react";
import { logout } from "../utils/auth";
import { useAuth } from "../context/AuthContext";
import { useCreateEvent } from "../context/CreateEventContext";
import { getProfileImageUrl } from "../utils/eventHelpers";
import { buildNavSections } from "../config/navigation";
import NotificationIndicator from "./NotificationIndicator";
import Avatar from "./ui/avatar";

export default function TopNav() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { openCreateEvent } = useCreateEvent();

  const { sections, footer, profileUrl } = buildNavSections({ user, openCreateEvent });

  const closeMenu = () => {
    setIsMenuOpen(false);
    document.body.style.overflow = "";
  };

  const openMenu = () => {
    setIsMenuOpen(true);
    document.body.style.overflow = "hidden";
  };

  const handleLogout = () => {
    if (window.confirm("Logout from your account?")) {
      logout();
      navigate("/login");
      closeMenu();
    }
  };

  const goToProfile = () => {
    if (!user) return;
    navigate(profileUrl || `/users/${user._id || user.id}`);
    closeMenu();
  };

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2">
          <Link to="/" className="flex items-center">
            <span className="bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-xl font-extrabold tracking-tight text-transparent">
              TickiSpot
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <NotificationIndicator compact={false} />
            <button
              type="button"
              className="flex items-center gap-2 rounded-full bg-gray-100 p-1 transition-colors hover:bg-gray-200"
              onClick={openMenu}
              aria-label="Open menu"
            >
              <Avatar
                src={user ? getProfileImageUrl(user) : null}
                name={user?.name || "User"}
                className="h-8 w-8 rounded-full"
              />
            </button>
          </div>
        </div>
      </header>

      {isMenuOpen && (
        <div
          className="fixed inset-0 z-50 animate-fade-in bg-black/40 backdrop-blur-sm"
          onClick={closeMenu}
          role="presentation"
        />
      )}

      <aside
        className={`fixed top-0 right-0 z-[100] h-full w-80 max-w-[85vw] transform bg-white shadow-2xl transition-transform duration-300 ease-out ${
          isMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="border-b border-gray-100 p-5">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Menu</span>
            <button
              type="button"
              onClick={closeMenu}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-pink-500"
            >
              <X size={18} />
            </button>
          </div>

          {user && (
            <button
              type="button"
              onClick={goToProfile}
              className="flex w-full cursor-pointer items-center gap-3 rounded-xl border border-transparent bg-gray-50 p-3 transition-colors hover:border-pink-200 hover:bg-pink-50"
            >
              <Avatar src={getProfileImageUrl(user)} name={user.name} className="h-12 w-12 rounded-xl" />
              <div className="min-w-0 flex-1 text-left">
                <h4 className="truncate text-sm font-bold text-gray-900">{user.name}</h4>
                <p className="truncate text-xs text-gray-500">@{user.username}</p>
              </div>
              <ChevronRight size={16} className="shrink-0 text-gray-400" />
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto py-3">
          {sections.map((section) => (
            <div key={section.id} className="border-t border-gray-100 px-4 py-3 first:border-t-0">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                {section.label}
              </p>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  if (item.type === "action") {
                    return (
                      <button
                        key={item.label}
                        type="button"
                        onClick={() => {
                          item.action?.();
                          closeMenu();
                        }}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-pink-600 transition-colors hover:bg-pink-50"
                      >
                        <item.icon size={18} />
                        {item.label}
                      </button>
                    );
                  }
                  if (!item.to) return null;
                  return (
                    <MenuLink
                      key={item.to}
                      to={item.to}
                      icon={<item.icon size={18} />}
                      label={item.label}
                      onClick={closeMenu}
                    />
                  );
                })}
              </div>
            </div>
          ))}

          <div className="border-t border-gray-100 px-4 py-3">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">Account</p>
            <div className="space-y-0.5">
              {footer.map((item) => {
                if (item.type === "logout") {
                  return (
                    <button
                      key="logout"
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-red-600 transition-colors hover:bg-red-50"
                    >
                      <item.icon size={18} />
                      <span className="text-sm font-semibold">Sign out</span>
                    </button>
                  );
                }
                if (item.type === "notification") return null;
                return (
                  <MenuLink
                    key={item.to}
                    to={item.to}
                    icon={<item.icon size={18} />}
                    label={item.label}
                    onClick={closeMenu}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

function MenuLink({ to, icon, label, onClick }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-gray-700 transition-colors hover:bg-pink-50 hover:text-pink-600"
    >
      <span className="shrink-0 text-gray-400 transition-colors group-hover:text-pink-500">{icon}</span>
      <span className="flex-1 text-sm font-semibold">{label}</span>
      <ChevronRight size={14} className="text-gray-300 transition-colors group-hover:text-pink-400" />
    </Link>
  );
}
