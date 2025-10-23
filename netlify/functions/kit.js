// netlify/functions/kit.js
exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  // Parse body (supports form-encoded or JSON)
  const contentType = (event.headers["content-type"] || "").toLowerCase();
  const isJSON = contentType.includes("application/json");
  const body = isJSON
    ? JSON.parse(event.body || "{}")
    : Object.fromEntries(new URLSearchParams(event.body || ""));

  // Honeypot spam trap
  if (body.hp_field) {
    return { statusCode: 204, body: "" }; // ignore silently
  }

  const ZAP_URL = process.env.ZAPIER_KIT_WEBHOOK_URL;
  if (!ZAP_URL) {
    return { statusCode: 500, body: "Missing webhook env var" };
  }

  // Forward payload to Zapier
  const res = await fetch(ZAP_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    return { statusCode: 502, body: "Upstream error: " + text };
  }

  // CORS: allow your site origin (adjust for local dev)
  const origin = event.headers.origin || "";
  const allowOrigin =
    origin === "https://www.cashforgoldzoom.com" || origin === "http://localhost:8888"
      ? origin
      : "https://www.cashforgoldzoom.com";

  return {
    statusCode: 200,
    headers: {
      "Access-Control-Allow-Origin": allowOrigin,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Cache-Control": "no-store",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ok: true }),
  };
};
