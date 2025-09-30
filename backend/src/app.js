const express = require("express");
const health = require("./routes/health");

const app = express();

app.use(express.json());

app.use("/", health);
app.use("/health", health);

module.exports = app;
