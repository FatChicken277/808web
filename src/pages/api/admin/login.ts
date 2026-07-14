import type { APIRoute } from "astro";
import {
  ADMIN_COOKIE,
  ADMIN_SESSION_MAX_AGE,
  computeSessionToken,
  verifyPassword,
} from "../../../lib/adminAuth";
// @ts-ignore
import { env } from "cloudflare:workers";

export const POST: APIRoute = async ({ request, cookies, url }) => {
  try {
    const configuredPassword: string = (env as any)?.ADMIN_PASSWORD || "";
    if (!configuredPassword) {
      return new Response(
        JSON.stringify({ error: "El panel no está configurado." }),
        { status: 503 },
      );
    }

    const body = await request.json().catch(() => ({}));
    const password: string = body?.password || "";

    const ok = await verifyPassword(password, configuredPassword);
    if (!ok) {
      return new Response(
        JSON.stringify({ error: "Clave incorrecta." }),
        { status: 401 },
      );
    }

    const token = await computeSessionToken(configuredPassword);
    cookies.set(ADMIN_COOKIE, token, {
      httpOnly: true,
      secure: url.protocol === "https:",
      sameSite: "strict",
      path: "/",
      maxAge: ADMIN_SESSION_MAX_AGE,
    });

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
};
