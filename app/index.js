const express = require("express");
const os = require("os");

const app = express();

const port = process.env.PORT || 3000;

const prNumber = process.env.PR_NUMBER || "LOCAL";
const version = process.env.APP_VERSION || "DEV";

app.get("/", (req, res) => {
    res.send(`
        <h1>PR Preview Environment</h1>

        <h2>Project Working Successfully 🚀</h2>

        <p><b>PR Number:</b> ${prNumber}</p>

        <p><b>Version:</b> ${version}</p>

        <p><b>Hostname:</b> ${os.hostname()}</p>
    `);
});

app.get("/health", (req, res) => {
    res.send("OK");
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
