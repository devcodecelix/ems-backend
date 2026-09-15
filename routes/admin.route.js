const express = require("express");
const {
    getInterneAttendence,
    getAllApplications,
    approvedDeniedApplication,
    deleteIntern,
    getAllInterns,
    makebatchLeader,
} = require("../controllers/admin.controller");
const router = express.Router();
const { protectedRoute } = require("../middlewares/auth.middleware");

router.post("/application/status", protectedRoute, approvedDeniedApplication); // to approve or deny an application
router.get("/application", protectedRoute, getAllApplications); // to get all applications of the logged in user

router.route("/intern/:internId").delete(protectedRoute, deleteIntern); // to delete an intern by admin
router.get("/intern/:referenceNo", protectedRoute, getInterneAttendence); // to get intern attendance history
router.get("/intern", protectedRoute, getAllInterns); // to get all interns
router.route("/admin/make-batch-leader").post(protectedRoute, makebatchLeader); // to make an intern a batch leader

module.exports = router;
