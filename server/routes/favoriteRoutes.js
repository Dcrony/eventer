const express = require("express");
const { authMiddleware } = require("../middleware/authMiddleware");
const { toggleFavorite, getFavorites } = require("../controllers/favoriteController");

const router = express.Router();

router.post("/:eventId", authMiddleware, toggleFavorite);
router.get("/", authMiddleware, getFavorites);

module.exports = router;
