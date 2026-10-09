import { Readable } from "node:stream";
import routerModule from "../api_src/router.js";

const { route } = routerModule;
const MAX_BODY = 2_000_000;
const SECURITY_HEADERS = {
  "x-content-type-options": "nosniff",
  "referrer-policy": "strict-origin-when-cross-origin",
  "permissions-policy": "camera=(), microphone=(), geolocation=(self)",
  "x-frame-options": "SAMEORIGIN",
  "cross-origin-opener-policy": "same-origin",
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...SECURITY_HEADERS, "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

// The existing browser application consumes this public Supabase anon config.
// NEVER expose SUPABASE_SERVICE_ROLE_KEY or any other Worker secret here.
function publicConfig(env) {
  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
    return new Response("/* Supabase public settings have not been configured. */", {
      status: 503,
      headers: { "content-type": "application/javascript; charset=utf-8", "cache-control": "no-store" },
    });
  }
  const config = {
    APP_NAME: "FriendZones Group · Màn hình nhân viên",
    APP_ENV: "production",
    SUPABASE_URL: env.SUPABASE_URL,
    SUPABASE_ANON_KEY: env.SUPABASE_ANON_KEY,
    DEFAULT_UNIT: "GROUP_ALL",
    GROUP_NAME: "FriendZones Group",
    PRIVACY_HIDE_PHONE_IN_GROUP: true,
    API_BASE: "/api",
  };
  return new Response("window.FNB_CONFIG = " + JSON.stringify(config) + ";\n", {
    status: 200,
    headers: { "content-type": "application/javascript; charset=utf-8", "cache-control": "no-store", "x-content-type-options": "nosniff" },
  });
}

// Adapt legacy Vercel (req,res) handlers to the Workers Request/Response API.
// Keep the same router and Supabase role checks; no rewrite of business rules.
async function apiResponse(request) {
  const len = Number(request.headers.get("content-length") || 0);
  if (len > MAX_BODY) return json({ ok: false, error: "Payload too large" }, 413);
  const data = ["GET", "HEAD"].includes(request.method)
    ? new Uint8Array()
    : new Uint8Array(await request.arrayBuffer());
  if (data.byteLength > MAX_BODY) return json({ ok: false, error: "Payload too large" }, 413);

  const legacyReq = Readable.from(data.length ? [data] : []);
  legacyReq.method = request.method;
  const url = new URL(request.url);
  legacyReq.url = url.pathname + url.search;
  legacyReq.headers = Object.fromEntries(request.headers);

  return new Promise((resolve, reject) => {
    const headers = new Headers({ "cache-control": "no-store", ...SECURITY_HEADERS });
    let ended = false;
    const legacyRes = {
      statusCode: 200,
      setHeader(name, value) { headers.set(name, String(value)); },
      getHeader(name) { return headers.get(name); },
      end(body) {
        if (ended) return;
        ended = true;
        const code = this.statusCode;
        resolve(new Response([204, 205, 304].includes(code) || request.method === "HEAD" ? null : body ?? null, {
          status: code, headers,
        }));
      },
    };
    Promise.resolve(route(legacyReq, legacyRes)).then(() => {
      if (!ended) reject(new Error("Legacy handler did not finish its response"));
    }).catch(reject);
  });
}

function pathIsSafeAsset(pathname) {
  if (["/", "/index.html", "/privacy", "/privacy.html",
    "/data-deletion", "/data-deletion.html", "/robots.txt",
    "/sitemap.xml", "/site.webmanifest", "/404.html",
    "/app.js", "/styles.css", "/logo.png"].includes(pathname)) return true;
  return ["/assets/", "/du-an/", "/login/", "/nhan-vien/"].some(prefix => pathname.startsWith(prefix));
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const pathname = url.pathname;
    if (pathname === "/app") return Response.redirect(new URL("/nhan-vien/", url), 307);
    if (pathname === "/admin") return Response.redirect(new URL("/login/", url), 307);
    if (pathname === "/config.js" || pathname === "/nhan-vien/config.js") return publicConfig(env);
    if (pathname === "/api" || pathname.startsWith("/api/")) {
      if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
        // Protect even public webhook routes from silently running with half-configured backend.
        return json({ ok: false, error: "Backend not configured" }, 503);
      }
      try {
        return await apiResponse(request);
      } catch (error) {
        console.error("API adapter error", error);
        return json({ ok: false, error: "API request failed" }, 500);
      }
    }

    if (!["GET", "HEAD"].includes(request.method)) return json({ ok: false, error: "Method not allowed" }, 405);
    if (!pathIsSafeAsset(pathname)) return new Response("Not Found", { status: 404, headers: SECURITY_HEADERS });
    return env.ASSETS.fetch(request);
  },
  // Only enable the cron trigger at cutover, after disabling Vercel's cron.
  async scheduled(controller, env, ctx) {
    if (!env.CRON_SECRET || !env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error("Cloudflare cron skipped: missing CRON_SECRET or SUPABASE_SERVICE_ROLE_KEY");
      return;
    }
    const request = new Request("https://friendzonegroup.net/api/attendance-daily-report", {
      method: "GET",
      headers: { authorization: "Bearer " + env.CRON_SECRET },
    });
    ctx.waitUntil(apiResponse(request).then(async response => {
      if (!response.ok) console.error("Cloudflare attendance report failed", response.status, await response.text());
    }));
  },
};
