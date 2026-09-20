const Project = require("../models/project.model");

const getMyBatchProjects = async (req, res) => {
    try {
        const user = req.user;

        if (!user.batch || !user.batch.batchId) {
            return res.status(400).json({ message: "User is not assigned to any batch" });
        }

        const projects = await Project.find({ batchId: user.batch.batchId, domain: user.batch.domain, location: user.batch.location }).sort({ deadline: 1 });

        return res.status(200).json(projects);
    } catch (err) {
        console.log("Error in getMyBatchProjects:", err);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}

const markStatusCompleted = async (req, res) => {
    try {
        const user = req.user;
        if (user.batch.leader) {
            const { projectId } = req.params;
            const project = await Project.findOne({ _id: projectId, batchId: user.batch.batchId, domain: user.batch.domain, location: user.batch.location });
            if (!project) {
                return res.status(404).json({ message: "Project not found" });
            }

            project.status = "completed";

            await project.save();
            return res.status(200).json();
        } else {
            return res.status(403).json({ message: "Access Denied" });
        }
    } catch (err) {
        console.log("Error in markStatusCompleted:", err);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}

module.exports = {
    getMyBatchProjects,
    markStatusCompleted,
}