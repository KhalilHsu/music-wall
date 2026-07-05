import { execFile } from "node:child_process";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { basename, extname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { promisify } from "node:util";
import { createServer } from "node:http";

// Local companion server for Music.app artwork sync. It is designed for localhost
// use by default; only set HOST=0.0.0.0 on trusted private networks.
const execFileAsync = promisify(execFile);
const rootDir = resolve(".");
const dataDir = join(rootDir, "local-data", "music");
const manifestPath = join(dataDir, "albums.json");
const port = Number(process.env.PORT || 4173);
const host = process.env.HOST || "127.0.0.1";
const defaultSyncLimit = Number(process.env.LOCAL_MUSIC_LIMIT || 2000);
const exposeErrorDetails = process.env.NODE_ENV === "development";

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml",
};

function jsonResponse(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
  });
  response.end(JSON.stringify(payload));
}

async function readManifest() {
  try {
    return JSON.parse(await readFile(manifestPath, "utf8"));
  } catch {
    return [];
  }
}

async function exportLocalMusic(limit) {
  const { stdout } = await execFileAsync("swift", ["scripts/export-local-music-library.swift", "--output", dataDir, "--limit", String(limit)], {
    cwd: rootDir,
    maxBuffer: 1024 * 1024 * 16,
    timeout: 30000,
  });

  return JSON.parse(stdout);
}

async function syncLocalMusic(limit) {
  await mkdir(dataDir, { recursive: true });
  const parsedLimit = Number(limit);
  const syncLimit = limit == null || limit === "" || !Number.isFinite(parsedLimit) ? defaultSyncLimit : Math.min(Math.max(parsedLimit, 8), 5000);
  const syncedAlbums = await exportLocalMusic(syncLimit);
  await writeFile(manifestPath, JSON.stringify(syncedAlbums, null, 2));
  return syncedAlbums;
}

async function serveFile(request, response) {
  const url = new URL(request.url, `http://${request.headers.host}`);
  const pathname = decodeURIComponent(url.pathname);
  const requestedPath = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
  const absolutePath = resolve(rootDir, requestedPath);
  const relativePath = relative(rootDir, absolutePath);

  if (relativePath === ".." || relativePath.startsWith(`..${sep}`) || isAbsolute(relativePath)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  try {
    const fileStat = await stat(absolutePath);
    if (!fileStat.isFile()) throw new Error("Not a file");

    const content = await readFile(absolutePath);
    const shouldAvoidCache = requestedPath.startsWith("local-data/") || [".html", ".css", ".js"].includes(extname(absolutePath));
    response.writeHead(200, {
      "content-type": mimeTypes[extname(absolutePath)] || "application/octet-stream",
      "cache-control": shouldAvoidCache ? "no-store" : "public, max-age=60",
    });
    response.end(content);
  } catch {
    response.writeHead(404);
    response.end(`Not found: ${basename(absolutePath)}`);
  }
}

const server = createServer(async (request, response) => {
  try {
    if (request.method === "GET" && request.url === "/api/local-music/albums") {
      jsonResponse(response, 200, { albums: await readManifest() });
      return;
    }

    const url = new URL(request.url, `http://${request.headers.host}`);

    if (request.method === "POST" && url.pathname === "/api/local-music/sync") {
      jsonResponse(response, 200, { albums: await syncLocalMusic(url.searchParams.get("limit")) });
      return;
    }

    if (request.method !== "GET" && request.method !== "HEAD") {
      jsonResponse(response, 405, { error: "Method not allowed" });
      return;
    }

    await serveFile(request, response);
  } catch (error) {
    console.error(error);
    const payload = { error: "Local Music sync failed" };
    if (exposeErrorDetails) {
      payload.message = error instanceof Error ? error.message : String(error);
    }
    jsonResponse(response, 500, payload);
  }
});

server.listen(port, host, () => {
  console.log(`Music Wall running at http://${host}:${port}/`);
  console.log("Click Local Music > Sync to read artwork from the macOS music library.");
});
