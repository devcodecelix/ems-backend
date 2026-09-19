const Attendance = require("../models/attendance.model");
const User = require("../models/user.model");

const getInterneAttendence = async (req, res) => {
    try {
        const user = req.user;
        if (!user.role === "admin") {
            return res.status(403).json({ message: "Access Denied" });
        }

        const { referenceNo } = req.params;

        const getAttendance = await Attendance.find({ referenceNo }).sort({ date: -1 });

        return res.status(200).json(getAttendance);
    } catch (err) {
        console.log("Error in getInterneAttendence:", err);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}

const getAllApplications = async (req, res) => {
    try {
        const user = req.user;

        if (user.role === "admin") {
            const applications = await User.find({ role: "applied" });
            return res.status(200).json(applications);
        }

        if (user.batch.leader) {
            const applications = await User.find({ "batch.batchId": user.batch.batchId, role: "applied" });
            return res.status(200).json(applications);
        }

        return res.status(403).json({ message: "Access Denied" });
    } catch (err) {
        console.log("Error in getAllApplications:", err);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}

const approvedDeniedApplication = async (req, res) => {
    try {
        const user = req.user;

        if (user.role !== "admin") {
            return res.status(403).json({ message: "Access Denied" });
        }

        const { userId, status } = req.body;

        if (!userId) {
            return res.status(400).json({ message: "Application Id required" });
        }

        const getUser = await User.findById(userId);
        if (!getUser && getUser.role !== "applied") {
            return res.status(400).json({ message: "Not allowed" });
        }

        if (status) {
            getUser.role = "intern";
            await getUser.save();
        }

        if (!status) {
            await User.findByIdAndDelete(userId);
        }

        return res.status(200).json();
    } catch (err) {
        console.log("Error in approvedDeniedApplication:", err);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}

const deleteIntern = async (req, res) => {
    try {
        const user = req.user;

        if (user.role !== "admin") {
            return res.status(403).json({ message: "Access Denied" });
        }

        const { internId } = req.params;
        const intern = await User.findById(internId);
        if (!intern || intern.role !== "intern") {
            return res.status(400).json({ message: "Not allowed" });
        }

        await User.findByIdAndDelete(internId);
        return res.status(200).json();
    } catch (err) {
        console.log("Error in removeIntern:", err);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}

const getAllInterns = async (req, res) => {
    try {
        const user = req.user;
        if (user.role === "admin") {
            const interns = await User.find({ role: "intern" });
            return res.status(200).json(interns);
        }

        return res.status(403).json({ message: "Access Denied" });
    } catch (err) {
        console.log("Error in getAllInterns:", err);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

const makebatchLeader = async (req, res) => {
    try {
        const user = req.user;
        if (user.role !== "admin") {
            return res.status(403).json({ message: "Access Denied" });
        }

        const { internId } = req.body;
        const intern = await User.findById(internId);
        if (!intern || intern.role !== "intern") {
            return res.status(400).json({ message: "Not allowed" });
        }

        // remove previous leader if exists
        await User.updateMany(
            { "batch.batchId": intern.batch.batchId, "batch.domain": intern.batch.domain, "batch.leader": true, "user.location":intern.batch.location },
            { $set: { "batch.leader": false } }
        );

        intern.batch.leader = true;
        await intern.save();

        return res.status(200).json();
    } catch (err) {
        console.log("Error in makebatchLeader:", err);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}

module.exports = {
    getInterneAttendence,
    getAllApplications,
    approvedDeniedApplication,
    deleteIntern,
    getAllInterns,
    makebatchLeader,
};
