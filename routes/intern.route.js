const express = require("express");
const {
    getInternStats,
    getAllTeamMembers,
} = require("../controllers/intern.controller");
const router = express.Router();
const { protectedRoute } = require("../middlewares/auth.middleware");

router.route("/stats").get(protectedRoute, getInternStats); // to get intern stats like total interns, total batch leaders, total batches, total applications, total approved applications, total denied applications
router.route("/").get(protectedRoute, getAllTeamMembers); // to get all team members of a batch leader

module.exports = router;
