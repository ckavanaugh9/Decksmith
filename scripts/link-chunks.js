#!/usr/bin/env node
/**
 * Next.js 15 server chunk resolution workaround:
 * The webpack runtime does require("./NNN.js") relative to .next/server/,
 * but chunk files live in .next/server/chunks/NNN.js. Create symlinks
 * so require("./NNN.js") resolves to chunks/NNN.js.
 */
const fs = require("fs");
const path = require("path");

const serverDir = path.join(process.cwd(), ".next", "server");
const chunksDir = path.join(serverDir, "chunks");

if (!fs.existsSync(chunksDir)) {
  process.exit(0);
}

const files = fs.readdirSync(chunksDir);
let linked = 0;
for (const name of files) {
  if (!name.endsWith(".js")) continue;
  const target = path.join(serverDir, name);
  const source = path.join("chunks", name);
  try {
    if (fs.existsSync(target)) fs.unlinkSync(target);
    fs.symlinkSync(source, target);
    linked++;
  } catch (e) {
    console.warn("link-chunks:", e.message);
  }
}
if (linked > 0) {
  console.log("Linked", linked, "chunk(s) in .next/server");
}
