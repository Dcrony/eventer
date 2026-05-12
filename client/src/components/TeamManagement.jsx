import { useState, useEffect } from "react";
import {
  Users, Plus, Trash2, Crown, Shield, BarChart3, Radio, X, AlertCircle,
} from "lucide-react";
import teamService from "../services/api/team";

const ROLES = [
  { value: "co_organizer", label: "Co Organizer", icon: Crown, description: "Full access to manage event and team" },
  { value: "ticket_manager", label: "Ticket Manager", icon: Shield, description: "Manage tickets and attendee support" },
  { value: "analytics_viewer", label: "Analytics Viewer", icon: BarChart3, description: "View-only access to analytics" },
  { value: "livestream_moderator", label: "Livestream Moderator", icon: Radio, description: "Manage live streaming features" },
];

const ROLE_COLORS = {
  co_organizer: "bg-purple-100 text-purple-700",
  ticket_manager: "bg-blue-100 text-blue-700",
  analytics_viewer: "bg-amber-100 text-amber-700",
  livestream_moderator: "bg-pink-100 text-pink-700",
};

const TeamManagement = ({ eventId, isOpen, onClose }) => {
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("co_organizer");
  const [inviteMessage, setInviteMessage] = useState("");
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { if (isOpen && eventId) loadTeam(); }, [isOpen, eventId]);

  const loadTeam = async () => {
    try {
      setLoading(true);
      const r = await teamService.getEventTeam(eventId);
      setTeam(r.data.members || []);
    } catch { setError("Failed to load team members"); }
    finally { setLoading(false); }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    try {
      setLoading(true);
      await teamService.inviteTeamMember(eventId, { email: inviteEmail.trim(), role: inviteRole, message: inviteMessage.trim() });
      setInviteEmail(""); setInviteMessage(""); setShowInviteForm(false);
      await loadTeam();
    } catch (err) { setError(err.response?.data?.message || "Failed to send invitation"); }
    finally { setLoading(false); }
  };

  const handleRemoveMember = async (memberId) => {
    if (!window.confirm("Remove this team member?")) return;
    try { setLoading(true); await teamService.removeTeamMember(eventId, memberId); await loadTeam(); }
    catch { setError("Failed to remove team member"); }
    finally { setLoading(false); }
  };

  const handleUpdateRole = async (memberId, newRole) => {
    try { setLoading(true); await teamService.updateTeamMemberRole(eventId, memberId, newRole); await loadTeam(); }
    catch { setError("Failed to update member role"); }
    finally { setLoading(false); }
  };

  if (!isOpen) return null;

  const currentRoleDesc = ROLES.find(r => r.value === inviteRole)?.description;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden animate-scale-in" onClick={e => e.stopPropagation()}>
        {/* Pink accent bar */}
        <div className="h-1 w-full bg-gradient-to-r from-pink-500 to-fuchsia-500 shrink-0" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-pink-50 flex items-center justify-center text-pink-500">
              <Users size={18} />
            </div>
            <h2 className="text-base font-extrabold text-gray-900 tracking-tight">Team Management</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Error banner */}
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm font-medium rounded-xl px-4 py-3">
              <AlertCircle size={15} className="shrink-0" />
              <span className="flex-1">{error}</span>
              <button onClick={() => setError("")} className="text-red-400 hover:text-red-600"><X size={14} /></button>
            </div>
          )}

          {/* Invite toggle */}
          <button onClick={() => setShowInviteForm(v => !v)} className="inline-flex items-center gap-2 h-10 px-5 rounded-full bg-pink-500 text-white text-sm font-bold shadow-md shadow-pink-500/25 hover:bg-pink-600 transition-all">
            <Plus size={16} />
            {showInviteForm ? "Cancel" : "Invite Team Member"}
          </button>

          {/* Invite form */}
          {showInviteForm && (
            <form onSubmit={handleInvite} className="bg-gray-50 border border-gray-200 rounded-xl p-5 space-y-4">
              <h3 className="text-sm font-extrabold text-gray-900 tracking-tight">Send invitation</h3>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400">Email address</label>
                <input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="colleague@example.com" required className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-800 outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100 transition-all" />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400">Role</label>
                <select value={inviteRole} onChange={e => setInviteRole(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-800 outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100 transition-all">
                  {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
                {currentRoleDesc && <p className="text-xs text-gray-500">{currentRoleDesc}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400">Message <span className="normal-case font-normal">(optional)</span></label>
                <textarea value={inviteMessage} onChange={e => setInviteMessage(e.target.value)} placeholder="Add a personal message..." rows={3} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-800 outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100 resize-none transition-all" />
              </div>

              <div className="flex gap-2.5 pt-1">
                <button type="button" onClick={() => setShowInviteForm(false)} className="flex-1 h-10 rounded-full border border-gray-200 bg-white text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
                <button type="submit" disabled={loading} className="flex-1 h-10 rounded-full bg-pink-500 text-white text-sm font-bold hover:bg-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all">{loading ? "Sending…" : "Send Invitation"}</button>
              </div>
            </form>
          )}

          {/* Team list */}
          <div>
            <h3 className="text-sm font-extrabold text-gray-900 mb-3 tracking-tight">Team members <span className="text-gray-400 font-semibold">({team.filter(m => m.isActive !== false).length})</span></h3>

            {loading && !team.length && (
              <div className="flex items-center gap-3 py-8 justify-center text-gray-400 text-sm">
                <div className="w-5 h-5 border-2 border-pink-200 border-t-pink-500 rounded-full animate-spin" />
                Loading…
              </div>
            )}

            {!loading && team.filter(m => m.isActive !== false).length === 0 && (
              <div className="flex flex-col items-center gap-3 py-10 text-center">
                <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-300"><Users size={28} /></div>
                <p className="text-sm font-semibold text-gray-500">No team members yet</p>
                <p className="text-xs text-gray-400">Invite people to help manage your event</p>
              </div>
            )}

            <div className="space-y-2.5">
              {team.filter(member => member.isActive !== false).map((member) => {
                const RoleIcon = ROLES.find(r => r.value === member.role)?.icon || Users;
                return (
                  <div key={member.id || member._id} className="flex items-center gap-3 p-3.5 bg-white border border-gray-200 rounded-xl hover:border-gray-300 transition-colors">
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border-2 border-white shadow-sm">
                      {member.user?.profilePic ? (
                        <img src={member.user.profilePic} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-pink-400 to-fuchsia-500 flex items-center justify-center text-white font-bold text-sm">
                          {member.user?.name?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate">{member.user?.name || member.user?.username}</p>
                      <div className={`inline-flex items-center gap-1 mt-0.5 px-2 py-0.5 rounded-full text-xs font-semibold ${ROLE_COLORS[member.role] || "bg-gray-100 text-gray-600"}`}>
                        <RoleIcon size={11} />
                        {member.role.replace("_", " ")}
                      </div>
                    </div>

                    {/* Role select */}
                    <select value={member.role} onChange={e => handleUpdateRole(member.id, e.target.value)} className="h-8 px-2 rounded-lg border border-gray-200 bg-gray-50 text-xs font-semibold text-gray-700 outline-none focus:border-pink-400 cursor-pointer">
                      {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </select>

                    {/* Remove button */}
                    <button onClick={() => handleRemoveMember(member.id)} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors">
                      <Trash2 size={15} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scale-in {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
        .animate-scale-in {
          animation: scale-in 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
      `}</style>
    </div>
  );
};

export default TeamManagement;