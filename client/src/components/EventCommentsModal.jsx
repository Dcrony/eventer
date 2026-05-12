import { Send } from "lucide-react";
import { useEffect, useState } from "react";
import API from "../api/axios";
import { formatRelativeTime } from "../utils/eventHelpers";
import { UserAvatar } from "./ui/avatar";
import Modal from "./ui/modal";
import Button from "./ui/button";
import { useToast } from "./ui/toast";

export default function EventCommentsModal({
  open,
  onClose,
  eventId,
  eventTitle,
  initialComments = [],
  initialCommentCount = 0,
  onCommentCountChange,
}) {
  const [comments, setComments] = useState(initialComments);
  const [commentCount, setCommentCount] = useState(initialCommentCount);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const toast = useToast();
  const currentUser = JSON.parse(localStorage.getItem("user") || "null");

  useEffect(() => {
    if (!open) return;

    const fetchComments = async () => {
      try {
        setLoading(true);
        const { data } = await API.get(`/events/${eventId}/comments`);
        setComments(data.comments || []);
        setCommentCount(data.commentCount || 0);
      } catch (error) {
        // Failed to load comments - will show empty state
      } finally {
        setLoading(false);
      }
    };

    fetchComments();
  }, [eventId, open]);

  useEffect(() => {
    setComments(initialComments);
    setCommentCount(initialCommentCount);
  }, [initialCommentCount, initialComments]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const text = draft.trim();

    if (!text) return;

    if (!localStorage.getItem("token")) {
      toast.info("Log in to join the conversation");
      return;
    }

    const optimisticComment = {
      _id: `optimistic-${Date.now()}`,
      text,
      createdAt: new Date().toISOString(),
      pending: true,
      user: {
        name: currentUser?.name,
        username: currentUser?.username,
        profilePic: currentUser?.profilePic,
      },
    };

    const previousComments = [...comments];
    setComments(prev => [optimisticComment, ...prev]);
    setCommentCount(prev => prev + 1);
    setDraft("");
    setSubmitting(true);

    try {
      const { data } = await API.post(`/events/${eventId}/comments`, { text });
      setComments(data.comments || []);
      setCommentCount(data.commentCount || 0);
      onCommentCountChange?.(data.commentCount || 0, data);
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not post comment");
      setComments(previousComments);
      setCommentCount(previousComments.length);
      setDraft(text);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Comments"
      description={`Join the conversation around ${eventTitle}`}
      contentClassName="max-w-2xl w-full"
    >
      <div className="flex flex-col max-h-[70vh]">
        {/* Comments List */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 border-3 border-pink-200 border-t-pink-500 rounded-full animate-spin" />
            </div>
          )}
          {!loading && comments.length === 0 && (
            <div className="text-center py-12">
              <p className="text-sm text-gray-500">No comments yet. Be the first to say something.</p>
            </div>
          )}
          {comments.map((comment) => (
            <article key={comment._id} className="flex gap-3">
              <div className="flex-shrink-0">
                <UserAvatar user={comment.user} className="w-9 h-9 rounded-lg" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 mb-1">
                  <strong className="font-semibold text-gray-900">
                    {comment.user?.name || comment.user?.username || "Guest"}
                  </strong>
                  <span>@{comment.user?.username || "member"}</span>
                  <span>•</span>
                  <span>{formatRelativeTime(comment.createdAt)}</span>
                  {comment.pending && (
                    <span className="text-pink-500 text-[0.65rem] font-medium ml-2">Sending...</span>
                  )}
                </div>
                <p className="text-sm text-gray-700 leading-relaxed break-words">
                  {comment.text}
                </p>
              </div>
            </article>
          ))}
        </div>

        {/* Comment Form */}
        <form onSubmit={handleSubmit} className="mt-5 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between gap-3 mb-3">
            <span className="text-xs font-bold text-gray-900">{commentCount} comments</span>
            <span className="text-xs text-gray-500">Keep it helpful and kind.</span>
          </div>
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Ask a question, share your excitement, or drop a tip for other attendees."
            rows={3}
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-gray-50 text-gray-900 text-sm transition-all duration-200 placeholder:text-gray-400 focus:border-pink-500 focus:ring-2 focus:ring-pink-100 outline-none resize-none"
          />
          <div className="flex justify-end gap-2 mt-3">
            <Button variant="secondary" size="sm" onClick={onClose}>
              Close
            </Button>
            <Button type="submit" size="sm" disabled={submitting || !draft.trim()}>
              <Send size={14} />
              {submitting ? "Posting..." : "Post comment"}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}