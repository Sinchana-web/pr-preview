const express = require("express");
const os = require("os");
const path = require("path");
const zlib = require("zlib");

const app = express();

const port = process.env.PORT || 3000;

const prNumber = process.env.PR_NUMBER || "LOCAL";
const version = process.env.APP_VERSION || "DEV";
const namespace = process.env.NAMESPACE || "default";
const environment = process.env.ENVIRONMENT || (prNumber === "LOCAL" ? "local" : "preview");
const service = process.env.SERVICE_NAME || "pr-preview-service";
const startedAt = new Date().toISOString();

// --- gzip for compressible text responses (no external deps) ---
// Works for both res.send() and files streamed by express.static().
const COMPRESSIBLE = /^(text\/|application\/json|application\/javascript|image\/svg\+xml)/;
const MIN_BYTES = 1024;

app.use((req, res, next) => {
    if (!/\bgzip\b/.test(String(req.headers["accept-encoding"] || ""))) return next();

    const chunks = [];
    const origWrite = res.write.bind(res);
    const origEnd = res.end.bind(res);

    const restore = () => {
        res.write = origWrite;
        res.end = origEnd;
    };

    res.write = (chunk) => {
        if (chunk) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        return true;
    };

    res.end = (chunk, encoding, cb) => {
        if (typeof encoding === "function") cb = encoding;
        if (chunk && typeof chunk !== "function") {
            chunks.push(
                Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, typeof encoding === "string" ? encoding : undefined)
            );
        }
        restore();

        const body = Buffer.concat(chunks);
        const type = String(res.getHeader("content-type") || "");
        const status = res.statusCode;
        const skip =
            body.length < MIN_BYTES ||
            !COMPRESSIBLE.test(type) ||
            Boolean(res.getHeader("content-encoding")) ||
            status === 204 ||
            status === 304;

        if (skip) {
            if (body.length > 0) origEnd(body, cb);
            else origEnd(cb);
            return;
        }

        const compressed = zlib.gzipSync(body, { level: zlib.constants.Z_BEST_COMPRESSION });
        res.setHeader("Content-Encoding", "gzip");
        res.setHeader("Content-Length", compressed.length);
        const vary = res.getHeader("Vary");
        res.setHeader("Vary", vary ? `${vary}, Accept-Encoding` : "Accept-Encoding");
        origEnd(compressed, cb);
    };

    next();
});

// --- security / caching headers ---
app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "no-referrer");
    next();
});

// --- static dashboard with long-lived caching for fingerprint-safe assets ---
app.use(
    express.static(path.join(__dirname, "public"), {
        index: "index.html",
        etag: true,
        lastModified: true,
        maxAge: 0,
        setHeaders: (res, filePath) => {
            if (filePath.endsWith(".html")) {
                res.setHeader("Cache-Control", "no-cache");
            } else if (/\.(css|js|svg|png|jpg|woff2?)$/.test(filePath)) {
                res.setHeader("Cache-Control", "public, max-age=3600");
            }
        },
    })
);

// --- JSON API powering the dashboard ---
app.get("/api/status", (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    res.json({
        status: "healthy",
        prNumber,
        version,
        environment,
        namespace,
        service,
        hostname: os.hostname(),
        runtime: `Node ${process.version}`,
        startedAt,
        uptimeSeconds: Math.round(process.uptime()),
        serverTime: new Date().toISOString(),
    });
});

app.get("/health", (req, res) => {
    res.type("text").send("OK");
});

// 404 for unknown routes (JSON-ish for API paths)
app.use((req, res) => {
    if (req.path.startsWith("/api/")) {
        res.status(404).json({ error: "not_found" });
        return;
    }
    res.status(404).type("text").send("Not Found");
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
