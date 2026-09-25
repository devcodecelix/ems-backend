const User = require("../models/user.model");

const application = async (req, res) => {
    try {
        const user = req.user;
        const { batchId, domain, referenceNo, name, location } = req.body;

        const getUser = await User.findById(user._id);
        if (!getUser) {
            return res.status(404).json({ message: "User not found" });
        }
        if (user.role !== "unverified") {
            return res.status(403).json({ message: "Access Denied" });
        }

        if (!batchId || !domain || !referenceNo || !name || !location) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const getuserNyreferenceNo = await User.findOne({ "batch.referenceNo": referenceNo });
        if (getuserNyreferenceNo) {
            return res.status(400).json({ message: "Reference number already exists" });
        }

        getUser.role = "applied";

        getUser.batch.batchId = batchId;
        getUser.batch.domain = domain;
        getUser.batch.referenceNo = referenceNo;
        getUser.name = name;
        getUser.batch.location = location;

        await getUser.save();

        return res.status(200).json(user);
    } catch (err) {
        console.log("Error in application:", err);
        return res.status(401).json({ message: "Unauthorized" });
    }
};

module.exports = {
    application,
};