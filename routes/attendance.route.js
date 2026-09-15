const express = require("express");
const {
    markBatchattendance,
    checkTodaysAttendanceMarked,
    getInterneAttendence,
} = require("../controllers/attendance.controller");
const router = express.Router();
const { protectedRoute } = require("../middlewares/auth.middleware");

router.post("/", protectedRoute, markBatchattendance); // to mark attendance for a batch of interns by leader
router.post("/check-todays-attendance-marked", protectedRoute, checkTodaysAttendanceMarked); // to check if today's attendance is already marked or not by leader
router.get("/", protectedRoute, getInterneAttendence); // to get intern attendance history

module.exports = router;
