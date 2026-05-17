import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { logout, getCurrentUser } from "../utils/auth";
import { useCreateEvent } from "../context/CreateEventContext";
import NotificationBell from "./NotificationBell";
import MessageIndicator from "./MessageIndicator";
import Tooltip from "./ui/tooltip";
import { buildNavSections } from "../config/navigation";
import { cn } from "../lib/utils";
import { COLLAPSED, EXPANDED } from "../hooks/useSidebarWidth";
import icon from "../assets/icon.svg";
import { ChevronLeft, ChevronRight } from "lucide-react";

function NavItem({ item, expand, isActive, location }) {
  const Icon = item.icon;
  const baseClass = cn(
    "flex items-center rounded-xl transition-all duration-200 w-full",
    expand ? "gap-3 px-3 py-2.5" : "justify-center h-10 w-10 mx-auto",
    item.primary
      ? "bg-pink-500 text-white shadow-md shadow-pink-500/25 hover:bg-pink-600"
      : isActive
        ? "bg-pink-50 text-pink-600"
        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
    item.highlight && !item.primary && "border border-pink-200 bg-pink-50/50",
  );

  const label = expand ? (
    <span className="text-sm font-semibold truncate">{item.label}</span>
  ) : null;

  const wrap = (node) =>
    !expand && item.label ? (
      <Tooltip content={item.label} className="w-full flex justify-center">
        {node}
      </Tooltip>
    ) : (
      node
    );

  if (item.type === "action") {
    return wrap(
      <button key={item.label} type="button" onClick={item.action} className={baseClass} title={item.label}>
        <Icon size={20} className="shrink-0" />
        {label}
      </button>,
    );
  }

  if (item.component === "MessageIndicator") {
    return wrap(
      <Link key={item.to} to={item.to} className={baseClass} title={!expand ? item.label : undefined}>
        <span className="shrink-0 flex items-center justify-center">
          <MessageIndicator />
        </span>
        {label}
      </Link>,
    );
  }

  return wrap(
    <Link
      key={item.to}
      to={item.to}
      className={baseClass}
      title={!expand ? item.label : undefined}
      aria-current={location.pathname === item.to ? "page" : undefined}
    >
      <Icon size={20} className="shrink-0" />
      {label}
    </Link>,
  );
}

function FooterItem({ item, expand, onLogout }) {
  const Icon = item.icon;
  const baseClass = cn(
    "flex items-center rounded-xl transition-all duration-200 w-full",
    expand ? "gap-3 px-3 py-2.5" : "justify-center h-10 w-10 mx-auto",
    item.type === "logout"
      ? "text-red-600 hover:bg-red-50"
      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
  );

  const label = expand ? <span className="text-sm font-semibold">{item.label}</span> : null;

  const wrap = (node) =>
    !expand ? (
      <Tooltip content={item.label} className="w-full flex justify-center">
        {node}
      </Tooltip>
    ) : (
      node
    );

  if (item.type === "notification") {
    return wrap(
      <div className={cn(baseClass, "text-gray-600")} key="notifications">
        <span className="shrink-0">
          <NotificationBell />
        </span>
        {label}
      </div>,
    );
  }

  if (item.type === "logout") {
    return wrap(
      <button key="logout" type="button" onClick={onLogout} className={baseClass} title={item.label}>
        <Icon size={20} className="shrink-0" />
        {label}
      </button>,
    );
  }

  return wrap(
    <Link key={item.to} to={item.to} className={baseClass} title={!expand ? item.label : undefined}>
      <Icon size={20} className="shrink-0" />
      {label}
    </Link>,
  );
}

export default function Sidebar() {
  const [user, setUser] = useState(null);
  const [expand, setExpand] = useState(false);
  const location = useLocation();
  const { openCreateEvent } = useCreateEvent();

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (currentUser) setUser(currentUser);

    const savedExpand = localStorage.getItem("sidebarexpand");
    if (savedExpand !== null) {
      setExpand(savedExpand === "true");
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("sidebarexpand", expand);
    document.documentElement.style.setProperty("--sidebar-width", expand ? EXPANDED : COLLAPSED);
  }, [expand]);

  if (!user) return null;

  const { sections, footer } = buildNavSections({ user, openCreateEvent });

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      logout();
    }
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 flex h-full flex-col border-r border-gray-200 bg-white shadow-sm ",
        expand ? "w-60" : "w-20",
      )}
    >
      <div className="flex shrink-0 items-center justify-between border-b border-gray-100 p-3">
        <Link to="/" className="flex min-w-0 items-center gap-2">
          <img src={icon} alt="TickiSpot" className="h-8 w-8 shrink-0" />
          {expand && <span className="truncate text-base font-bold text-gray-900">TickiSpot</span>}
        </Link>
        <button
          type="button"
          onClick={() => setExpand(!expand)}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-pink-500"
          aria-label={expand ? "Collapse sidebar" : "Expand sidebar"}
        >
          {expand ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
        </button>
      </div>

      <div className="sidebar-scroll flex-1 overflow-y-auto py-2">
        {sections.map((section) => (
          <div key={section.id} className="mb-1">
            {expand && section.label && (
              <p className="px-3 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                {section.label}
              </p>
            )}
            <nav className="space-y-0.5 px-2">
              {section.items.map((item) => (
                <NavItem
                  key={item.to || item.label}
                  item={item}
                  expand={expand}
                  isActive={item.to ? location.pathname === item.to : false}
                  location={location}
                />
              ))}
            </nav>
          </div>
        ))}
      </div>

      <div className="shrink-0 border-t border-gray-100 p-2">
        <nav className="space-y-0.5">
          {footer.map((item) => (
            <FooterItem key={item.label} item={item} expand={expand} onLogout={handleLogout} />
          ))}
        </nav>
        {expand && user && (
          <div className="mt-2 flex items-center gap-2 rounded-xl bg-gray-50 p-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-pink-100 to-pink-200">
              <span className="text-xs font-bold text-pink-600">
                {user.name?.charAt(0) || user.username?.charAt(0) || "U"}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-gray-900">{user.name || user.username}</p>
              <p className="text-[0.65rem] capitalize text-gray-400">{user.plan || "free"} plan</p>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

