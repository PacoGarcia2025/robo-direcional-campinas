// ===============================
// ARQUIVO: src/images/index.js
// REFINADOR DE IMAGENS (NODE 18+ / 20 / 22)
// SEM node-fetch (usa fetch nativo)
// ===============================

import fs from "fs";
import sizeOf from "image-size";
import crypto from "crypto";

const BLOCKLIST = [
  "icon",
  "logo",
  "button",
  "btn",
  "whatsapp",
  "consultor",
  "facebook",
  "instagram",
  "modal",
  "arrow",
  "sprite",
  "ui"
];

const ALLOWED_EXTENSIONS = ["jpg", "jpeg", "webp"];
const MIN_WIDTH = 600;
const MIN_HEIGHT = 400;
const MIN_RATIO = 0.6;
const MAX_RATIO = 2.2;

function getExtension(url) {
  return url.split("?")[0].split(".").pop().toLowerCase();
}

function isBlocked(url) {
  const lower = url.toLowerCase();
  return BLOCKLIST.some(word => lower.includes(word));
}

async function download(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error("download error");
  return Buffer.from(await res.arrayBuffer());
}

function hash(buffer) {
  return crypto.createHash("md5").update(buffer).digest("hex");
}

export async function refineImages(inputPath, outputPath) {
  const data = JSON.parse(fs.readFileSync(inputPath, "utf-8"));
  const usedHashes = new Set();

  for (const item of data) {
    const refined = [];

    for (const url of item.images || []) {
      try {
        const ext = getExtension(url);
        if (!ALLOWED_EXTENSIONS.includes(ext)) continue;
        if (isBlocked(url)) continue;

        const buffer = await download(url);
        const dim = sizeOf(buffer);

        if (!dim.width || !dim.height) continue;
        if (dim.width < MIN_WIDTH || dim.height < MIN_HEIGHT) continue;

        const ratio = dim.width / dim.height;
        if (ratio < MIN_RATIO || ratio > MAX_RATIO) continue;

        const imgHash = hash(buffer);
        if (usedHashes.has(imgHash)) continue;

        usedHashes.add(imgHash);
        refined.push(url);
      } catch {
        continue;
      }
    }

    item.images = refined;
  }

  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
}
