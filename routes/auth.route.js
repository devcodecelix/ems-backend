const express = require("express");
const passport = require("../config/passport");
const {
    googleCallback,
    logout,
    verify,
} = require("../controllers/auth.controller");
const router = express.Router();
const { protectedRoute } = require("../middlewares/auth.middleware");

// Auth
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"], session: false }));
router.get("/google/callback", passport.authenticate("google", { session: false, failureRedirect: "/login" }), googleCallback);
router.get("/verify", protectedRoute, verify);
router.post("/logout", logout);

module.exports = router;
