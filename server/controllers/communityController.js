const Post = require("../models/Post");
const Comment = require("../models/Comment");
const { createNotification } = require("../services/notificationService");

const postPopulateUser = {
  path: "user",
  select: "name username profilePic role isVerified",
};
const postPopulateAuthor = {
  path: "author",
  select: "name username profilePic role isVerified",
};

exports.getPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .populate(postPopulateUser)
      .populate(postPopulateAuthor)
      .sort({ createdAt: -1 })
      .lean();

    const postIds = posts.map((post) => post._id);
    const comments = await Comment.find({ post: { $in: postIds } })
      .populate({ path: "author", select: "name username profilePic role isVerified" })
      .sort({ createdAt: 1 })
      .lean();

    const commentMap = comments.reduce((acc, comment) => {
      const key = String(comment.post);
      if (!acc[key]) acc[key] = [];
      acc[key].push(comment);
      return acc;
    }, {});

    const currentUserId = String(req.user._id || req.user.id);
    const payload = posts.map((post) => {
      const profile = post.user || post.author;
      return {
        ...post,
        user: profile,
        likeCount: Array.isArray(post.likes) ? post.likes.length : 0,
        isLiked: Array.isArray(post.likes)
          ? post.likes.some((id) => String(id) === currentUserId)
          : false,
        comments: commentMap[String(post._id)] || [],
        commentCount: (commentMap[String(post._id)] || []).length,
      };
    });

    return res.status(200).json(payload);
  } catch (error) {
    console.error("getPosts error", error);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.createPost = async (req, res) => {
  try {
    const content = String(req.body.content || "").trim();
    if (!content) return res.status(400).json({ message: "Post content is required" });

    const uid = req.user._id || req.user.id;
    const post = await Post.create({
      user: uid,
      author: uid,
      content,
      image: req.body.image || "",
    });

    const populated = await Post.findById(post._id)
      .populate(postPopulateUser)
      .populate(postPopulateAuthor);
    const created = populated.toObject();
    const profile = created.user || created.author;
    return res.status(201).json({
      ...created,
      user: profile,
      comments: [],
      commentCount: 0,
      likeCount: 0,
      isLiked: false,
    });
  } catch (error) {
    console.error("createPost error", error);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.toggleLikePost = async (req, res) => {
  try {
    const postId = req.params.postId || req.body.postId;
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const userId = String(req.user._id || req.user.id);
    const index = post.likes.findIndex((id) => String(id) === userId);
    if (index >= 0) {
      post.likes.splice(index, 1);
    } else {
      post.likes.push(req.user._id || req.user.id);

      if (String(post.user || post.author) !== userId) {
        await createNotification(req.app, {
          userId: String(post.user || post.author),
          actorId: userId,
          type: "like",
          message: `${req.user.name || req.user.username} liked your post`,
          actionUrl: "/notifications",
          entityId: post._id,
          entityType: "post",
        });
      }
    }

    await post.save();
    return res.status(200).json({
      success: true,
      likeCount: post.likes.length,
      isLiked: post.likes.some((id) => String(id) === userId),
    });
  } catch (error) {
    console.error("toggleLikePost error", error);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.addComment = async (req, res) => {
  try {
    const content = String(req.body.content || "").trim();
    if (!content) return res.status(400).json({ message: "Comment is required" });

    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const parentComment = req.body.parentComment || null;
    if (parentComment) {
      const parent = await Comment.findById(parentComment);
      if (!parent || String(parent.post) !== String(post._id)) {
        return res.status(400).json({ message: "Invalid parent comment" });
      }
    }

    const comment = await Comment.create({
      post: post._id,
      author: req.user._id || req.user.id,
      content,
      parentComment,
    });

    const populated = await Comment.findById(comment._id).populate({
      path: "author",
      select: "name username profilePic role isVerified",
    });

    const actorId = String(req.user._id || req.user.id);
    const postOwnerId = String(post.user || post.author);

    if (parentComment) {
      const parent = await Comment.findById(parentComment).select("author");
      if (parent && String(parent.author) !== actorId) {
        await createNotification(req.app, {
          userId: String(parent.author),
          actorId,
          type: "reply",
          message: `${req.user.name || req.user.username} replied to your comment`,
          actionUrl: "/notifications",
          entityId: comment._id,
          entityType: "comment",
        });
      }
    } else if (postOwnerId !== actorId) {
      await createNotification(req.app, {
        userId: postOwnerId,
        actorId,
        type: "comment",
        message: `${req.user.name || req.user.username} commented on your post`,
        actionUrl: "/notifications",
        entityId: comment._id,
        entityType: "comment",
      });
    }

    return res.status(201).json(populated);
  } catch (error) {
    console.error("addComment error", error);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.getCommentsByPost = async (req, res) => {
  try {
    const comments = await Comment.find({ post: req.params.postId })
      .populate({ path: "author", select: "name username profilePic role isVerified" })
      .sort({ createdAt: 1 })
      .lean();
    return res.status(200).json(comments);
  } catch (error) {
    console.error("getCommentsByPost error", error);
    return res.status(500).json({ message: "Server error" });
  }
};
