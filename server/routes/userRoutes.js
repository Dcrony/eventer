const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const { authMiddleware, authorizeRoles } = require("../middleware/authMiddleware");
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
} = require("../controllers/userController");

const router = express.Router();


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // choose folder based on field name
    let uploadPath = "uploads/";

    if (file.fieldname === "profilePic") {
      uploadPath = "uploads/profile_pic";
    } else if (file.fieldname === "coverPic") {
      uploadPath = "uploads/cover_pic";
    }

    // create folder if it doesn’t exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    cb(null, uploadPath);
  },

  filename: (req, file, cb) => {
    // preserve extension
    const ext = path.extname(file.originalname);
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });


// Profile routes
router.put("/edit", authMiddleware, updateMyProfile);
router.get("/me", authMiddleware, getMyProfile);

router.post(
  "/me/upload",
  authMiddleware,
  upload.single("profilePic"),
  uploadProfilePic
);

router.post(
  "/me/cover",
  authMiddleware,
  upload.single("coverPic"),
  uploadCoverPic
);

router.get("/my-tickets", authMiddleware, getMyTickets);

// Organizer routes
router.get("/my-events", authMiddleware, authorizeRoles("organizer"), getMyEvents);

// Admin routes
router.get("/", authMiddleware, authorizeRoles("admin"), getAllUsers);
router.delete("/:id", authMiddleware, authorizeRoles("admin"), deleteUser);
router.put("/:id/role", authMiddleware, authorizeRoles("admin"), updateUserRole);


router.put("/profile/:id/deactivate", async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      {
        isDeleted: true,
        deletedAt: new Date(),
      },
      { new: true }
    );

    res.json({ message: "Account deactivated", user });
  } catch (err) {
    res.status(500).json({ message: "Error deactivating account" });
  }
});

// Follow / Unfollow
router.post("/:id/follow", authMiddleware, toggleFollow);

// Get Profile
router.get("/:id", authMiddleware, getUserProfile);

module.exports = router;
