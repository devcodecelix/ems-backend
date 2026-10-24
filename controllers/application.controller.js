const User = require("../models/user.model");

const application = async (req, res) => {
    try {
        const { batchId, domain, rollNo, name, location } = req.body;

        if (!batchId || !domain || !rollNo || !name || !location || typeof name !== "string") {
            return res.status(400).json({ message: "All fields are required" });
        }

        const cleanName = name.trim();
        const batchNum = Number(batchId);
        const rollNum = Number(rollNo);

        if (!cleanName) {
            return res.status(400).json({ message: "Name is required" });
        }
        if (!Number.isInteger(batchNum) || batchNum < 17 || batchNum > 30) {
            return res.status(400).json({ message: "Invalid batch" });
        }
        if (!["WEB", "AI", "APP", "UIUX"].includes(domain)) {
            return res.status(400).json({ message: "Invalid domain" });
        }
        if (!Number.isInteger(rollNum) || rollNum < 1 || rollNum > 50) {
            return res.status(400).json({ message: "Invalid roll number" });
        }
        if (!["onsite", "remote"].includes(location)) {
            return res.status(400).json({ message: "Invalid location" });
        }

        const referenceNo = `B${batchNum}-${domain}-${String(rollNum).padStart(2, "0")}`;

        // Atomic: sirf "unverified" user apply kar sakta hai
        const updatedUser = await User.findOneAndUpdate(
            { _id: req.user._id, role: "unverified" },
            {
                $set: {
                    role: "applied",
                    name: cleanName,
                    "batch.batchId": batchNum,
                    "batch.domain": domain,
                    "batch.rollNo": rollNum,
                    "batch.referenceNo": referenceNo,
                    "batch.location": location,
                },
            },
            { returnDocument: "after", runValidators: true }
        ).select("-__v");

        if (!updatedUser) {
            return res.status(403).json({ message: "Access Denied or already applied" });
        }

        return res.status(200).json(updatedUser);
    } catch (err) {
        if (err.code === 11000) {
            return res
                .status(409)
                .json({ message: "This batch/domain/roll number is already taken" });
        }
        if (err.name === "ValidationError") {
            return res.status(400).json({ message: err.message });
        }

        console.log("Error in application:", err);
        return res.status(500).json({ message: "Internal server error" });
    }
};

module.exports = {
    application,
};