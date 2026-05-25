import type { APIRoute } from 'astro';
import { getDb } from '../../../db';
import { tickets } from '../../../db/schema';
import { eq } from 'drizzle-orm';
// @ts-ignore
import { env } from 'cloudflare:workers';

export const POST: APIRoute = async ({ params, locals }) => {
  try {
    const token = params.token;
    if (!token) return new Response(JSON.stringify({ error: 'Missing token' }), { status: 400 });

    const db = getDb((env as any) || process.env);

    const ticketRecord = await db.select().from(tickets).where(eq(tickets.qr_token, token)).limit(1);

    if (ticketRecord.length === 0) {
      return new Response(JSON.stringify({ success: false, status: 'INVALID' }), { status: 200 });
    }

    const ticket = ticketRecord[0];

    if (ticket.attended) {
      return new Response(JSON.stringify({ success: false, status: 'ALREADY_USED', ticket }), { status: 200 });
    }

    await db.update(tickets).set({ attended: true }).where(eq(tickets.qr_token, token));

    return new Response(JSON.stringify({ success: true, status: 'VALID', ticket }), { status: 200 });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
