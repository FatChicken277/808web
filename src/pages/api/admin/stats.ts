import type { APIRoute } from 'astro';
import { getDb } from '../../../db';
import { tickets } from '../../../db/schema';
import { desc } from 'drizzle-orm';
// @ts-ignore
import { env } from 'cloudflare:workers';

export const GET: APIRoute = async ({ locals }) => {
  try {
    const db = getDb((env as any) || process.env);

    const allTickets = await db.select().from(tickets).orderBy(desc(tickets.created_at));
    const attendedCount = allTickets.filter(t => t.attended).length;

    return new Response(JSON.stringify({ 
      stats: { total: allTickets.length, attended: attendedCount },
      tickets: allTickets
    }), { status: 200 });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
