// Autenticación del panel admin: token de sesión stateless derivado de la
// contraseña mediante HMAC-SHA256 (Web Crypto, disponible en Cloudflare Workers).
// No requiere tabla de sesiones: el middleware recomputa el token esperado y lo
// compara en tiempo constante contra la cookie.

export const ADMIN_COOKIE = "admin_session";
// Duración de la sesión en segundos (12 horas).
export const ADMIN_SESSION_MAX_AGE = 60 * 60 * 12;

const SESSION_MESSAGE = "808-admin-v1";

const encoder = new TextEncoder();

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Token determinístico = HMAC-SHA256(key=password, msg="808-admin-v1").
export async function computeSessionToken(password: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(SESSION_MESSAGE),
  );
  return toHex(signature);
}

// Comparación en tiempo constante para evitar timing attacks.
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

// Verifica que la contraseña recibida coincida con el secret configurado.
export async function verifyPassword(
  submitted: string,
  configured: string,
): Promise<boolean> {
  if (!configured || !submitted) return false;
  // Comparamos hashes para que el tiempo no dependa del contenido de la clave.
  const [a, b] = await Promise.all([
    computeSessionToken(submitted),
    computeSessionToken(configured),
  ]);
  return timingSafeEqual(a, b);
}

// Valida el valor de la cookie de sesión contra la contraseña configurada.
export async function isValidSessionToken(
  cookieValue: string | undefined,
  configuredPassword: string,
): Promise<boolean> {
  if (!cookieValue || !configuredPassword) return false;
  const expected = await computeSessionToken(configuredPassword);
  return timingSafeEqual(cookieValue, expected);
}
