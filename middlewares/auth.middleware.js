const User = require("../models/user.model");
const jwt = require("jsonwebtoken");

const protectedRoute = async (req, res, next) => {
    try {
        console.log("[1] Cookies received on request:", req.cookies);

        const token = req.cookies.token;
        console.log("[2] Token cookie present?", !!token);

        if (!token) {
            console.log("[2a] No token found — likely cookie blocked or not sent. Returning 401.");
            return res.status(401).json({ message: "Unauthorized" });
        }

        console.log("[3] Verifying JWT...");
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log("[4] JWT verified. Decoded userId:", decoded.userId);

        console.log("[5] Looking up user in DB...");
        const getUser = await User.findById(decoded.userId);
        console.log("[6] User found?", !!getUser);

        if (!getUser) {
            console.log("[6a] No matching user in DB for this token. Returning 401.");
            return res.status(401).json({ message: "Unauthorized" });
        }

        req.user = getUser;
        console.log("[7] req.user set successfully:", getUser.email);
        next();
    } catch (err) {
        console.log("[ERROR] Error in protectedRoute:", err.message);
        console.log("[ERROR] Error name:", err.name);
        return res.status(401).json({ message: "Unauthorized" });
    }
}

module.exports = {
    protectedRoute,
};