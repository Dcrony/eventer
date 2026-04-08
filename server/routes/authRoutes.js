const express = require("express");
const router = express.Router();
const multer = require("multer");
const {
  register,
  login,
  verifyEmail,
  forgotPassword,
  resetPassword,
  firebaseLogin,
} = require("../controllers/authControllers");

const upload = multer();

router.post("/register", upload.none(), register);
router.post("/login", login);
router.post("/verify-email", verifyEmail);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/firebase", firebaseLogin);

module.exports = router;
