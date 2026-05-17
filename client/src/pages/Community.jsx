import { useCallback, useEffect, useState } from "react";
import { Heart, MessageCircle, Send } from "lucide-react";
import {
  addComment,
  createPost,
  fetchPosts,
  toggleLikePost,
} from "../services/api/community";
import { useToast } from "../components/ui/toast";

export default function Community() {
  const toast = useToast();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newPost, setNewPost] = useState("");
  const [commentDrafts, setCommentDrafts] = useState({});

  const loadPosts = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetchPosts();
      setPosts(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setError(err.response?.data?.message || "Could not load community feed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const handleCreate = async (e) => {
    e.preventDefault();
    const content = newPost.trim();
    if (!content) return;
    try {
      const res = await createPost(content);
      setPosts((prev) => [res.data, ...prev]);
      setNewPost("");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create post");
    }
  };

  const handleLike = async (postId) => {
    try {
      const res = await toggleLikePost(postId);
      setPosts((prev) =>
        prev.map((p) =>
          p._id === postId
            ? {
                ...p,
                isLiked: res.data.isLiked,
                likeCount: res.data.likeCount,
              }
            : p,
        ),
      );
    } catch {
      toast.error("Could not update like");
    }
  };

  const handleComment = async (postId) => {
    const content = (commentDrafts[postId] || "").trim();
    if (!content) return;
    try {
      const res = await addComment(postId, content);
      setPosts((prev) =>
        prev.map((p) =>
          p._id === postId
            ? {
                ...p,
                comments: [...(p.comments || []), res.data],
                commentCount: (p.commentCount || 0) + 1,
              }
            : p,
        ),
      );
      setCommentDrafts((prev) => ({ ...prev, [postId]: "" }));
    } catch {
      toast.error("Could not post comment");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-geist pb-20 ">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-extrabold text-gray-900">Community</h1>
        <p className="mt-1 text-sm text-gray-500">Share updates with organizers and attendees.</p>

        <form onSubmit={handleCreate} className="mt-6 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <textarea
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            placeholder="What's happening?"
            rows={3}
            className="w-full resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-pink-500"
          />
          <div className="mt-3 flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-full bg-pink-500 px-4 py-2 text-sm font-semibold text-white hover:bg-pink-600"
            >
              <Send size={16} />
              Post
            </button>
          </div>
        </form>

        {loading && <p className="mt-8 text-center text-gray-500">Loading feed…</p>}
        {error && (
          <div className="mt-8 rounded-xl border border-red-200 bg-red-50 p-4 text-center">
            <p className="text-sm text-red-700">{error}</p>
            <button
              type="button"
              onClick={loadPosts}
              className="mt-3 text-sm font-semibold text-pink-600 hover:text-pink-700"
            >
              Try again
            </button>
          </div>
        )}

        {!loading && !error && posts.length === 0 && (
          <p className="mt-8 text-center text-gray-500">No posts yet. Start the conversation!</p>
        )}

        <ul className="mt-6 space-y-4">
          {posts.map((post) => (
            <li key={post._id} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-pink-100 text-sm font-bold text-pink-600">
                  {(post.user?.name || post.user?.username || "U").charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {post.user?.name || post.user?.username}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(post.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
              <p className="mt-3 text-sm text-gray-800 whitespace-pre-wrap">{post.content}</p>
              <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
                <button
                  type="button"
                  onClick={() => handleLike(post._id)}
                  className={`inline-flex items-center gap-1 ${post.isLiked ? "text-pink-500" : ""}`}
                >
                  <Heart size={16} fill={post.isLiked ? "currentColor" : "none"} />
                  {post.likeCount || 0}
                </button>
                <span className="inline-flex items-center gap-1">
                  <MessageCircle size={16} />
                  {post.commentCount || 0}
                </span>
              </div>
              {(post.comments || []).map((c) => (
                <div key={c._id} className="mt-3 rounded-xl bg-gray-50 px-3 py-2 text-sm text-gray-700">
                  <span className="font-semibold">{c.author?.username || "User"}: </span>
                  {c.content}
                </div>
              ))}
              <div className="mt-3 flex gap-2">
                <input
                  type="text"
                  value={commentDrafts[post._id] || ""}
                  onChange={(e) =>
                    setCommentDrafts((prev) => ({ ...prev, [post._id]: e.target.value }))
                  }
                  placeholder="Write a comment…"
                  className="flex-1 rounded-full border border-gray-200 px-3 py-2 text-sm outline-none focus:border-pink-500"
                />
                <button
                  type="button"
                  onClick={() => handleComment(post._id)}
                  className="rounded-full bg-gray-900 px-3 py-2 text-xs font-semibold text-white"
                >
                  Reply
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
