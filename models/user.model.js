const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
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
      },
      domain: {
        type: String,
        enum: ["web", "ai", "app"],
      },
      referenceNo: {
        type: String,
      },
      leader: {
        type: Boolean,
        default: false,
      },
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

module.exports = User;
