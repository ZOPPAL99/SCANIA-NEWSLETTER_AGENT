import express from "express";
import cors from "cors";
import path from "node:path";
import {
  runNewsletterPipeline,
  writeNewsletterArtifacts,
} from "../../../src/core/pipeline.js";

const PORT = 3333;
const DIST_DIR = path.resolve("dist");

const app = express();
app.use(
  cors({
    origin: ["http://127.0.0.1:5173", "http://localhost:5173"],
  }),
);
app.use(express.json({ limit: "2mb" }));
app.use("/dist", express.static(DIST_DIR));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.post("/api/validate", (req, res) => {
  const result = runNewsletterPipeline(req.body);
  if (!result.ok) {
    res.json({
      ok: false,
      issues: result.qa.issues,
      qaReport: result.qaReport,
    });
    return;
  }

  res.json({
    ok: result.qa.ok,
    issues: result.qa.issues,
    qaReport: result.qaReport,
    previewHtml: result.previewHtml,
  });
});

app.post("/api/generate", async (req, res) => {
  const result = runNewsletterPipeline(req.body);
  if (!result.ok) {
    res.status(400).json({
      ok: false,
      issues: result.qa.issues,
      qaReport: result.qaReport,
    });
    return;
  }

  const files = await writeNewsletterArtifacts(result, DIST_DIR);
  res.json({
    ok: result.qa.ok,
    issues: result.qa.issues,
    qaReport: result.qaReport,
    emailHtml: result.emailHtml,
    previewHtml: result.previewHtml,
    files,
    previewUrl: "http://localhost:3333/dist/preview.html",
  });
});

app.listen(PORT, () => {
  process.stdout.write(`Local server running on http://localhost:${PORT}\n`);
});
