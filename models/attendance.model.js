const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
    {
        referenceNo: {
            type: String,
            required: true,
        },
        batchId: {
            type: Number,
            required: true,
        },
        domain: {
            type: String,
            enum: ["web", "ai", "app"],
            required: true,
        },
        date: {
            type: Date,
            required: true,
            default: Date.now,
        },
        status: {
            type: String,
            enum: ["present", "absent"],
            default: "present",
        },
    },
);

const attendance = mongoose.model("attendance", attendanceSchema);

module.exports = attendance;
