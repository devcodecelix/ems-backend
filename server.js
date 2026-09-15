const express = require("express");
const connectDB = require("./config/db");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const app = express();
require("dotenv").config();

const PORT = process.env.PORT;

app.use(express.json());
app.use(cookieParser());
app.use(cors(
    {
        origin: process.env.CLIENT_URL,
        credentials: true,
    }
));

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api/v1/auth", require("./routes/auth.route"));
app.use("/api/v2/application", require("./routes/application.route"));
app.use("/api/v3/intern", require("./routes/intern.route"));
app.use("/api/v4/attendance", require("./routes/attendance.route"));
app.use("/api/v5/admin", require("./routes/admin.route"));

connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
});