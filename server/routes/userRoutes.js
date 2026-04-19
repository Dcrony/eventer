const express = require("express");
const { authMiddleware, authorizeRoles } = require("../middleware/authMiddleware");
const { uploadImageMemory } = require("../middleware/imageUploadMemory");
const {
  updateMyProfile,
  getMyProfile,
  getUserProfile,
  uploadProfilePic,
  uploadCoverPic,
  getMyTickets,
  updateUserRole,
  getAllUsers,
  deleteUser,
  getMyEvents,
  toggleFollow,
  deactivateAccount,
} = require("../controllers/userController");


const router = express.Router();

// Profile routes
router.put("/edit", authMiddleware, updateMyProfile);
router.get("/me", authMiddleware, getMyProfile);

router.post(
  "/me/upload",
  authMiddleware,
  uploadImageMemory.single("profilePic"),
  uploadProfilePic,
);

router.post(
  "/me/cover",
  authMiddleware,
  uploadImageMemory.single("coverPic"),
  uploadCoverPic,
);

router.get("/my-tickets", authMiddleware, getMyTickets);

// Organizer routes
router.get("/my-events", authMiddleware, authorizeRoles("organizer"), getMyEvents);

// Admin routes
router.get("/", authMiddleware, authorizeRoles("admin"), getAllUsers);
router.delete("/:id", authMiddleware, authorizeRoles("admin"), deleteUser);
router.put("/:id/role", authMiddleware, authorizeRoles("admin"), updateUserRole);


router.put("/profile/:id/deactivate", authMiddleware, deactivateAccount);

// Follow / Unfollow
router.post("/:id/follow", authMiddleware, toggleFollow);

// Get Profile
router.get("/:id", authMiddleware, getUserProfile);

module.exports = router;
