import { Resend } from "resend";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

// Cargar variables de entorno desde .env o .dev.vars
function loadEnv() {
  const envFiles = [".env", ".dev.vars"];
  for (const file of envFiles) {
    const envPath = path.resolve(process.cwd(), file);
    if (fs.existsSync(envPath)) {
      try {
        const content = fs.readFileSync(envPath, "utf-8");
        for (const line of content.split(/\r?\n/)) {
          const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
          if (match) {
            const key = match[1];
            let value = (match[2] || "").trim();
            if (
              (value.startsWith('"') && value.endsWith('"')) ||
              (value.startsWith("'") && value.endsWith("'"))
            ) {
              value = value.slice(1, -1);
            }
            if (!process.env[key]) {
              process.env[key] = value;
            }
          }
        }
      } catch (e) {
        // Ignorar errores al leer archivos env
      }
    }
  }
}

loadEnv();

const apiKey = process.env.RESEND_API_KEY;
const defaultSender = process.env.SENDER_EMAIL || "808 Fest <tickets@el808fest.com>";
const SHOP_URL = "https://thecirkus.shop/products/lks-808-fest-edition?variant=45240497963051";
const SINGLE_IMAGE_URL = "https://www.el808fest.com/images/cirkus/edicion-oficial.jpg";

// Parsear argumentos de la línea de comandos
const args = process.argv.slice(2);
const options = {
  to: null,
  name: "Familia 808",
  all: false,
  dryRun: false,
  subject: "🔥 {{name}}, última oportunidad: Tenis Oficiales 808 Fest x CIRKUS 🔥",
  shopUrl: SHOP_URL,
  delayMs: 350,
};

for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg === "--to") {
    options.to = args[++i];
  } else if (arg === "--name") {
    options.name = args[++i];
  } else if (arg === "--all" || arg === "--broadcast") {
    options.all = true;
  } else if (arg === "--dry-run") {
    options.dryRun = true;
  } else if (arg === "--subject") {
    options.subject = args[++i];
  } else if (arg === "--shop-url") {
    options.shopUrl = args[++i];
  } else if (arg === "--delay") {
    options.delayMs = parseInt(args[++i], 10) || 350;
  } else if (arg === "--help" || arg === "-h") {
    showHelp();
    process.exit(0);
  }
}

function showHelp() {
  console.log(`
======================================================================
  808 FEST x CIRKUS - LANZAMIENTO SNEAKERS EDICIÓN CONMEMORATIVA
======================================================================

USO:
  node scripts/send-cirkus-email.js [opciones]

OPCIONES:
  --to <email>            Enviar correo de prueba a un destinatario específico.
                          Ej: node scripts/send-cirkus-email.js --to alejandrorc2717@gmail.com
  --name <nombre>         Nombre del destinatario (opcional).
  --all                   Enviar masivamente a toda la base de datos D1.
  --dry-run               Simular sin realizar envíos reales.
  --subject <asunto>      Asunto personalizado del correo.
  --shop-url <url>        Enlace de compra en CIRKUS.
  --delay <ms>            Pausa entre correos en modo masivo (default: 350ms).
`);
}

// Buscar nombre en la base de datos D1 si no se proporciona
function findNameByEmail(email) {
  try {
    const query = `SELECT full_name FROM tickets WHERE LOWER(TRIM(email)) = '${email.trim().toLowerCase()}' LIMIT 1;`;
    const cmd = `npx wrangler d1 execute 808web-db --remote --json --command="${query}"`;
    const output = execSync(cmd, { encoding: "utf-8" });
    const parsed = JSON.parse(output);
    const results = parsed[0]?.results || [];
    if (results.length > 0 && results[0].full_name) {
      return results[0].full_name;
    }
  } catch (e) {
    // Ignorar si falla wrangler
  }
  return null;
}

// Versión en texto plano para respaldo
function generateCirkusPlainText({ fullName, shopUrl }) {
  const name = fullName || "Amigo/a de 808";
  const purchaseUrl = shopUrl || SHOP_URL;
  return `
Hola ${name},

Queríamos agradecerte por haber hecho parte de esta edición de 808 Fest.

Para conmemorar lo que vivimos juntos en el festival, nos unimos con el equipo de CIRKUS para crear una pieza de colección conmemorativa: los tenis oficiales 808 Fest x CIRKUS.

Esta es la última oportunidad para obtener tu par de colección oficial antes del cierre de pedidos:
${purchaseUrl}

Detalles clave:
- Colaboración Oficial 808 Fest x CIRKUS
- Edición Conmemorativa de Colección
- Envíos a todo el país

Obtén los tuyos aquí:
${purchaseUrl}

Un saludo,
Equipo 808 Fest & CIRKUS
  `.trim();
}

