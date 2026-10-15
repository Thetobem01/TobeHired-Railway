// TobeHired on Railway: serves ./public and the Ask TobeHired assistant at /api/chat.
// No dependencies. Needs Node 18+ (built-in fetch).
//
// Variables (Railway > service > Variables):
//   ANTHROPIC_API_KEY  required for the assistant
//   ANTHROPIC_MODEL    optional, default claude-haiku-5-5
//   ASSISTANT_DISABLED optional, "1" switches the assistant off
//   ALLOWED_ORIGINS    optional, extra sites allowed to call /api/chat, comma separated,
//                      e.g. https://your-app.up.railway.app
const http = require("http");
const fs = require("fs");
const path = require("path");
const chat = require("./api/chat.js");

const ROOT = path.join(__dirname, "public");
const TYPES = {
  ".html": "text/html; charset=utf-8", ".svg": "image/svg+xml", ".png": "image/png",
  ".ico": "image/x-icon", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".json": "application/json", ".txt": "text/plain; charset=utf-8", ".xml": "application/xml; charset=utf-8",
};
const SECURITY = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-Frame-Options": "DENY",
};

function readJson(req, limit) {
  return new Promise((resolve) => {
    let size = 0, over = false;
    const chunks = [];
    req.on("data", (c) => {
      size += c.length;
      if (size > limit * 50) return void req.destroy();
      if (size > limit) { over = true; return; }
      chunks.push(c);
    });
    req.on("end", () => {
      if (over) return resolve({ tooLarge: true });
      try { resolve({ body: JSON.parse(Buffer.concat(chunks).toString("utf8")) }); } catch (e) { resolve({ body: {} }); }
    });
    req.on("error", () => resolve({ body: {} }));
  });
}

async function handleChat(req, res) {
  // small adapter so the Vercel-style handler runs unchanged
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (obj) => {
    if (!res.headersSent) res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify(obj));
    return res;
  };
  if (req.method === "POST") {
    const r = await readJson(req, 20 * 1024);
    if (r.tooLarge) return res.status(413).json({ error: "That message is too long. Please shorten it and try again." });
    req.body = r.body;
  }
  try { await chat(req, res); }
  catch (e) {
    console.error("chat failed:", e && e.message);
    if (!res.headersSent) res.status(500).json({ error: "Sorry, something went wrong. Please try again." });
    else res.end();
  }
}

http.createServer((req, res) => {
  for (const k in SECURITY) res.setHeader(k, SECURITY[k]);
  const url = new URL(req.url || "/", "http://x");
  const host = (req.headers.host || "").toLowerCase();

  if (host === "www.tobehired.co.uk") {
    res.writeHead(301, { Location: "https://tobehired.co.uk" + url.pathname + url.search });
    return res.end();
  }
  if (url.pathname === "/api/chat") return void handleChat(req, res);
  if (url.pathname === "/health") { res.writeHead(200); return res.end("ok"); }

  let p;
  try { p = decodeURIComponent(url.pathname); } catch (e) { res.writeHead(400); return res.end("Bad request"); }
  let file = path.normalize(path.join(ROOT, p));
  if (file !== ROOT && !file.startsWith(ROOT + path.sep)) { res.writeHead(403); return res.end("Forbidden"); }

  fs.stat(file, (err, st) => {
    if (!err && st.isDirectory()) {
      if (!p.endsWith("/")) { res.writeHead(301, { Location: url.pathname + "/" + url.search }); return res.end(); }
      file = path.join(file, "index.html");
    }
    fs.readFile(file, (e2, data) => {
      if (e2) {
        return fs.readFile(path.join(ROOT, "404.html"), (e3, nf) => {
          res.writeHead(404, { "Content-Type": TYPES[".html"] });
          res.end(e3 ? "Page not found" : nf);
        });
      }
      const ext = path.extname(file).toLowerCase();
      res.writeHead(200, {
        "Content-Type": TYPES[ext] || "application/octet-stream",
        "Cache-Control": ext === ".html" || ext === ".xml" ? "no-cache" : "public, max-age=86400",
      });
      res.end(data);
    });
  });
}).listen(process.env.PORT || 3000, "0.0.0.0", () => console.log("TobeHired listening"));
