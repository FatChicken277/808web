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
  subject: "{{name}}, última oportunidad antes de 808 Fest (Tenis CIRKUS)",
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
  808 FEST x CIRKUS - COMUNICADO PERSONAL & EDICIÓN ESPECIAL
======================================================================

USO:
  node scripts/send-cirkus-email.js [opciones]

OPCIONES:
  --to <email>            Enviar correo de prueba a un destinatario específico.
                          Ej: node scripts/send-cirkus-email.js --to alejandrorc2717@gmail.com
  --name <nombre>         Nombre del destinatario (opcional).
  --all                   Enviar a toda la base de datos de D1.
  --dry-run               Simular sin realizar envíos reales.
  --subject <asunto>      Asunto personalizado del correo.
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

// Versión en texto plano directa, personal y conversacional
function generateCirkusPlainText({ fullName, shopUrl }) {
  const name = fullName || "Amigo/a de 808";
  const purchaseUrl = shopUrl || SHOP_URL;
  return `
Hola ${name},

Te escribo directamente desde la organización del 808 Fest porque queríamos compartirte algo especial antes de vernos en el evento.

Junto al equipo de CIRKUS diseñamos una edición conmemorativa de tenis oficiales del festival. Esta es la última oportunidad para obtener tu par antes del evento.

Puedes ver la edición completa y elegir tu talla aquí:
${purchaseUrl}

Si tienes cualquier duda con las tallas o sobre el evento este fin de semana, responde directamente a este correo y con gusto te ayudamos.

Un saludo,
El equipo de 808 Fest & CIRKUS

P.D. Agrega tickets@el808fest.com a tus contactos para asegurarte de recibir todas las actualizaciones importantes de tu entrada.
  `.trim();
}

// Plantilla HTML limpia, estilo mensaje directo (sin aspecto publicitario masivo)
function generateCirkusHtmlTemplate({ fullName, shopUrl }) {
  const safeName = (fullName || "Amigo/a de 808")
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
  <title>808 Fest x CIRKUS</title>
</head>
<body style="margin: 0; padding: 20px 10px; background-color: #0d0d0d; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #E5E5E5; line-height: 1.6;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 580px; margin: 0 auto; background-color: #121212; border: 1px solid #262626; border-radius: 12px; overflow: hidden; padding: 28px 24px;">
    <tr>
      <td>
        <!-- Encabezado simple -->
        <p style="margin: 0 0 16px 0; font-size: 15px; color: #FFFFFF; font-weight: 600;">
          Hola ${safeName},
        </p>

        <p style="margin: 0 0 16px 0; font-size: 15px; color: #CCCCCC;">
          Te escribimos directamente desde el equipo de <strong>808 Fest</strong>. Antes de vernos en el festival, queríamos contarte que preparamos una colaboración conmemorativa junto a <strong>CIRKUS</strong> para crear los tenis oficiales de esta edición.
        </p>

        <p style="margin: 0 0 20px 0; font-size: 15px; color: #CCCCCC;">
          Esta es la <strong style="color: #39FF14;">última oportunidad</strong> para obtener tu par antes del evento:
        </p>

        <!-- ÚNICA IMAGEN INTEGRADA -->
        <div style="margin: 20px 0; text-align: center;">
          <a href="${purchaseUrl}" target="_blank" style="display: block; text-decoration: none;">
            <img 
              src="${SINGLE_IMAGE_URL}" 
              alt="Edición Oficial 808 Fest x CIRKUS" 
              width="530" 
              style="width: 100%; max-width: 530px; height: auto; border-radius: 8px; display: block; border: 1px solid #2a2a2a;" 
            />
          </a>
        </div>

        <!-- Botón / Enlace Principal Directo -->
        <div style="margin: 26px 0 22px 0; text-align: center;">
          <a href="${purchaseUrl}" target="_blank" style="background-color: #39FF14; color: #000000; font-size: 15px; font-weight: 800; text-decoration: none; padding: 14px 32px; border-radius: 6px; display: inline-block; letter-spacing: 0.5px;">
            Ver y obtener la edición en CIRKUS →
          </a>
        </div>

        <!-- Llamado a responder (Interacción para reputación en Gmail) -->
        <div style="margin: 24px 0 16px 0; padding: 14px 16px; background-color: #171717; border-left: 3px solid #39FF14; border-radius: 4px;">
          <p style="margin: 0; font-size: 13px; color: #BBBBBB;">
            💬 <strong>¿Tienes alguna duda con las tallas o el evento?</strong> Simplemente responde a este correo y te ayudamos directamente.
          </p>
        </div>

        <p style="margin: 20px 0 6px 0; font-size: 14px; color: #FFFFFF;">
          Un saludo,<br/>
          <strong>Equipo 808 Fest &amp; CIRKUS</strong>
        </p>

        <!-- Consejo de contacto -->
        <p style="margin: 18px 0 0 0; font-size: 11px; color: #666666; border-top: 1px solid #222222; padding-top: 12px;">
          💡 <em>Tip: Agrega tickets@el808fest.com a tus contactos para no perderte ningún anuncio importante sobre el acceso al festival.</em>
        </p>
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
      : `${firstName}, última oportunidad antes de 808 Fest (Tenis CIRKUS)`;

    console.log(`\n======================================================`);
    console.log(`🧪 ENVIANDO CORREO DE ALTA ENTREGABILIDAD A: ${options.to}`);
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
    console.log(`📢 MODO MASIVO: COMUNICADO CIRKUS ALTA ENTREGABILIDAD`);
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
        : `${firstName}, última oportunidad antes de 808 Fest (Tenis CIRKUS)`;

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
