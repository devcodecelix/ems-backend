const Attendance = require("../models/attendance.model");
const User = require("../models/user.model");
const Project = require("../models/project.model");
const ExcelJS = require("exceljs");

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
            {
                "batch.batchId": intern.batch.batchId,
                "batch.domain": intern.batch.domain,
                "batch.location": intern.batch.location,
                "batch.leader": true,
            },
            { $set: { "batch.leader": false } }
        );

        intern.batch.leader = true;
        await intern.save();

        return res.status(200).json({ message: "Batch leader updated successfully" });
    } catch (err) {
        console.log("Error in makebatchLeader:", err);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}

const removeBatchLeader = async (req, res) => {
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

        intern.batch.leader = false;
        await intern.save();

        return res.status(200).json({ message: "Batch leader removed successfully" });
    } catch (err) {
        console.log("Error in removeBatchLeader:", err);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}

const getBatchAttendanceExcel = async (req, res) => {
    try {
        const user = req.user;
        if (user.role !== "admin") {
            return res.status(403).json({ message: "Access Denied" });
        }

        const { month, batchId, domain } = req.query;
        if (!month || !batchId || !domain) {
            return res.status(400).json({ message: "month, batchId and domain are required" });
        }

        const [year, monthIndex] = month.split("-").map(Number);
        if (!year || !monthIndex || monthIndex < 1 || monthIndex > 12) {
            return res.status(400).json({ message: "Invalid month format" });
        }

        const batchIdNum = Number(batchId);
        const startDate = new Date(Date.UTC(year, monthIndex - 1, 1));
        const endDate = new Date(Date.UTC(year, monthIndex, 1));

        const interns = await User.find({
            role: "intern",
            "batch.batchId": batchIdNum,
            "batch.domain": domain,
        }).sort({ name: 1 });

        const attendanceRecords = await Attendance.find({
            batchId: batchIdNum,
            domain,
            date: { $gte: startDate, $lt: endDate },
        });

        const counts = new Map();
        attendanceRecords.forEach((record) => {
            if (!counts.has(record.referenceNo)) {
                counts.set(record.referenceNo, { present: 0, absent: 0 });
            }
            if (record.status === "absent") {
                counts.get(record.referenceNo).absent += 1;
            } else {
                counts.get(record.referenceNo).present += 1;
            }
        });

        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet(`Attendance ${month}`);

        sheet.getColumn(1).width = 28;
        sheet.getColumn(2).width = 34;
        sheet.getColumn(3).width = 16;
        sheet.getColumn(4).width = 12;
        sheet.getColumn(5).width = 12;
        sheet.getColumn(6).width = 10;
        sheet.getColumn(7).width = 16;

        const monthName = new Date(Date.UTC(year, monthIndex - 1, 1)).toLocaleString("en-US", {
            month: "long",
            year: "numeric",
        });
        const dateTime = new Date().toLocaleString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: true,
        });

        sheet.mergeCells("A1:G1");
        sheet.getCell("A1").value = "Monthly Attendance Report";
        sheet.getCell("A1").font = { bold: true, size: 14 };
        sheet.getCell("A1").alignment = { vertical: "middle", horizontal: "left" };
        sheet.getRow(1).height = 24;

        sheet.mergeCells("A2:G2");
        sheet.getCell("A2").value = `Generated on: ${dateTime}`;
        sheet.getCell("A2").font = { size: 10 };

        sheet.mergeCells("A3:G3");
        sheet.getCell("A3").value = `Batch: ${batchIdNum}    |    Domain: ${domain}    |    Month: ${monthName}`;
        sheet.getCell("A3").font = { size: 10 };

        const headerRow = sheet.addRow(["Name", "Email", "Reference No", "Present", "Absent", "Total", "Percentage (%)"]);
        headerRow.font = { bold: true };
        headerRow.alignment = { vertical: "middle" };
        headerRow.height = 20;

        interns.forEach((intern) => {
            const refNo = intern.batch?.referenceNo ?? "";
            const count = counts.get(refNo) || { present: 0, absent: 0 };
            const total = count.present + count.absent;
            const percentage = total > 0
                ? Math.round((count.present / total) * 1000) / 10
                : 0;

            sheet.addRow([intern.name || "-", intern.email || "-", refNo, count.present, count.absent, total, percentage]);
        });

        sheet.views = [{ state: "frozen", ySplit: headerRow.number }];

        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.setHeader("Content-Disposition", `attachment; filename="attendance_batch${batchIdNum}_${domain}_${month}.xlsx"`);

        await workbook.xlsx.write(res);
        res.end();
    } catch (err) {
        console.log("Error in getBatchAttendanceExcel:", err);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}

const assignNewProject = async (req, res) => {
    try {
        const user = req.user;
        if (user.role !== "admin") {
            return res.status(403).json({ message: "Access Denied" });
        }

        const { batchId, domain, location, title, description, deadline } = req.body;

        if (!batchId || !domain || !location || !title || !deadline) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const project = await Project.create({
            title,
            description,
            batchId,
            domain,
            location,
            deadline,
            status: "pending",
        });

        return res.status(200).json(project);
    } catch (err) {
        console.log("Error in assignNewProject:", err);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}

const getAllProjects = async (req, res) => {
    try {
        const user = req.user;
        if (user.role !== "admin") {
            return res.status(403).json({ message: "Access Denied" });
        }

        const projects = await Project.find();
        return res.status(200).json(projects);
    } catch (err) {
        console.log("Error in getAllProjects:", err);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}

const deleteProject = async (req, res) => {
    try {
        const user = req.user;

        if (user.role !== "admin") {
            return res.status(403).json({ message: "Access Denied" });
        }

        const { projectId } = req.params;
        const project = await Project.findById(projectId);

        if (!project) {
            return res.status(400).json({ message: "Project not found" });
        }

        await Project.findByIdAndDelete(projectId);
        return res.status(200).json();
    } catch (err) {
        console.log("Error in deleteProject:", err);
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
    removeBatchLeader,
    getBatchAttendanceExcel,
    assignNewProject,
    getAllProjects,
    deleteProject
};
