const express = require("express");
const {
    application,
} = require("../controllers/application.controller");
const router = express.Router();
const { protectedRoute } = require("../middlewares/auth.middleware");

router.post("/", protectedRoute, application); // to apply for a new application

module.exports = router;
