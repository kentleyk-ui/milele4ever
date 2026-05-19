const express = require("express");

const monarkDebugMiddleware = require("./middleware/monarkDebug");
const monarkLogsRouter = require("./routes/monarkLogs");

const app = express();

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

// MONARK DEBUG : avant les autres routes.
app.use(monarkDebugMiddleware);
app.use("/api/monark", monarkLogsRouter);

app.get("/api/monark/health", (_req, res) => {
  res.json({ ok: true, service: "monark-monitoring", timestamp: new Date().toISOString() });
});

module.exports = app;