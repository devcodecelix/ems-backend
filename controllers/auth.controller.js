const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const axios = require("axios");

// const googleCallback = (req, res) => {
//     try {
//         const token = jwt.sign(
//             { userId: req.user._id, },
//             process.env.JWT_SECRET,
//             { expiresIn: "7d" }
//         );

//         res.cookie("token", token, {
//             httpOnly: true,
//             secure: true,
//             sameSite: "none",
//             maxAge: 7 * 24 * 60 * 60 * 1000,
//         });

//         res.redirect(`${process.env.CLIENT_URL}`);
//     } catch (err) {
//         console.log("Error in googleCallback:", err);
//         return res.status(401).json({ message: "Unauthorized" });
//     }
// };

const redirectGoogle = (req, res) => {
    const redirectUri =
        "https://accounts.google.com/o/oauth2/v2/auth?" +
        new URLSearchParams({
            client_id: process.env.GOOGLE_CLIENT_ID,
            redirect_uri: `${process.env.SERVER_URL}/api/v1/auth/google/callback`,
            response_type: "code",
            scope: "email profile",
            access_type: "offline",
            prompt: "consent",
        });
    res.redirect(redirectUri);
};

const googleCallback = async (req, res) => {
    const code = req.query.code;

    if (!code) return res.status(400).send("Missing code");

    try {
        const tokenRes = await axios.post(
            "https://oauth2.googleapis.com/token",
            new URLSearchParams({
                code,
                client_id: process.env.GOOGLE_CLIENT_ID,
                client_secret: process.env.GOOGLE_CLIENT_SECRET,
                redirect_uri: `${process.env.SERVER_URL}/api/v1/auth/google/callback`,
                grant_type: "authorization_code",
            }),
            {
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
            }
        );

        const { access_token } = tokenRes.data;

        const userRes = await axios.get(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            {
                headers: {
                    Authorization: `Bearer ${access_token}`,
                },
            }
        );

        const { email } = userRes.data;

        let user = await User.findOne({ email });

        if (!user) {
            user = await User.create({
                email
            });
        }

        const token = jwt.sign(
            {
                userId: user._id,
                email: user.email,
                username: user.username,
            },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.cookie("token", token, {
            httpOnly: true,
            secure: true,
            sameSite: "none",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        res.redirect(`${process.env.CLIENT_URL}`);
    } catch (err) {
        console.error("OAuth Error", err.response?.data || err.message);
        res.status(500).send("Authentication failed");
    }
};

const logout = (req, res) => {
    try {
        res.clearCookie("token", {
            httpOnly: true,
            secure: true,
            sameSite: "none",
            maxAge: 7 * 24 * 60 * 60 * 1000,
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
    redirectGoogle,
    googleCallback,
    logout,
    verify,
};