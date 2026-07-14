import { defineMiddleware } from "astro:middleware";
import { ADMIN_COOKIE, isValidSessionToken } from "./lib/adminAuth";
// @ts-ignore
import { env } from "cloudflare:workers";

// Rutas que quedan protegidas por la clave de admin.
function isProtected(pathname: string): boolean {
  // Páginas del panel (excepto el propio login).
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    return pathname !== "/admin/login";
  }
  // APIs de administración (excepto login/logout, que deben poder ejecutarse).
  if (pathname.startsWith("/api/admin/")) {
    return pathname !== "/api/admin/login" && pathname !== "/api/admin/logout";
  }
  // Scanner de check-in: la auth se maneja dentro de /scan para no sacar
  // al usuario de la PWA (login embebido → vuelve al scanner).
  return false;
}

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;

  if (!isProtected(pathname)) {
    return next();
  }

  const runtimeEnv = (env as any) || (process.env as any) || {};
  const configuredPassword: string = runtimeEnv.ADMIN_PASSWORD || "";
  const isApi = pathname.startsWith("/api/");

  // Si no hay clave configurada, no bloqueamos en dev (para no dejar al
  // desarrollador afuera antes de crear .dev.vars); en producción devolvemos
  // un error controlado en vez de exponer el panel silenciosamente.
  if (!configuredPassword) {
    if (import.meta.env.DEV) {
      console.warn(
        "[admin] ADMIN_PASSWORD no configurada: acceso permitido solo en desarrollo.",
      );
      return next();
    }
    const message = "El panel de administración no está configurado.";
    return isApi
      ? new Response(JSON.stringify({ error: message }), { status: 503 })
      : new Response(message, { status: 503 });
  }

  const cookieValue = context.cookies.get(ADMIN_COOKIE)?.value;
  const authed = await isValidSessionToken(cookieValue, configuredPassword);

  if (!authed) {
    if (isApi) {
      return new Response(JSON.stringify({ error: "No autorizado" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
    return context.redirect(
      `/admin/login?next=${encodeURIComponent(pathname + context.url.search)}`,
    );
  }

  return next();
});
