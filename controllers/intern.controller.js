const User = require("../models/user.model");

const getInternStats = async (req, res) => {
    try {
        const user = req.user;

        if (user.role !== "intern") {
            return res.status(403).json({ message: "Access Denied" });
        }

        const getBatchInternCount = await User.countDocuments({ "batch.batchId": user.batch.batchId, role: "intern", "batch.domain": user.batch.domain });
        const getBatchLeader = await User.findOne({ "batch.batchId": user.batch.batchId, "batch.domain": user.batch.domain, "batch.leader": true });

        return res.status(200).json({
            batchInternCount: getBatchInternCount,
            batchLeader: getBatchLeader ? getBatchLeader.name : null,
        });
    } catch (err) {
        console.log("Error in getInternStats:", err);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}

const getAllTeamMembers = async (req, res) => {
    try {
        const user = req.user;

        if (user.role !== "intern") {
            return res.status(403).json({ message: "Access Denied" });
        }

        const teamInterns = await User.find({ "batch.batchId": user.batch.batchId, role: "intern", "batch.domain": user.batch.domain });

        return res.status(200).json(teamInterns);
    } catch (err) {
        console.log("Error in getAllTeamMembers:", err);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}

module.exports = {
    getInternStats,
    getAllTeamMembers,
};