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

    const censorString = (str: string, visibleChars = 3) => {
      if (!str) return "";
      if (str.length <= visibleChars) return str.substring(0, 1) + '*'.repeat(str.length - 1);
      return str.substring(0, visibleChars) + '*'.repeat(str.length - visibleChars);
    };

    const censorEmail = (email: string) => {
      if (!email) return "";
      const [local, domain] = email.split('@');
      if (!domain) return censorString(email, 3);
      return censorString(local, 3) + '@' + domain;
    };

    const censoredTickets = allTickets.map(t => ({
      id: t.id,
      full_name: t.full_name.split(' ').map(word => censorString(word, 3)).join(' '),
      cedula: censorString(t.cedula, 3),
      id_type: t.id_type || "C.C.",
      ref_code: t.ref_code || null,
      email: censorEmail(t.email),
      attended: t.attended,
      created_at: t.created_at
    }));

    return new Response(JSON.stringify({ 
      stats: { total: allTickets.length, attended: attendedCount },
      tickets: censoredTickets
    }), { status: 200 });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
