// ═══════════════════════════════════════════════════════════
//  Cloudflare Worker — جایگزین Netlify Functions
//  این فایل هر سه endpoint را پوشش می‌دهد:
//    POST /api/login/system/
//    POST /api/login/admin/
//    GET  /api/config/cloudinary/
// ═══════════════════════════════════════════════════════════

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // ── CORS headers ──
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Content-Type": "application/json",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // ── Route: POST /api/login/system/ ──
    if (path === "/api/login/system/" && request.method === "POST") {
      const body = await request.json();
      const { username, password } = body;

      if (
        username === env.SYSTEM_USERNAME &&
        password === env.SYSTEM_PASSWORD
      ) {
        return Response.json({ ok: true }, { headers: corsHeaders });
      }
      return Response.json(
        { ok: false, error: "نام کاربری یا رمز اشتباه است" },
        { status: 401, headers: corsHeaders }
      );
    }

    // ── Route: POST /api/login/admin/ ──
    if (path === "/api/login/admin/" && request.method === "POST") {
      const body = await request.json();
      const { username, password } = body;

      if (
        username === env.ADMIN_USERNAME &&
        password === env.ADMIN_PASSWORD
      ) {
        return Response.json({ ok: true }, { headers: corsHeaders });
      }
      return Response.json(
        { ok: false, error: "نام کاربری یا رمز اشتباه است" },
        { status: 401, headers: corsHeaders }
      );
    }

    // ── Route: GET /api/config/cloudinary/ ──
    if (path === "/api/config/cloudinary/" && request.method === "GET") {
      return Response.json(
        {
          cloudName: env.CLOUDINARY_CLOUD_NAME,
          preset:    env.CLOUDINARY_UPLOAD_PRESET,
          apiKey:    env.CLOUDINARY_API_KEY,
          apiSecret: env.CLOUDINARY_API_SECRET,
        },
        { headers: corsHeaders }
      );
    }

    // ── 404 ──
    return Response.json(
      { error: "Not found" },
      { status: 404, headers: corsHeaders }
    );
  },
};
