const jwt = require("jsonwebtoken");
const User = require("../models/user.model");

const googleCallback = (req, res) => {
    try {
        const token = jwt.sign(
            { userId: req.user._id, },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.cookie("token", token, {
            httpOnly: true,
            secure: false,
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        res.redirect(`${process.env.CLIENT_URL}`);
    } catch (err) {
        console.log("Error in googleCallback:", err);
        return res.status(401).json({ message: "Unauthorized" });
    }
};

const logout = (req, res) => {
    try {
        res.clearCookie("token", {
            httpOnly: true,
            secure: false,
            sameSite: "lax",
        });
        return res.status(200).json();
    } catch (err) {
        console.log("Error in logout:", err);
        return res.status(401).json({ message: "Unauthorized" });
    }
}

const verify = (req, res) => {
    try {
        const user = req.user;

        return res.status(200).json(user);
    } catch (err) {
        console.log("Error in verify:", err);
        return res.status(401).json({ message: "Unauthorized" });
    }
};

module.exports = {
    googleCallback,
    logout,
    verify,
};