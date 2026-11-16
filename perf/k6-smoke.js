import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  vus: 3,
  duration: __ENV.DURATION || "12s",
  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<800"],
    checks: ["rate>0.99"]
  }
};

const origin = __ENV.TARGET_URL || "http://127.0.0.1:3000";
export default function () {
  const response = http.get(origin + "/health/ready");
  check(response, {
    "HTTP 200 from readiness": r => r.status === 200,
    "JSON includes ready": r => r.json("status") === "ready"
  });
  sleep(0.1);
}
