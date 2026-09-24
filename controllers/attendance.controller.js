const User = require("../models/user.model");
const Attendance = require("../models/attendance.model");

const markBatchattendance = async (req, res) => {
    try {
        const user = req.user;
        if (!user.batch.leader) {
            return res.status(403).json({ message: "Access Denied" });
        }

        const { batchId, domain, referenceNos = [], absentReferenceNos = [] } = req.body;

        if (!batchId || !domain) {
            return res.status(400).json({ message: "All fields are required" });
        }

        if (referenceNos.length === 0 && absentReferenceNos.length === 0) {
            return res.status(400).json({ message: "No interns provided" });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // check today attendance is already marked or not
        const checkAlreadyMarked = await Attendance.find({ batchId, domain, date: { $gte: today } });
        if (checkAlreadyMarked.length > 0) {
            return res.status(400).json({ message: "attendance already marked" });
        }

        const presentRecords = referenceNos.map((referenceNo) => ({
            referenceNo,
            batchId,
            domain,
            status: "present",
        }));

        const absentRecords = absentReferenceNos.map((referenceNo) => ({
            referenceNo,
            batchId,
            domain,
            status: "absent",
        }));

        await Attendance.insertMany([...presentRecords, ...absentRecords]);

        return res.status(200).json();
    } catch (err) {
        console.log("Error in markBatchattendance:", err);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}

const checkTodaysAttendanceMarked = async (req, res) => {
    try {
        const user = req.user;

        if (!user.batch.leader) {
            return res.status(403).json({ message: "Access Denied" });
        }

        const { batchId, domain } = req.body;

        if (!batchId || !domain) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const checkAlreadyMarked = await Attendance.find({ batchId, domain, date: { $gte: today } });
        if (checkAlreadyMarked.length > 0) {
            return res.status(200).json({ marked: true });
        }

        return res.status(200).json({ marked: false });
    } catch (err) {
        console.log("Error in checkTodaysAttendanceMarked:", err);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}

const getInterneAttendence = async (req, res) => {
    try {
        const user = req.user;
        if (!user.role === "intern") {
            return res.status(403).json({ message: "Access Denied" });
        }

        const { batchId, domain, referenceNo } = user.batch;

        const batchAttendance = await Attendance.find({ batchId, domain }).sort({ date: -1 });

        const presentDates = new Set(
            batchAttendance
                .filter((record) => record.referenceNo === referenceNo)
                .map((record) => record.date.toISOString().split("T")[0])
        );

        const dates = new Map();
        batchAttendance.forEach((record) => {
            const key = record.date.toISOString().split("T")[0];
            if (dates.has(key)) return;
            dates.set(key, {
                _id: record._id,
                date: record.date,
                status: presentDates.has(key) ? "present" : "absent",
            });
        });

        res.status(200).json(Array.from(dates.values()));
    } catch (error) {
        console.error("Error fetching attendance history:", error);
        res.status(500).json({ message: "Failed to fetch attendance history" });
    }
};

module.exports = {
    markBatchattendance,
    checkTodaysAttendanceMarked,
    getInterneAttendence,
};