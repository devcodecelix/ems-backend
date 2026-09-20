const express = require("express");
const {
    getMyBatchProjects,
    markStatusCompleted,
} = require("../controllers/project.controller");
const router = express.Router();
const { protectedRoute } = require("../middlewares/auth.middleware");

router.route("/").get(protectedRoute, getMyBatchProjects);
router.route("/:projectId/status").patch(protectedRoute, markStatusCompleted);

module.exports = router;
