const User = require("../models/user.model");
const jwt = require("jsonwebtoken");

const protectedRoute = async (req, res, next) => {
    try {
        const token = req.cookies.token;

        if (!token) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const getUser = await User.findById(decoded.userId);
        if (!getUser) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        req.user = getUser;
        next();
    } catch (err) {
        console.log("Error in protectedRoute:", err.message);
        return res.status(401).json({ message: "Unauthorized" });
    }
}

module.exports = {
    protectedRoute,
};
