import express from "express";
import cors from "cors";
import path from "node:path";
import { mkdir } from "node:fs/promises";
import multer from "multer";
import { randomUUID } from "node:crypto";
import {
  runNewsletterPipeline,
  writeNewsletterArtifacts,
} from "../../../src/core/pipeline.js";
import type { Newsletter } from "../../../src/schemas/newsletter.js";

const PORT = 3333;
const DIST_DIR = path.resolve("dist");
const DIST_ASSETS_DIR = path.resolve(DIST_DIR, "assets");
const MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024;

const app = express();
app.use(
  cors({
    origin: ["http://127.0.0.1:5173", "http://localhost:5173"],
  }),
);
app.use(express.json({ limit: "2mb" }));
app.use("/dist", express.static(DIST_DIR));

const storage = multer.diskStorage({
  destination: async (_req, _file, callback) => {
    try {
      await mkdir(DIST_ASSETS_DIR, { recursive: true });
      callback(null, DIST_ASSETS_DIR);
    } catch (error: unknown) {
      callback(error as Error, DIST_ASSETS_DIR);
    }
  },
  filename: (_req, file, callback) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const assetId = randomUUID();
    callback(null, `${assetId}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_UPLOAD_SIZE_BYTES },
  fileFilter: (_req, file, callback) => {
    const mime = file.mimetype.toLowerCase();
    const allowed = mime === "image/png" || mime === "image/jpeg" || mime === "image/jpg";
    if (!allowed) {
      callback(new Error("Unsupported file type. Use png/jpg/jpeg."));
      return;
    }
    callback(null, true);
  },
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.post("/api/upload", upload.single("image"), (req, res) => {
  if (!req.file) {
    res.status(400).json({
      ok: false,
      message: "Missing image file in multipart/form-data field 'image'.",
    });
    return;
  }

  const filename = req.file.filename;
  const assetId = path.parse(filename).name;
  const relativePath = `assets/${filename}`;
  res.json({
    ok: true,
    assetId,
    filename,
    relativePath,
  });
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

function collectRelativeAssets(newsletter: Newsletter): string[] {
  const relativePaths = new Set<string>();
  for (const block of newsletter.blocks) {
    if (block.type === "releaseSection") {
      for (const item of block.items) {
        for (const media of item.media ?? []) {
          if (media.src.startsWith("assets/")) {
            relativePaths.add(media.src);
          }
        }
      }
      continue;
    }

    if ("images" in block) {
      for (const image of block.images ?? []) {
        if (image.src.startsWith("assets/")) {
          relativePaths.add(image.src);
        }
      }
    }
  }
  return [...relativePaths];
}

app.post("/api/generate", async (req, res) => {
  const publishMode = req.body?.publishMode === "outlook-cid" ? "outlook-cid" : "preview/local";
  const newsletterInput = req.body?.newsletter ?? req.body;
  const result = runNewsletterPipeline(newsletterInput);
  if (!result.ok) {
    res.status(400).json({
      ok: false,
      issues: result.qa.issues,
      qaReport: result.qaReport,
    });
    return;
  }

  if (publishMode === "outlook-cid") {
    res.status(501).json({
      ok: false,
      issues: result.qa.issues,
      qaReport: result.qaReport,
      message: "outlook-cid mode is TODO for MVP. Use preview/local for now.",
      todo: "Render cid:<assetId> and output .eml attachments in a future iteration.",
    });
    return;
  }

  const files = await writeNewsletterArtifacts(result, DIST_DIR);
  const uploadedAssets = collectRelativeAssets(result.newsletter);
  res.json({
    ok: result.qa.ok,
    issues: result.qa.issues,
    qaReport: result.qaReport,
    emailHtml: result.emailHtml,
    previewHtml: result.previewHtml,
    files,
    uploadedAssets,
    publishMode,
    previewUrl: "http://localhost:3333/dist/preview.html",
  });
});

app.listen(PORT, () => {
  process.stdout.write(`Local server running on http://localhost:${PORT}\n`);
});
