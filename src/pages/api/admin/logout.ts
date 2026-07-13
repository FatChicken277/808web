import type { APIRoute } from "astro";
import { ADMIN_COOKIE } from "../../../lib/adminAuth";

export const POST: APIRoute = async ({ cookies }) => {
  cookies.delete(ADMIN_COOKIE, { path: "/" });
  return new Response(JSON.stringify({ success: true }), { status: 200 });
};