// Plantilla HTML premium (Diseño original oscuro con acentos neon y 1 imagen completa)
function generateCirkusHtmlTemplate({ fullName, shopUrl }) {
  const safeName = (fullName || "Familia 808")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  const purchaseUrl = shopUrl || SHOP_URL;

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DROP OFICIAL: 808 Fest x CIRKUS</title>
</head>
<body style="margin: 0; padding: 0; background-color: #030303; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #FFFFFF; -webkit-font-smoothing: antialiased;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #030303; min-height: 100vh; padding: 25px 10px;">
    <tr>
      <td align="center">
        <!-- Contenedor Principal -->
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #0a0a0a; border: 1px solid #1f1f1f; border-radius: 18px; overflow: hidden; box-shadow: 0 20px 50px rgba(0,0,0,0.95);">
          
          <!-- Encabezado Neon Colaboración -->
          <tr>
            <td style="padding: 38px 25px 26px 25px; text-align: center; background: radial-gradient(circle at center, #1b3d14 0%, #0a0a0a 85%); border-bottom: 1px solid #1a2a17;">
              <div style="display: inline-block; background-color: rgba(57, 255, 20, 0.12); border: 1px solid #39FF14; border-radius: 30px; padding: 6px 18px; margin-bottom: 14px;">
                <span style="font-size: 11px; font-weight: 800; letter-spacing: 2px; color: #39FF14; text-transform: uppercase;">
                  🔥 DROP EXCLUSIVO • ÚLTIMA OPORTUNIDAD 🔥
                </span>
              </div>
              <h1 style="margin: 0; font-size: 34px; font-weight: 900; letter-spacing: 3px; color: #FFFFFF; text-transform: uppercase;">
                808 FEST <span style="color: #39FF14;">✕</span> CIRKUS
              </h1>
              <p style="margin: 10px 0 0 0; font-size: 13px; letter-spacing: 2.5px; color: #a0a0a0; text-transform: uppercase;">
                Sneakers Oficiales del Evento
              </p>
            </td>
          </tr>

          <!-- Mensaje Introductorio -->
          <tr>
            <td style="padding: 32px 30px 20px 30px; text-align: left;">
              <p style="margin: 0 0 10px 0; font-size: 14px; color: #39FF14; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px;">
                ¡HOLA, ${safeName.toUpperCase()}!
              </p>
              <h2 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 900; color: #FFFFFF; line-height: 1.3; letter-spacing: 0.5px;">
                TENIS CONMEMORATIVOS 808 FEST x CIRKUS
              </h2>
              <p style="margin: 0 0 18px 0; font-size: 15px; line-height: 1.65; color: #CCCCCC;">
                Queríamos agradecerte por haber hecho parte de esta edición de <strong>808 Fest</strong>. Para conmemorar lo que vivimos juntos en el festival, nos unimos con el equipo de <strong style="color: #FFFFFF;">CIRKUS</strong> para crear una pieza de colección conmemorativa: los tenis oficiales del festival.
              </p>
              <p style="margin: 0 0 25px 0; font-size: 14px; line-height: 1.6; color: #999999;">
                Esta es tu <strong style="color: #39FF14;">última oportunidad</strong> para ordenar tu par de colección. Diseñados con materiales de alta calidad, silueta urbana y toda la identidad del festival.
              </p>
            </td>
          </tr>

          <!-- ============================================== -->
          <!-- IMAGEN ÚNICA INTEGRADA EN ALTA RESOLUCIÓN       -->
          <!-- ============================================== -->
          <tr>
            <td align="center" style="padding: 0 25px 22px 25px;">
              <a href="${purchaseUrl}" target="_blank" style="display: block; text-decoration: none;">
                <img 
                  src="${SINGLE_IMAGE_URL}" 
                  alt="Tenis Oficiales 808 Fest x CIRKUS" 
                  width="550" 
                  style="width: 100%; max-width: 550px; height: auto; border-radius: 14px; display: block; border: 1px solid #232d20; box-shadow: 0 10px 30px rgba(0,0,0,0.7);" 
                />
              </a>
            </td>
          </tr>

          <!-- SECCIÓN DE COMPRA / BOTÓN CTA Y BENEFICIOS -->
          <tr>
            <td style="padding: 10px 30px 35px 30px; text-align: center;">
              
              <!-- Tarjeta de Beneficios -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #121512; border: 1px solid #253322; border-radius: 12px; margin: 10px 0 28px 0; padding: 18px 20px; text-align: left;">
                <tr>
                  <td>
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td style="padding-bottom: 10px;">
                          <span style="font-size: 16px;">🔥</span>
                          <strong style="color: #FFFFFF; font-size: 14px; margin-left: 8px;">Colaboración Oficial 808 Fest x CIRKUS</strong>
                          <p style="margin: 3px 0 0 28px; font-size: 12px; color: #888888;">Edición conmemorativa de colección del festival.</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-bottom: 10px;">
                          <span style="font-size: 16px;">⏳</span>
                          <strong style="color: #FFFFFF; font-size: 14px; margin-left: 8px;">Última Oportunidad</strong>
                          <p style="margin: 3px 0 0 28px; font-size: 12px; color: #888888;">Ordena tu par antes del cierre definitivo de pedidos.</p>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <span style="font-size: 16px;">📦</span>
                          <strong style="color: #FFFFFF; font-size: 14px; margin-left: 8px;">Envíos a todo Colombia</strong>
                          <p style="margin: 3px 0 0 28px; font-size: 12px; color: #888888;">Compra segura directamente en la tienda oficial.</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- BOTÓN CTA PRINCIPAL NEON -->
              <div style="margin: 25px 0 15px 0;">
                <a href="${purchaseUrl}" target="_blank" style="background-color: #39FF14; color: #000000; font-size: 16px; font-weight: 900; text-decoration: none; padding: 18px 38px; border-radius: 50px; display: inline-block; letter-spacing: 1.5px; text-transform: uppercase; box-shadow: 0 4px 25px rgba(57, 255, 20, 0.45);">
                  🔥 OBTENER TENIS EN CIRKUS →
                </a>
              </div>
              <p style="margin: 10px 0 0 0; font-size: 12px; color: #777777;">
                Haz clic para elegir tu talla y hacer tu pedido en CIRKUS
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 25px; text-align: center; background-color: #060606; border-top: 1px solid #161616;">
              <p style="margin: 0 0 6px 0; font-size: 12px; color: #777777; font-weight: 600;">
                © 2026 808 Fest ✕ CIRKUS • Medellín, Colombia
              </p>
              <p style="margin: 0; font-size: 11px; color: #444444;">
                Has recibido este correo como parte de la comunidad de 808 Fest.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

// Consultar base de datos D1 en modo masivo
function getRecipientsFromD1() {
  console.log("🔍 Consultando base de datos remota D1 (808web-db)...");
  const query = `
    SELECT 
      MIN(full_name) AS full_name, 
      LOWER(TRIM(email)) AS email
    FROM tickets 
    WHERE email IS NOT NULL AND TRIM(email) != '' 
    GROUP BY LOWER(TRIM(email))
    ORDER BY id ASC;
  `.replace(/\s+/g, " ").trim();

  const cmd = `npx wrangler d1 execute 808web-db --remote --json --command="${query}"`;
  const output = execSync(cmd, { encoding: "utf-8" });
  const parsed = JSON.parse(output);
  const results = parsed[0]?.results || [];
  return results;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  if (!options.to && !options.all) {
    console.error("❌ ERROR: Debes especificar al menos un destinatario (--to email) o el modo masivo (--all).");
    console.log("\n💡 Para enviar la prueba a tu correo ejecuta:");
    console.log("   node scripts/send-cirkus-email.js --to alejandrorc2717@gmail.com --name \"Alejandro\"\n");
    process.exit(1);
  }

  if (!options.dryRun && !apiKey) {
    console.error("❌ ERROR: No se encontró la variable de entorno RESEND_API_KEY.");
    process.exit(1);
  }

  const resend = apiKey ? new Resend(apiKey) : null;

  // MODO 1: Envío de prueba individual
  if (options.to) {
    let targetName = options.name;
    if (targetName === "Familia 808") {
      const dbName = findNameByEmail(options.to);
      if (dbName) targetName = dbName;
    }
    const firstName = targetName.split(" ")[0] || "Amigo/a";

    const subject = args.includes("--subject")
      ? options.subject.replace(/\{\{name\}\}/g, firstName)
      : `🔥 ${firstName}, última oportunidad: Tenis Oficiales 808 Fest x CIRKUS 🔥`;

    console.log(`\n======================================================`);
    console.log(`🧪 ENVIANDO CORREO DISEÑO PREMIUM SNEAKERS A: ${options.to}`);
    console.log(`======================================================`);
    console.log(`- Destinatario : ${targetName} <${options.to}>`);
    console.log(`- Remitente    : ${defaultSender}`);
    console.log(`- Asunto       : ${subject}`);
    console.log(`- Enlace Tienda: ${options.shopUrl}`);
    console.log(`- Imagen Única : ${SINGLE_IMAGE_URL}`);

    const htmlContent = generateCirkusHtmlTemplate({
      fullName: targetName,
      shopUrl: options.shopUrl,
    });
    const textContent = generateCirkusPlainText({
      fullName: targetName,
      shopUrl: options.shopUrl,
    });

    if (options.dryRun) {
      console.log("\n[DRY RUN] Simulación completada con éxito. No se envió el correo.");
      return;
    }

    try {
      console.log("\n⏳ Enviando a través de Resend...");
      const payload = {
        from: defaultSender,
        reply_to: "tickets@el808fest.com",
        to: options.to,
        subject: subject,
        text: textContent,
        html: htmlContent,
      };

      const { data, error } = await resend.emails.send(payload);

      if (error) {
        console.error("❌ Error de Resend:", error);
      } else {
        console.log("✅ ¡Correo enviado con éxito a", options.to, "!");
        console.log("Detalles:", data);
        console.log(`🔗 Enlace incluido: ${options.shopUrl}`);
      }
    } catch (err) {
      console.error("❌ Error de conexión con Resend:", err.message || err);
    }
    return;
  }

  // MODO 2: Envío masivo
  if (options.all) {
    console.log(`\n======================================================`);
    console.log(`📢 MODO MASIVO: PROMOCIÓN SNEAKERS 808 FEST x CIRKUS`);
    console.log(`======================================================`);

    let recipients = [];
    try {
      recipients = getRecipientsFromD1();
    } catch (err) {
      console.error("❌ Error al consultar Cloudflare D1:", err.message || err);
      process.exit(1);
    }

    console.log(`📊 Destinatarios encontrados en la base de datos: ${recipients.length}`);

    if (recipients.length === 0) {
      console.log("⚠️ No hay destinatarios.");
      return;
    }

    if (options.dryRun) {
      console.log("\n[DRY RUN] Destinatarios que recibirían el correo:");
      recipients.forEach((r, idx) => console.log(`  ${idx + 1}. ${r.full_name} <${r.email}>`));
      return;
    }

    console.log(`\n⚠️ ENVIANDO A ${recipients.length} DESTINATARIOS...`);
    let successCount = 0;
    let failCount = 0;
    const logFilePath = path.resolve(process.cwd(), "cirkus_broadcast_results.log");
    fs.appendFileSync(logFilePath, `\n\n--- INICIO DE ENVÍO CIRKUS: ${new Date().toISOString()} ---\n`);

    for (let i = 0; i < recipients.length; i++) {
      const recipient = recipients[i];
      const name = recipient.full_name || "Amigo/a de 808";
      const email = recipient.email;
      const firstName = name.split(" ")[0] || "Amigo/a";

      const subject = args.includes("--subject")
        ? options.subject.replace(/\{\{name\}\}/g, firstName)
        : `🔥 ${firstName}, última oportunidad: Tenis Oficiales 808 Fest x CIRKUS 🔥`;

      const htmlContent = generateCirkusHtmlTemplate({
        fullName: name,
        shopUrl: options.shopUrl,
      });
      const textContent = generateCirkusPlainText({
        fullName: name,
        shopUrl: options.shopUrl,
      });

      process.stdout.write(`[${i + 1}/${recipients.length}] Enviando a ${name} <${email}>... `);

      let sent = false;
      let attempts = 0;
      let lastError = null;

      while (!sent && attempts < 3) {
        attempts++;
        try {
          const payload = {
            from: defaultSender,
            reply_to: "tickets@el808fest.com",
            to: email,
            subject: subject,
            text: textContent,
            html: htmlContent,
          };

          const { data, error } = await resend.emails.send(payload);

          if (error) {
            lastError = error.message || JSON.stringify(error);
            if (error.statusCode === 429 || lastError.includes("rate_limit")) {
              process.stdout.write(`⏳ Rate limit, pausando 2s (intento ${attempts})... `);
              await sleep(2000);
              continue;
            }
            break;
          } else {
            process.stdout.write(`✅ OK (ID: ${data?.id})\n`);
            successCount++;
            sent = true;
            fs.appendFileSync(logFilePath, `SUCCESS | ${new Date().toISOString()} | ${email} | ${name} | ResendID: ${data?.id}\n`);
          }
        } catch (err) {
          lastError = err.message || err;
          if (attempts < 3) await sleep(1500);
        }
      }

      if (!sent) {
        process.stdout.write(`❌ ERROR: ${lastError}\n`);
        failCount++;
        fs.appendFileSync(logFilePath, `FAILED  | ${new Date().toISOString()} | ${email} | ${name} | Error: ${lastError}\n`);
      }

      if (i < recipients.length - 1) {
        await sleep(options.delayMs);
      }
    }

    console.log(`\n======================================================`);
    console.log(`🏁 RESUMEN DEL ENVÍO`);
    console.log(`======================================================`);
    console.log(`✅ Enviados con éxito : ${successCount}`);
    console.log(`❌ Fallidos           : ${failCount}`);
  }
}

main();
