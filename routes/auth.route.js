const express = require("express");
const {
    redirectGoogle,
    googleCallback,
    logout,
    verify,
} = require("../controllers/auth.controller");
const router = express.Router();
const { protectedRoute } = require("../middlewares/auth.middleware");

// Auth
router.get("/google", redirectGoogle);
router.get("/google/callback", googleCallback);
router.get("/verify", protectedRoute, verify);
router.post("/logout", logout);

module.exports = router;
