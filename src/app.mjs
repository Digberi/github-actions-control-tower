import { createServer as httpCreateServer } from "node:http";
import { makeOrderStore } from "./domain.mjs";

async function jsonBody(req) {
  let raw = "";
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > 64 * 1024) {
      const error = new Error("Payload too large");
      error.statusCode = 413;
      throw error;
    }
  }
  return JSON.parse(raw);
}

function send(res, code, value) {
  const body = JSON.stringify(value);
  res.writeHead(code, {
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(body)
  });
  res.end(body);
}

export function createApp() {
  const store = makeOrderStore();
  return httpCreateServer(async (req, res) => {
    if (process.env.CI_DEMO_SCENARIO === "performance") {
      await new Promise(resolve => setTimeout(resolve, 1600));
    }
    const url = new URL(req.url ?? "/", "http://localhost");
    try {
      if (req.method === "GET" && url.pathname === "/health") {
        return send(res, 200, { status: "ok" });
      }
      if (req.method === "POST" && url.pathname === "/orders") {
        const value = await jsonBody(req);
        const order = store.create(value.items);
        const code = process.env.CI_DEMO_SCENARIO === "integration" ? 503 : 201;
        return send(res, code, order);
      }
      const match = url.pathname.match(/^\/orders\/([a-f0-9-]+)$/i);
      if (req.method === "GET" && match) {
        const order = store.get(match[1]);
        return order ? send(res, 200, order) : send(res, 404, { error: "not_found" });
      }
      return send(res, 404, { error: "not_found" });
    } catch (error) {
      return send(res, error.statusCode ?? 400, { error: error.message });
    }
  });
}
