/*
  Exemple d'integration Express du systeme Monark.
  Colle ce bloc dans ton app.js/server.js existant.
*/

const express = require("express");
const cookieParser = require("cookie-parser");

const monarkDebugMiddleware = require("./middleware/monarkDebug");
const monarkLogsRouter = require("./routes/monarkLogs");

const app = express();

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Middleware debug global (capture toutes les requetes)
app.use(monarkDebugMiddleware);

// Routes Monark logs
app.use("/api", monarkLogsRouter);

// Healthcheck
app.get("/api/monark/health", (_req, res) => {
  res.json({ ok: true, service: "monark-monitoring", timestamp: new Date().toISOString() });
});

module.exports = app;
