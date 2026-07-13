import type { APIRoute } from "astro";
import { getDb } from "../../../db";
import { artists, tickets } from "../../../db/schema";
import { count, eq } from "drizzle-orm";
// @ts-ignore
import { env } from "cloudflare:workers";

const normalizeCode = (raw: string) =>
  (raw || "").trim().toUpperCase().replace(/\s+/g, "");

// GET: lista de artistas con recuento de registros + total de registros directos.
export const GET: APIRoute = async () => {
  try {
    const db = getDb((env as any) || process.env);

    const allArtists = await db
      .select()
      .from(artists)
      .orderBy(artists.name);

    // Recuento de tickets agrupado por código de referido.
    const grouped = await db
      .select({ code: tickets.ref_code, total: count() })
      .from(tickets)
      .groupBy(tickets.ref_code);

    const countByCode = new Map<string, number>();
    let directCount = 0;
    for (const row of grouped) {
      if (row.code == null || row.code === "") {
        directCount += Number(row.total);
      } else {
        countByCode.set(row.code, Number(row.total));
      }
    }

    // Códigos con registros que ya no corresponden a ningún artista (borrado).
    const knownCodes = new Set(allArtists.map((a) => a.code));
    let orphanCount = 0;
    for (const [code, total] of countByCode) {
      if (!knownCodes.has(code)) orphanCount += total;
    }

    const result = allArtists.map((a) => ({
      id: a.id,
      name: a.name,
      code: a.code,
      count: countByCode.get(a.code) || 0,
    }));

    return new Response(
      JSON.stringify({ artists: result, directCount, orphanCount }),
      { status: 200 },
    );
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
};

// POST: crear un artista con su código único.
export const POST: APIRoute = async ({ request }) => {
  try {
    const db = getDb((env as any) || process.env);
    const body = await request.json().catch(() => ({}));

    const name = (body?.name || "").trim();
    const code = normalizeCode(body?.code || "");

    if (!name || !code) {
      return new Response(
        JSON.stringify({ error: "Nombre y código son requeridos." }),
        { status: 400 },
      );
    }

    const existing = await db
      .select()
      .from(artists)
      .where(eq(artists.code, code))
      .limit(1);

    if (existing.length > 0) {
      return new Response(
        JSON.stringify({ error: "Ya existe un artista con ese código." }),
        { status: 400 },
      );
    }

    await db.insert(artists).values({ name, code });

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
};

// DELETE: eliminar un artista por id (los tickets conservan su ref_code).
export const DELETE: APIRoute = async ({ request, url }) => {
  try {
    const db = getDb((env as any) || process.env);

    let id = Number(url.searchParams.get("id"));
    if (!id) {
      const body = await request.json().catch(() => ({}));
      id = Number(body?.id);
    }

    if (!id) {
      return new Response(JSON.stringify({ error: "Falta el id." }), {
        status: 400,
      });
    }

    await db.delete(artists).where(eq(artists.id, id));

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
};
