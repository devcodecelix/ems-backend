const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
        },
        description: {
            type: String,
        },
        batchId: {
            type: Number,
            required: true,
        },
        domain: {
            type: String,
            enum: ["WEB", "AI", "APP", "UIUX"],
            required: true,
        },
        location: {
            type: String,
            enum: ["onsite", "remote"],
            required: true,
        },
        deadline: {
            type: Date,
            required: true,
            required: true,
        },
        status: {
            type: String,
            enum: ["pending", "completed"],
            default: "pending",
        },
    },
);

const Project = mongoose.model("project", projectSchema);

module.exports = Project;
