import { useEffect, useState } from "react";
import { Heart, MessageCircle } from "lucide-react";
import { getPosts, createPost, likePost, commentOnPost } from "../services/api/posts";
import Button from "../components/ui/button";
import { useToast } from "../components/ui/toast";

function PostAuthor({ post }) {
  const u = post.user || post.author;
  return <strong>{u?.name || u?.username || "User"}</strong>;
}

export default function Community() {
  const toast = useToast();
  const [posts, setPosts] = useState([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [posting, setPosting] = useState(false);
  const [commentDrafts, setCommentDrafts] = useState({});

  const fetchPosts = async () => {
    const { data } = await getPosts();
    setPosts(Array.isArray(data) ? data : []);
  };

  useEffect(() => {
    fetchPosts()
      .catch((error) => {
        console.error("Failed to load community", error);
        setLoadError("Could not load the feed. Please try again.");
        toast.error("Could not load community feed");
      })
      .finally(() => setLoading(false));
  }, []);

  const handleCreatePost = async () => {
    if (!draft.trim()) return;
    try {
      setPosting(true);
      const { data } = await createPost({ content: draft.trim() });
      setPosts((prev) => [data, ...prev]);
      setDraft("");
      toast.success("Post published");
    } catch (error) {
      console.error("Failed to create post", error);
      toast.error(error.response?.data?.message || "Could not create post");
    } finally {
      setPosting(false);
    }
  };

  const toggleLike = async (postId) => {
    const current = posts.find((post) => post._id === postId);
    if (!current) return;

    setPosts((prev) =>
      prev.map((post) =>
        post._id === postId
          ? {
              ...post,
              isLiked: !post.isLiked,
              likeCount: Math.max(0, Number(post.likeCount || 0) + (post.isLiked ? -1 : 1)),
            }
          : post,
      ),
    );

    try {
      const { data } = await likePost(postId);
      setPosts((prev) =>
        prev.map((post) =>
          post._id === postId ? { ...post, isLiked: data.isLiked, likeCount: data.likeCount } : post,
        ),
      );
    } catch (error) {
      console.error("Failed to like post", error);
      toast.error("Could not update like");
      setPosts((prev) => prev.map((post) => (post._id === postId ? current : post)));
    }
  };

  const addComment = async (postId) => {
    const content = String(commentDrafts[postId] || "").trim();
    if (!content) return;

    try {
      const { data } = await commentOnPost(postId, { content });
      setPosts((prev) =>
        prev.map((post) =>
          post._id === postId
            ? {
                ...post,
                comments: [...(post.comments || []), data],
                commentCount: Number(post.commentCount || 0) + 1,
              }
            : post,
        ),
      );
      setCommentDrafts((prev) => ({ ...prev, [postId]: "" }));
      toast.success("Comment added");
    } catch (error) {
      console.error("Failed to add comment", error);
      toast.error("Could not post comment");
    }
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-container">
        <div className="dash-card">
          <div className="dash-card-body">
            <h2>Community Feed</h2>
            <p className="muted">Share updates with everyone on TickiSpot.</p>
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              className="w-full mt-3 border rounded-xl p-3 min-h-[96px]"
              rows={3}
              placeholder="Share something with the community..."
            />
            <div className="mt-3 flex justify-end gap-2 flex-wrap">
              <Button onClick={handleCreatePost} loading={posting} disabled={!draft.trim()}>
                Post update
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-4">
          {loading ? (
            <div className="dash-card">
              <div className="dash-card-body muted">Loading community feed...</div>
            </div>
          ) : loadError ? (
            <div className="dash-card">
              <div className="dash-card-body error-text center">{loadError}</div>
            </div>
          ) : posts.length ? (
            posts.map((post) => (
              <article key={post._id} className="dash-card">
                <div className="dash-card-body">
                  <PostAuthor post={post} />
                  <p className="mt-2">{post.content}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-4">
                    <button
                      type="button"
                      className={`inline-flex items-center gap-2 ${post.isLiked ? "text-pink-600" : ""}`}
                      onClick={() => toggleLike(post._id)}
                      aria-label="Like"
                    >
                      <Heart size={16} fill={post.isLiked ? "currentColor" : "none"} />
                      <span>{post.likeCount || 0}</span>
                    </button>
                    <span className="inline-flex items-center gap-2 text-slate-500">
                      <MessageCircle size={16} />
                      <span>{post.commentCount || 0}</span>
                    </span>
                  </div>
                  <div className="mt-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <input
                      className="flex-1 border rounded-full px-3 py-2 min-w-0"
                      value={commentDrafts[post._id] || ""}
                      onChange={(event) =>
                        setCommentDrafts((prev) => ({ ...prev, [post._id]: event.target.value }))
                      }
                      placeholder="Write a comment..."
                    />
                    <Button size="sm" variant="secondary" onClick={() => addComment(post._id)}>
                      Comment
                    </Button>
                  </div>
                </div>
              </article>
            ))
          ) : (
            <div className="dash-card">
              <div className="dash-card-body center muted">No community posts yet.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
