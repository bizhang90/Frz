import { cp, mkdir, rm, stat, readdir, writeFile } from "node:fs/promises";
import { join, dirname, resolve, extname } from "node:path";

const out = resolve("dist/cloudflare-public");
await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });

// Only deliver explicitly public site assets. Never upload backend,
// migrations, internal docs, workflow config, or .env files as assets.
const directories = ["assets", "du-an", "login", "nhan-vien"];
const standalone = [
  "index.html", "404.html", "privacy.html", "data-deletion.html",
  "styles.css", "app.js", "logo.png", "config.js",
  "robots.txt", "sitemap.xml", "site.webmanifest",
];
const extensions = new Set([
  ".html", ".css", ".js", ".json", ".xml", ".txt",
  ".png", ".jpg", ".jpeg", ".gif", ".webp", ".avif", ".svg",
  ".ico", ".woff", ".woff2", ".webmanifest", ".pdf",
]);

let count = 0;
async function copyTree(relative) {
  const source = resolve(relative);
  for (const item of await readdir(source, { withFileTypes: true })) {
    if (item.name.startsWith(".") || item.isSymbolicLink()) continue;
    const path = join(relative, item.name);
    if (item.isDirectory()) {
      await copyTree(path);
      continue;
    }
    if (!item.isFile() || !extensions.has(extname(item.name).toLowerCase())) continue;
    const size = (await stat(path)).size;
    if (size > 24 * 1024 * 1024) throw new Error("Static asset too large: " + path);
    await mkdir(dirname(join(out, path)), { recursive: true });
    await cp(path, join(out, path));
    count += 1;
  }
}
for (const path of directories) await copyTree(path);
for (const path of standalone) {
  await cp(path, join(out, path));
  count += 1;
}

await writeFile(join(out, "_headers"), [
  "/*",
  "  X-Content-Type-Options: nosniff",
  "  Referrer-Policy: strict-origin-when-cross-origin",
  "  Permissions-Policy: camera=(), microphone=(), geolocation=(self)",
  "  X-Frame-Options: SAMEORIGIN",
  "  Cross-Origin-Opener-Policy: same-origin",
  "",
  "/login/*",
  "  Cache-Control: no-store",
  "  X-Robots-Tag: noindex, nofollow",
  "",
  "/nhan-vien/*",
  "  Cache-Control: no-store",
  "  X-Robots-Tag: noindex, nofollow",
  "",
  "/assets/fonts/*",
  "  Cache-Control: public, max-age=31536000, immutable",
  "",
  "/assets/img/*",
  "  Cache-Control: public, max-age=31536000, immutable",
  "",
].join("\n"));
console.log("Prepared " + count + " public files for Cloudflare Workers assets.");
