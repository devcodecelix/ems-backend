const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    role: {
      type: String,
      enum: ["unverified", "applied", "intern", "admin"],
      default: "unverified",
    },
    batch: {
      batchId: {
        type: Number,
        min: 16,
        max: 30,
      },
      domain: {
        type: String,
        enum: ["WEB", "AI", "APP", "UIUX"],
      },
      rollNo: {
        type: Number,
        min: 1,
        max: 50,
      },
      referenceNo:{
        type: String,
      },
      leader: {
        type: Boolean,
        default: false,
      },
      location: {
        type: String,
        enum: ["onsite", "remote"],
      },
    },
  },
  { timestamps: true }
);

userSchema.index(
  { "batch.batchId": 1, "batch.domain": 1, "batch.rollNo": 1 },
  {
    unique: true,
    partialFilterExpression: { "batch.rollNo": { $exists: true } },
  }
);

const User = mongoose.model("User", userSchema);

module.exports = User;