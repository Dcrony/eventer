import { useState, useEffect } from "react";
import { CheckCircle, XCircle, Clock, Mail, Calendar, Users, AlertCircle, X } from "lucide-react";
import teamService from "../services/api/team";

const getRoleDescription = (role) => ({
  co_organizer:              "Full access to manage the event and team",
  ticket_manager:       "Manage tickets and attendee support",
  analytics_viewer:     "View-only access to event analytics",
  livestream_moderator: "Manage live streaming features",
}[role] || role);

const getTimeRemaining = (expiresAt) => {
  const diff = new Date(expiresAt) - new Date();
  if (diff <= 0) return "Expired";
  const days  = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff % 86_400_000) / 3_600_000);
  if (days  > 0) return `${days} day${days  > 1 ? "s" : ""} left`;
  if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""} left`;
  return "Less than 1 hour left";
};

const fmtDate = (d) =>
  new Date(d).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

const TeamInvitations = () => {
  const [invitations, setInvitations] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState("");
  const [responding,  setResponding]  = useState(null);

  useEffect(() => { loadInvitations(); }, []);

  const loadInvitations = async () => {
    try {
      setLoading(true);
      const r = await teamService.getMyInvitations();
      setInvitations(r.data.invitations || []);
    } catch { setError("Failed to load invitations"); }
    finally  { setLoading(false); }
  };

  const handleResponse = async (id, action) => {
    try {
      setResponding(id);
      await teamService.respondToInvitation(id, action);
      setInvitations(prev => prev.filter(inv => inv.id !== id));
    } catch (err) { setError(err.response?.data?.message || `Failed to ${action} invitation`); }
    finally       { setResponding(null); }
  };

  /* Loading skeleton */
  if (loading) return (
    <div className="min-h-screen bg-slate-50 lg:pl-[var(--sidebar-width,0px)] pr-4 pt-8 pb-16 transition-[padding-left] duration-300 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4 text-slate-400">
        <div className="w-10 h-10 border-[3px] border-pink-200 border-t-pink-500 rounded-full animate-spin" />
        <p className="text-sm font-medium">Loading invitations…</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 lg:pl-[var(--sidebar-width,0px)] sm:px-4 pt-8 pb-16 transition-[padding-left] duration-300">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-pink-500 mb-1">Team</p>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Team Invitations</h1>
            <p className="mt-1 text-sm text-slate-500">Manage your pending team invitations</p>
          </div>
          <div className="hidden sm:flex w-11 h-11 items-center justify-center rounded-2xl bg-pink-50 border border-pink-100 text-pink-500">
            <Mail size={20} />
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm font-medium rounded-xl px-4 py-3">
            <AlertCircle size={15} className="shrink-0" />
            <span className="flex-1">{error}</span>
            <button onClick={() => setError("")} className="text-red-400 hover:text-red-600"><X size={14} /></button>
          </div>
        )}

        {/* Empty */}
        {invitations.length === 0 && (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-12 flex flex-col items-center gap-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-300">
              <Mail size={32} />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 mb-1">No pending invitations</h3>
              <p className="text-sm text-slate-400">You don't have any pending team invitations at the moment.</p>
            </div>
          </div>
        )}

        {/* Invitation cards */}
        <div className="space-y-4">
          {invitations.map((inv) => (
            <div key={inv.id} className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              {/* Top bar */}
              <div className="h-1 w-full bg-gradient-to-r from-pink-500 to-fuchsia-500" />

              <div className="p-5 sm:p-6 space-y-4">
                {/* Event info + expiry */}
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 tracking-tight">{inv.event.title}</h3>
                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                      {inv.event.category && (
                        <span className="inline-flex items-center h-5 px-2.5 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold">
                          {inv.event.category}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1 text-xs text-slate-400 font-medium">
                        <Calendar size={12} />
                        {fmtDate(inv.event.startDate)}
                      </span>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 bg-amber-50 border border-amber-100 px-2.5 py-1 rounded-full">
                    <Clock size={12} />
                    {getTimeRemaining(inv.expiresAt)}
                  </span>
                </div>

                {/* Inviter */}
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                  <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 border-2 border-white shadow-sm">
                    {inv.inviter.profilePic
                      ? <img src={inv.inviter.profilePic} alt="" className="w-full h-full object-cover" />
                      : <div className="w-full h-full bg-gradient-to-br from-pink-400 to-fuchsia-500 flex items-center justify-center text-white font-bold text-sm">
                          {inv.inviter.name?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                    }
                  </div>
                  <div>
                    <p className="text-sm text-slate-700">
                      <span className="font-bold">{inv.inviter.name || inv.inviter.username}</span>
                      {" "}invited you to join the team
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">Sent {fmtDate(inv.createdAt)}</p>
                  </div>
                </div>

                {/* Role */}
                <div className="flex items-start gap-2.5 p-3 bg-purple-50 border border-purple-100 rounded-xl">
                  <Users size={15} className="text-purple-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-purple-800 capitalize">{inv.role.replace("_", " ")}</p>
                    <p className="text-xs text-purple-600 mt-0.5">{getRoleDescription(inv.role)}</p>
                  </div>
                </div>

                {/* Message */}
                {inv.message && (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Message</p>
                    <p className="text-sm text-slate-600 italic">&ldquo;{inv.message}&rdquo;</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2.5 pt-1">
                  <button
                    onClick={() => handleResponse(inv.id, "decline")}
                    disabled={responding === inv.id}
                    className="flex-1 inline-flex items-center justify-center gap-2 h-11 rounded-full border border-slate-200 bg-white text-sm font-bold text-slate-600 hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    <XCircle size={16} />
                    {responding === inv.id ? "Declining…" : "Decline"}
                  </button>
                  <button
                    onClick={() => handleResponse(inv.id, "accept")}
                    disabled={responding === inv.id}
                    className="flex-1 inline-flex items-center justify-center gap-2 h-11 rounded-full bg-pink-500 text-white text-sm font-bold shadow-md shadow-pink-200 hover:bg-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    <CheckCircle size={16} />
                    {responding === inv.id ? "Accepting…" : "Accept"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TeamInvitations;