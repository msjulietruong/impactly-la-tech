const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
    res.status(200).json({
        status: "doing ok",
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
    });
});

module.exports = router;
