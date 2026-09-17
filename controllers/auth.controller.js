const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const axios = require("axios");

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
    console.log("Redirecting to Google:", redirectUri); // ADD THIS
    res.redirect(redirectUri);
};

const googleCallback = async (req, res) => {
    const code = req.query.code;
    console.log("[1] Received code:", code ? code.slice(0, 20) + "..." : "MISSING");

    if (!code) {
        console.log("[1a] No code — returning 400");
        return res.status(400).send("Missing code");
    }

    try {
        console.log("[2] Starting token exchange with Google...");
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
        console.log("[3] Token exchange SUCCESS. Access token received:", !!tokenRes.data.access_token);

        const { access_token } = tokenRes.data;

        console.log("[4] Fetching user info from Google...");
        const userRes = await axios.get(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            {
                headers: {
                    Authorization: `Bearer ${access_token}`,
                },
            }
        );
        console.log("[5] User info received:", userRes.data.email);

        const { email } = userRes.data;

        console.log("[6] Looking up user in DB for email:", email);
        let user = await User.findOne({ email });
        console.log("[7] Existing user found?", !!user);

        if (!user) {
            console.log("[8] Creating new user...");
            user = await User.create({
                email
            });
            console.log("[9] New user created with id:", user._id);
        }

        console.log("[10] Signing JWT for userId:", user._id);
        const token = jwt.sign(
            {
                userId: user._id,
                email: user.email,
                username: user.username,
            },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );
        console.log("[11] JWT signed successfully");

        res.cookie("token", token, {
            httpOnly: true,
            secure: true,
            sameSite: "none",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        console.log("[12] Cookie set on response");

        console.log("[13] Redirecting to:", process.env.CLIENT_URL);
        res.redirect(`${process.env.CLIENT_URL}`);
        console.log("[14] Redirect sent - request complete");
    } catch (err) {
        console.error("[ERROR] OAuth failed at step above this line.");
        console.error("[ERROR] Message:", err.message);
        console.error("[ERROR] Google response data:", JSON.stringify(err.response?.data, null, 2));
        console.error("[ERROR] Status code:", err.response?.status);
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