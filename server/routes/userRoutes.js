const express = require("express");
const multer = require("multer");
const { authMiddleware, authorizeRoles } = require("../middleware/authMiddleware");
const {
  updateMyProfile,
  getUserProfile,
  uploadProfilePic,
  getMyTickets,
  updateUserRole,
  getAllUsers,
  deleteUser,
  getMyEvents,
} = require("../controllers/userController");

const router = express.Router();
const upload = multer({ dest: "uploads/" }); // configure storage later

// Profile routes
router.put("/me", authMiddleware, updateMyProfile);
router.get("/me", authMiddleware, getUserProfile); // NEW
router.post("/me/upload", authMiddleware, upload.single("profilePic"), uploadProfilePic); // NEW
router.get("/my-tickets", authMiddleware, getMyTickets); // NEW

// Organizer route
router.get("/my-events", authMiddleware, authorizeRoles("organizer"), getMyEvents);

// Admin routes
router.get("/", authMiddleware, authorizeRoles("admin"), getAllUsers);
router.delete("/:id", authMiddleware, authorizeRoles("admin"), deleteUser);
router.put("/:id/role", authMiddleware, authorizeRoles("admin"), updateUserRole);

module.exports = router;
