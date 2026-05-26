import type { APIRoute } from "astro";
import qrcode from "qrcode-generator";

export const GET: APIRoute = async ({ params }) => {
  try {
    const { token } = params;
    
    if (!token) {
      return new Response("Missing token", { status: 400 });
    }

    const qrUrl = `https://el808fest.com/ticket/${token}`;
    const qr = qrcode(0, "H");
    qr.addData(qrUrl);
    qr.make();
    
    // Generate base64 GIF
    const qrDataUrl = qr.createDataURL(6, 2);
    const qrBase64 = qrDataUrl.split(",")[1];
    
    // Decode base64 to binary
    const binaryStr = atob(qrBase64);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }

    return new Response(bytes, {
      status: 200,
      headers: {
        "Content-Type": "image/gif",
        "Cache-Control": "public, max-age=31536000, immutable"
      }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
};
