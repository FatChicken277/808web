import type { APIRoute } from "astro";
import { getDb } from "../../db";
import { tickets } from "../../db/schema";
import { eq, or } from "drizzle-orm";
import { Resend } from "resend";
import qrcode from "qrcode-generator";
// @ts-ignore
import { env } from "cloudflare:workers";

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const db = getDb((env as any) || process.env);
    const body = await request.json();
    const { fullName, cedula, phone, email } = body;

    if (!fullName || !cedula || !phone || !email) {
      return new Response(
        JSON.stringify({ error: "Faltan campos requeridos" }),
        { status: 400 },
      );
    }

    // Check for duplicates
    const existing = await db
      .select()
      .from(tickets)
      .where(or(eq(tickets.email, email), eq(tickets.cedula, cedula)))
      .limit(1);

    if (existing.length > 0) {
      return new Response(
        JSON.stringify({ error: "Ya existe un ticket con ese email o cédula" }),
        { status: 400 },
      );
    }

    // Generate token
    const token = crypto.randomUUID();

    // Insert to DB
    await db.insert(tickets).values({
      full_name: fullName,
      cedula,
      phone,
      email,
      qr_token: token,
    });

    // Generate QR
    const qrUrl = `https://el808fest.com/ticket/${token}`;
    const qr = qrcode(0, "M");
    qr.addData(qrUrl);
    qr.make();
    
    // Generate base64 GIF data for CID
    const qrDataUrl = qr.createDataURL(6, 2);
    const qrBase64 = qrDataUrl.split(",")[1];
    
    // SVG for frontend only
    let qrSvg = qr.createSvgTag(4, 2);
    const match = qrSvg.match(/width="(\d+)(px)?" height="(\d+)(px)?"/);
    if (match) {
      qrSvg = qrSvg.replace(
        match[0],
        `width="100%" height="100%" viewBox="0 0 ${match[1]} ${match[3]}"`,
      );
    }

    // Send Email
    if ((env as any).RESEND_API_KEY) {
      try {
        const resend = new Resend((env as any).RESEND_API_KEY);
        const { data, error } = await resend.emails.send({
          from: "808 Fest <tickets@el808fest.com>", // MUST BE A VERIFIED DOMAIN IN RESEND!
          to: email,
          subject: "Tu ticket para 808 Fest",
          html: `
            <div style="font-family: monospace; background-color: #000; color: #fff; padding: 40px; text-align: center;">
              <h1 style="color: #39FF14; text-transform: uppercase;">808 FEST</h1>
              <h2>HOLA ${fullName.toUpperCase()}, AQUÍ ESTÁ TU TICKET</h2>
              <p>Muestra este código QR en la entrada del evento.</p>
              <div style="background: white; padding: 20px; display: inline-block; margin-top: 20px; border-radius: 10px;">
                <img src="cid:ticketqr" alt="Ticket QR" style="display: block; width: 200px; height: 200px;" />
              </div>
              <p style="margin-top: 40px; opacity: 0.7; font-size: 12px;">Token: ${token}</p>
              <p style="margin-top: 20px;">
                Si no ves el QR:
                <a href="${qrUrl}" style="color: #39FF14;">abre tu ticket aquí</a>
              </p>
            </div>
          `,
          attachments: [
            {
              filename: "ticket.gif",
              content: qrBase64,
              contentType: "image/gif",
              // @ts-ignore - The types in some resend versions might lack cid, but API supports it
              cid: "ticketqr",
            },
          ],
        });

        if (error) {
          console.error("Resend API Error:", error);
        } else {
          console.log("Resend success:", data);
        }
      } catch (emailErr) {
        console.error("Error connecting to Resend:", emailErr);
      }
    } else {
      console.warn(
        "RESEND_API_KEY no está configurada. El correo no se enviará.",
      );
    }

    return new Response(JSON.stringify({ success: true, token, qrSvg }), {
      status: 200,
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
};
