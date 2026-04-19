const express = require("express");
const { authMiddleware } = require("../middleware/authMiddleware");
const { addComment, getCommentsByPost } = require("../controllers/communityController");

const router = express.Router();

router.post("/", authMiddleware, addComment);
router.get("/:postId", authMiddleware, getCommentsByPost);

module.exports = router;
