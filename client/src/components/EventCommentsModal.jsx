import { Send } from "lucide-react";
import { startTransition, useEffect, useOptimistic, useState } from "react";
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
  const [optimisticComments, addOptimisticComment] = useOptimistic(
    comments,
    (current, optimisticComment) => [optimisticComment, ...current],
  );
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
        console.error("Failed to load comments:", error);
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

    startTransition(() => {
      addOptimisticComment(optimisticComment);
    });

    setDraft("");
    setSubmitting(true);

    try {
      const { data } = await API.post(`/events/${eventId}/comments`, { text });
      setComments(data.comments || []);
      setCommentCount(data.commentCount || 0);
      onCommentCountChange?.(data.commentCount || 0, data);
    } catch (error) {
      console.error("Failed to post comment:", error);
      toast.error(error.response?.data?.message || "Could not post comment");
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
      contentClassName="event-comments-modal"
    >
      <div className="event-comments-layout">
        <div className="event-comments-list">
          {loading ? <p className="event-comments-empty">Loading comments...</p> : null}
          {!loading && optimisticComments.length === 0 ? (
            <p className="event-comments-empty">No comments yet. Be the first to say something.</p>
          ) : null}

          {optimisticComments.map((comment) => (
            <article key={comment._id} className="event-comment-item">
              <div className="event-comment-avatar">
                <UserAvatar user={comment.user} className="event-comment-avatar-img" />
              </div>
              <div className="event-comment-body">
                <div className="event-comment-meta">
                  <strong>{comment.user?.name || comment.user?.username || "Guest"}</strong>
                  <span>@{comment.user?.username || "member"}</span>
                  <span>{formatRelativeTime(comment.createdAt)}</span>
                  {comment.pending ? <span className="event-comment-pending">Sending...</span> : null}
                </div>
                <p>{comment.text}</p>
              </div>
            </article>
          ))}
        </div>

        <form className="event-comment-form" onSubmit={handleSubmit}>
          <div className="event-comment-form-head">
            <span>{commentCount} comments</span>
            <span>Keep it helpful and kind.</span>
          </div>
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Ask a question, share your excitement, or drop a tip for other attendees."
            rows={4}
          />
          <div className="event-comment-form-actions">
            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>
            <Button type="submit" disabled={submitting || !draft.trim()}>
              <Send size={16} />
              {submitting ? "Posting..." : "Post comment"}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
