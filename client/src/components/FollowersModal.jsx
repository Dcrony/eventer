import { useEffect, useRef, useState, useMemo } from "react";
import { X, Search, UserRoundPlus, BadgeCheck, Users, UserCheck, MessageSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";
import { UserAvatar } from "../components/ui/avatar";
import VerifiedBadge from "../components/ui/verified-badge";

const TABS = [
  { id: "followers", label: "Followers", icon: Users },
  { id: "following", label: "Following", icon: UserCheck },
  { id: "verified", label: "Verified", icon: BadgeCheck },
];

function UserRow({ user, currentUserId, isAlreadyFollowing, onClose, navigate, onFollowToggle }){
  const [followPending, setFollowPending] = useState(false);
  const [isFollowing, setIsFollowing] = useState(isAlreadyFollowing);
  const isSelf = String(user._id) === String(currentUserId);

  // Re-sync when parent prop changes (modal re-opens or myFollowingIds updates)
  useEffect(() => {
    setIsFollowing(isAlreadyFollowing);
  }, [isAlreadyFollowing]);

  const handleFollow = async (e) => {
    e.stopPropagation();
    if (followPending || isSelf) return;
    setFollowPending(true);
    try {
      await API.post(`/users/${user._id}/follow`);
      setIsFollowing((v) => !v);
      onFollowToggle?.(String(user._id), nowFollowing);
    } catch {
      // silent — interceptor handles toast
    } finally {
      setFollowPending(false);
    }
  };

  const goToProfile = () => {
    onClose();
    navigate(user.username ? `/user/${user.username}` : `/profile/${user._id}`);
  };

  return (
    <div className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors duration-150">
      <div onClick={goToProfile} className="flex-shrink-0 cursor-pointer">
        <UserAvatar user={user} className="w-10 h-10 rounded-full ring-2 ring-white shadow-sm" />
      </div>

      <div className="flex-1 min-w-0 cursor-pointer" onClick={goToProfile}>
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-bold text-gray-900 truncate">
            {user.name || user.username}
          </span>
          <VerifiedBadge user={user} />
        </div>
        <p className="text-xs text-gray-400 truncate">
          @{user.username || "tickispot"}
        </p>
      </div>

      {!isSelf && (
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
              navigate(`/messages?user=${user._id}`);
            }}
            className="w-8 h-8 rounded-full border border-gray-200 bg-white flex items-center justify-center text-gray-400 transition-all duration-200 hover:border-pink-300 hover:text-pink-500 hover:bg-pink-50"
          >
            <MessageSquare size={13} />
          </button>
          <button
            onClick={handleFollow}
            disabled={followPending}
            className={`flex items-center gap-1.5 h-8 px-3 rounded-full text-xs font-bold transition-all duration-200 disabled:opacity-50 ${
              isFollowing
                ? "border border-gray-200 bg-white text-gray-600 hover:border-red-200 hover:text-red-500 hover:bg-red-50"
                : "bg-pink-500 text-white hover:bg-pink-600 shadow-sm shadow-pink-500/25"
            }`}
          >
            {followPending ? (
              <span className="w-3 h-3 rounded-full border-2 border-current border-t-transparent animate-spin" />
            ) : isFollowing ? (
              "Following"
            ) : (
              <>
                <UserRoundPlus size={11} />
                Follow
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 px-5 py-3.5 animate-pulse">
      <div className="w-10 h-10 rounded-full bg-gray-100 flex-shrink-0" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3.5 w-32 bg-gray-100 rounded" />
        <div className="h-3 w-20 bg-gray-100 rounded" />
      </div>
      <div className="h-8 w-20 rounded-full bg-gray-100" />
    </div>
  );
}

export default function FollowersModal({
  open,
  onClose,
  profileId,
  initialTab = "followers",
  myFollowingIds = [],
  onFollowToggle,
}) {
  const navigate = useNavigate();
  const storedUser = JSON.parse(localStorage.getItem("user") || "null");
  const currentUserId = storedUser?._id || storedUser?.id;

  const [activeTab, setActiveTab] = useState(initialTab);
  const [search, setSearch] = useState("");
  const [data, setData] = useState({ followers: [], following: [] });
  const [loading, setLoading] = useState(true);
  const tabsRef = useRef({});
  const [indicator, setIndicator] = useState({ width: 0, left: 0 });
  const overlayRef = useRef(null);

  useEffect(() => {
    if (!open || !profileId) return;
    setLoading(true);
    API.get(`/users/${profileId}`)
      .then(({ data: d }) => {
        setData({
          followers: Array.isArray(d.followers) ? d.followers : [],
          following: Array.isArray(d.following) ? d.following : [],
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open, profileId]);

  useEffect(() => {
    if (open) {
      setActiveTab(initialTab);
      setSearch("");
    }
  }, [open, initialTab]);

  useEffect(() => {
    const node = tabsRef.current[activeTab];
    if (!node) return;
    setIndicator({ width: node.offsetWidth, left: node.offsetLeft });
  }, [activeTab, open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const lists = useMemo(() => ({
    followers: data.followers,
    following: data.following,
    verified: [...data.followers, ...data.following].filter(
      (u, idx, arr) =>
        u?.isVerified &&
        arr.findIndex((x) => String(x._id) === String(u._id)) === idx,
    ),
  }), [data]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = lists[activeTab] || [];
    if (!q) return list;
    return list.filter(
      (u) =>
        u?.name?.toLowerCase().includes(q) ||
        u?.username?.toLowerCase().includes(q),
    );
  }, [lists, activeTab, search]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[10010] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className="relative w-full sm:max-w-md bg-white sm:rounded-2xl rounded-t-2xl overflow-hidden shadow-2xl border border-gray-200 flex flex-col max-h-[85vh] sm:max-h-[600px] animate-slide-up">

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 flex-shrink-0">
          <h2 className="text-base font-extrabold tracking-tight text-gray-900">Connections</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-400 transition-all duration-200 hover:bg-red-50 hover:border-red-200 hover:text-red-500 hover:rotate-90"
          >
            <X size={16} />
          </button>
        </div>

        {/* Search */}
        <div className="px-5 pb-3 flex-shrink-0">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search people…"
              className="w-full h-9 pl-8 pr-4 rounded-full border-2 border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder:text-gray-400 focus:border-pink-400 focus:bg-white focus:ring-2 focus:ring-pink-100 outline-none transition-all duration-200"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="relative px-5 flex-shrink-0 border-b border-gray-100">
          <div className="relative flex">
            <span
              className="absolute bottom-0 h-0.5 rounded-full bg-pink-500 transition-all duration-300 ease-out"
              style={{ width: `${indicator.width}px`, transform: `translateX(${indicator.left}px)` }}
              aria-hidden="true"
            />
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const count = lists[tab.id]?.length || 0;
              return (
                <button
                  key={tab.id}
                  ref={(n) => { tabsRef.current[tab.id] = n; }}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-4 py-2.5 pb-3 text-xs font-semibold border-none bg-transparent transition-colors duration-200 whitespace-nowrap ${
                    activeTab === tab.id ? "text-gray-900" : "text-gray-400 hover:text-gray-600"
                  }`}
                >
                  <Icon size={13} />
                  {tab.label}
                  {count > 0 && (
                    <span className={`inline-flex items-center justify-center h-4 min-w-[1rem] px-1 rounded-full text-[0.6rem] font-bold ${
                      activeTab === tab.id
                        ? "bg-pink-100 text-pink-600"
                        : "bg-gray-100 text-gray-500"
                    }`}>
                      {count > 999 ? "999+" : count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div>
              {Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 px-6 text-center">
              <div className="w-12 h-12 rounded-xl bg-pink-50 border border-pink-200 flex items-center justify-center">
                {activeTab === "verified"
                  ? <BadgeCheck size={22} className="text-pink-500" />
                  : activeTab === "following"
                  ? <UserCheck size={22} className="text-pink-500" />
                  : <Users size={22} className="text-pink-500" />}
              </div>
              <p className="text-sm font-bold text-gray-900">
                {search
                  ? `No results for "${search}"`
                  : activeTab === "verified"
                  ? "No verified connections yet"
                  : activeTab === "following"
                  ? "Not following anyone yet"
                  : "No followers yet"}
              </p>
              <p className="text-xs text-gray-400 max-w-[200px] leading-relaxed">
                {search
                  ? "Try a different name or username."
                  : activeTab === "verified"
                  ? "Verified users in your network will appear here."
                  : "When people connect, they'll show up here."}
              </p>
            </div>
          ) : (
            <div>
              {filtered.map((user) => (
                <UserRow
                  key={user._id}
                  user={user}
                  currentUserId={currentUserId}
                  isAlreadyFollowing={myFollowingIds.includes(String(user._id))}
                  onClose={onClose}
                  navigate={navigate}
                  onFollowToggle={onFollowToggle}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer count */}
        {!loading && filtered.length > 0 && (
          <div className="px-5 py-3 border-t border-gray-100 flex-shrink-0 bg-gray-50">
            <p className="text-xs text-gray-400 text-center">
              <strong className="text-gray-700 font-bold">{filtered.length}</strong>{" "}
              {filtered.length === 1 ? "person" : "people"}
              {search && " match your search"}
            </p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-up { animation: slide-up 0.25s cubic-bezier(0.34,1.56,0.64,1); }
      `}</style>
    </div>
  );
}