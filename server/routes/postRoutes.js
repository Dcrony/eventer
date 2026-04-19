const express = require("express");
const { authMiddleware } = require("../middleware/authMiddleware");
const {
  getPosts,
  createPost,
  toggleLikePost,
  addComment,
} = require("../controllers/communityController");

const router = express.Router();

router.get("/", authMiddleware, getPosts);
router.post("/", authMiddleware, createPost);
router.post("/:postId/like", authMiddleware, toggleLikePost);
router.post("/:postId/comments", authMiddleware, addComment);

module.exports = router;
