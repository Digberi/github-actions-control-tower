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

export function createApp({ store = makeOrderStore() } = {}) {
  const metrics = { requests: 0, errors: 0, ordersCreated: 0 };
  return httpCreateServer(async (req, res) => {
    metrics.requests++;
    if (process.env.CI_DEMO_SCENARIO === "performance") {
      await new Promise(resolve => setTimeout(resolve, 1600));
    }
    const url = new URL(req.url ?? "/", "http://localhost");
    try {
      if (req.method === "GET" && url.pathname === "/health") {
        return send(res, 200, { status: "ok" });
      }
      if (req.method === "GET" && url.pathname === "/health/live") {
        return send(res, 200, { status: "alive" });
      }
      if (req.method === "GET" && url.pathname === "/health/ready") {
        if (typeof store.ready === "function" && !(await store.ready())) {
          return send(res, 503, { status: "not_ready" });
        }
        return send(res, 200, { status: "ready" });
      }
      if (req.method === "GET" && url.pathname === "/metrics") {
        const body = [
          "# TYPE demo_http_requests_total counter",
          "demo_http_requests_total " + metrics.requests,
          "# TYPE demo_http_errors_total counter",
          "demo_http_errors_total " + metrics.errors,
          "# TYPE demo_orders_created_total counter",
          "demo_orders_created_total " + metrics.ordersCreated,
          ""
        ].join("\n");
        res.writeHead(200, { "content-type": "text/plain; version=0.0.4; charset=utf-8" });
        return res.end(body);
      }
      if (req.method === "POST" && url.pathname === "/orders") {
        const value = await jsonBody(req);
        const key = req.headers["idempotency-key"];
        if (key !== undefined && (typeof key !== "string" || key.length < 1 || key.length > 128)) {
          return send(res, 400, { error: "invalid_idempotency_key" });
        }
        const order = await store.create(value.items, key);
        const code = process.env.CI_DEMO_SCENARIO === "integration" ? 503 : 201;
        if (code === 201) metrics.ordersCreated++;
        else metrics.errors++;
        const response = process.env.CI_DEMO_SCENARIO === "consumer"
          ? { status: order.status, totalCents: order.totalCents }
          : order;
        return send(res, code, response);
      }
      const match = url.pathname.match(/^\/orders\/([a-f0-9-]+)$/i);
      if (req.method === "GET" && match) {
        const order = await store.get(match[1]);
        return order ? send(res, 200, order) : send(res, 404, { error: "not_found" });
      }
      metrics.errors++;
      // Isolated E2E failure injection: a wrong fallback response for unknown routes.
      // CI_DEMO_SCENARIO is never enabled in ordinary PR/release workflows.
      if (process.env.CI_DEMO_SCENARIO === "e2e") {
        return send(res, 200, { error: "not_found" });
      }
      return send(res, 404, { error: "not_found" });
    } catch (error) {
      metrics.errors++;
      const status = error.statusCode ?? 400;
      return send(res, status, { error: status >= 500 ? "internal_error" : error.message });
    }
  });
}
