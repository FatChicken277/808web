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

// Parsear argumentos de la línea de comandos
const args = process.argv.slice(2);
const options = {
  to: null,
  name: "Amigo/a de 808",
  token: null, // qr_token del ticket
  all: false,
  dryRun: false,
  subject: "⚡ ¡ESTE DOMINGO 06 DE SEPTIEMBRE ES 808 FEST! - Horarios y Recomendaciones",
  title: "¡ESTE DOMINGO NOS VEMOS EN EL 808 FEST!",
  flyerUrl: "https://www.el808fest.com/images/flyer.png",
  location: "Teatro Carlos Vieco, Medellín",
  date: "Domingo 06 de Septiembre",
  schedule: "Abre a las 12:00 PM – Termina a las 10:00 PM",
  message:
    "¡Falta muy poco para vivir la mejor experiencia de música y cultura under! Queremos recordarte que la cita es este domingo 06 de septiembre. Ten listo tu código QR de entrada en el celular y llega temprano para disfrutar de todo el line-up desde el inicio.",
  buttonText: "VER MI TICKET",
  buttonUrl: "https://el808fest.com",
  templateFile: null,
  delayMs: 350,
};

for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg === "--to") {
    options.to = args[++i];
  } else if (arg === "--name") {
    options.name = args[++i];
  } else if (arg === "--token") {
    options.token = args[++i];
  } else if (arg === "--all" || arg === "--broadcast") {
    options.all = true;
  } else if (arg === "--dry-run") {
    options.dryRun = true;
  } else if (arg === "--subject") {
    options.subject = args[++i];
  } else if (arg === "--title") {
    options.title = args[++i];
  } else if (arg === "--message") {
    options.message = args[++i];
  } else if (arg === "--flyer" || arg === "--flyer-url") {
    options.flyerUrl = args[++i];
  } else if (arg === "--location") {
    options.location = args[++i];
  } else if (arg === "--date") {
    options.date = args[++i];
  } else if (arg === "--schedule") {
    options.schedule = args[++i];
  } else if (arg === "--button-text") {
    options.buttonText = args[++i];
  } else if (arg === "--button-url") {
    options.buttonUrl = args[++i];
  } else if (arg === "--template") {
    options.templateFile = args[++i];
  } else if (arg === "--delay") {
    options.delayMs = parseInt(args[++i], 10) || 350;
  } else if (arg === "--help" || arg === "-h") {
    showHelp();
    process.exit(0);
  }
}

function showHelp() {
  console.log(`
======================================================
  808 FEST - PUBLICIDAD Y RECORDATORIO POR CORREO
======================================================

USO:
  node scripts/send-marketing-email.js [opciones]

OPCIONES PARA PRUEBA INDIVIDUAL:
  --to <email>              Enviar correo de prueba a un destinatario específico.
                            Ej: --to alejandrorc2717@gmail.com
  --name <nombre>           Nombre del destinatario (opcional).
  --token <uuid>            Token del ticket para enlazar a https://el808fest.com/ticket/<token>

DETALLES DEL EVENTO:
  --date <fecha>            Fecha del evento (default: "Domingo 06 de Septiembre").
  --schedule <horario>      Horario del evento (default: "Abre a las 12:00 PM – Termina a las 10:00 PM").
  --location <lugar>        Ubicación del evento (default: "Teatro Carlos Vieco, Medellín").
  --flyer <url_imagen>      URL del flyer oficial.

PERSONALIZACIÓN DEL CONTENIDO:
  --subject <asunto>        Asunto del correo.
  --title <título>          Título principal dentro del diseño.
  --message <texto>         Cuerpo del mensaje.
  --button-text <texto>     Texto del botón CTA.
  --button-url <url>        Enlace del botón CTA (si no hay token).
`);
}

// Buscar datos del ticket por email en Cloudflare D1
function findTicketByEmail(email) {
  try {
    const query = `SELECT full_name, email, qr_token FROM tickets WHERE LOWER(TRIM(email)) = '${email.trim().toLowerCase()}' LIMIT 1;`;
    const cmd = `npx wrangler d1 execute 808web-db --remote --json --command="${query}"`;
    const output = execSync(cmd, { encoding: "utf-8", stdio: ["pipe", "pipe", "ignore"] });
    const parsed = JSON.parse(output);
    const results = parsed[0]?.results || [];
    if (results.length > 0) {
      return results[0];
    }
  } catch (e) {
    // Si falla wrangler, continúa con los datos proporcionados
  }
  return null;
}

// Generador de plantilla HTML estilizada
function generateHtmlTemplate({ fullName, title, message, flyerUrl, location, date, schedule, buttonText, qrToken }) {
  const safeName = (fullName || "Fan de 808")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  const safeTitle = (title || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  const safeMessage = (message || "")
    .replace(/\n/g, "<br/>");

  // Enlace directo al ticket de la persona
  const ticketUrl = qrToken 
    ? `https://el808fest.com/ticket/${qrToken}` 
    : "https://el808fest.com";

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${safeTitle}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #050505; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #FFFFFF; -webkit-font-smoothing: antialiased;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #050505; min-height: 100vh; padding: 25px 10px;">
    <tr>
      <td align="center">
        <!-- Contenedor Principal -->
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #0d0d0d; border: 1px solid #222222; border-radius: 16px; overflow: hidden; box-shadow: 0 15px 40px rgba(0,0,0,0.9);">
          
          <!-- Encabezado Neon -->
          <tr>
            <td style="padding: 35px 25px 22px 25px; text-align: center; background: radial-gradient(circle at center, #173312 0%, #0d0d0d 80%); border-bottom: 1px solid #1a2918;">
              <h1 style="margin: 0; font-size: 38px; font-weight: 900; letter-spacing: 4px; color: #39FF14; font-family: monospace, sans-serif; text-shadow: 0 0 16px rgba(57, 255, 20, 0.45);">
                808 FEST
              </h1>
              <p style="margin: 8px 0 0 0; font-size: 13px; letter-spacing: 2px; color: #aaaaaa; text-transform: uppercase;">
                Música • Arte • Cultura Under
              </p>
            </td>
          </tr>

          <!-- Flyer del Evento -->
          ${
            flyerUrl
              ? `
          <tr>
            <td align="center" style="padding: 22px 25px 0 25px; background-color: #0d0d0d;">
              <a href="${ticketUrl}" target="_blank" style="display: block; text-decoration: none;">
                <img 
                  src="${flyerUrl}" 
                  alt="Flyer Oficial 808 Fest" 
                  width="550" 
                  style="width: 100%; max-width: 550px; height: auto; border-radius: 12px; display: block; border: 1px solid #2b3b28; box-shadow: 0 8px 25px rgba(0,0,0,0.6);" 
                />
              </a>
            </td>
          </tr>
          `
              : ""
          }

          <!-- Contenido Principal -->
          <tr>
            <td style="padding: 30px 30px 20px 30px; text-align: left;">
              <p style="margin: 0 0 12px 0; font-size: 15px; color: #39FF14; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px;">
                ¡HOLA, ${safeName.toUpperCase()}!
              </p>

              <h2 style="margin: 0 0 18px 0; font-size: 22px; font-weight: 800; color: #FFFFFF; line-height: 1.35; letter-spacing: 0.5px;">
                ${safeTitle}
              </h2>

              <p style="margin: 0 0 20px 0; font-size: 15px; line-height: 1.6; color: #CCCCCC;">
                ${safeMessage}
              </p>

              <!-- Tarjeta de Detalles del Evento -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #141414; border: 1px solid #282828; border-radius: 10px; margin: 25px 0; padding: 18px;">
                <tr>
                  <td>
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td style="padding-bottom: 12px;">
                          <strong style="color: #39FF14; font-size: 14px;">📅 FECHA:</strong>
                          <span style="color: #FFFFFF; font-size: 14px; margin-left: 6px; font-weight: 600;">${date}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-bottom: 12px;">
                          <strong style="color: #39FF14; font-size: 14px;">⏰ HORARIO:</strong>
                          <span style="color: #FFFFFF; font-size: 14px; margin-left: 6px; font-weight: 600;">${schedule}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-bottom: 12px;">
                          <strong style="color: #39FF14; font-size: 14px;">📍 LUGAR:</strong>
                          <span style="color: #FFFFFF; font-size: 14px; margin-left: 6px; font-weight: 600;">${location}</span>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <strong style="color: #39FF14; font-size: 14px;">🎟️ TU TICKET:</strong>
                          <span style="color: #FFFFFF; font-size: 14px; margin-left: 6px;">
                            <a href="${ticketUrl}" style="color: #39FF14; text-decoration: underline; font-weight: 700;">
                              ${qrToken ? `Abrir mi ticket (el808fest.com/ticket/${qrToken})` : 'Abrir mi ticket en la web'}
                            </a>
                          </span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Recomendaciones Importantes -->
              <div style="margin: 20px 0; padding: 18px; background-color: #121811; border-left: 3px solid #39FF14; border-radius: 4px;">
                <p style="margin: 0 0 10px 0; font-size: 14px; font-weight: 700; color: #39FF14; text-transform: uppercase;">
                  ⚠️ Recomendaciones clave para el ingreso:
                </p>
                <ul style="margin: 0; padding-left: 18px; color: #B0B0B0; font-size: 13px; line-height: 1.7;">
                  <li><strong>Apertura de puertas:</strong> 12:00 PM (Llega temprano para evitar filas y disfrutar de todo el show hasta las 10:00 PM).</li>
                  <li><strong style="color: #FFFFFF;">Menores de edad:</strong> Deben asistir e ingresar obligatoriamente acompañados por un adulto responsable.</li>
                  <li><strong>Documento de identidad:</strong> Lleva tu documento original para el control en el acceso.</li>
                  <li><strong>Ticket QR:</strong> Ten listo el código QR desde tu celular haciendo clic en el botón de abajo.</li>
                  <li><strong>Calzado cómodo y la mejor actitud:</strong> ¡Prepárate para una jornada increíble!</li>
                </ul>
              </div>

              <!-- Botón CTA Principal -->
              <div style="margin: 35px 0 25px 0; text-align: center;">
                <a href="${ticketUrl}" style="background-color: #39FF14; color: #000000; font-size: 15px; font-weight: 900; text-decoration: none; padding: 16px 36px; border-radius: 50px; display: inline-block; letter-spacing: 1.5px; text-transform: uppercase; box-shadow: 0 4px 20px rgba(57, 255, 20, 0.4);">
                  ${buttonText}
                </a>
                <p style="margin: 12px 0 0 0; font-size: 12px; color: #888888;">
                  Enlace directo: <a href="${ticketUrl}" style="color: #39FF14; text-decoration: none;">${ticketUrl}</a>
                </p>
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 22px 25px; text-align: center; background-color: #080808; border-top: 1px solid #1a1a1a;">
              <p style="margin: 0 0 6px 0; font-size: 12px; color: #777777;">
                © 2026 808 Fest • Medellín, Colombia
              </p>
              <p style="margin: 0; font-size: 11px; color: #444444;">
                Has recibido este correo porque estás registrado en la base de datos de 808 Fest.
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

// Función para obtener destinatarios de la base de datos D1
function getRecipientsFromD1() {
  console.log("🔍 Consultando base de datos remota D1 (808web-db)...");
  const query = `
    SELECT 
      MIN(full_name) AS full_name, 
      LOWER(TRIM(email)) AS email,
      MIN(qr_token) AS qr_token
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

// Función auxiliar para pausas
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Preparar attachment si existe el flyer localmente
function getFlyerAttachment() {
  const possiblePaths = [
    path.resolve(process.cwd(), "public/flyer.png"),
    path.resolve(process.cwd(), "public/images/flyer.png"),
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      try {
        return {
          filename: "flyer.png",
          content: fs.readFileSync(p),
        };
      } catch (e) {
        // Ignorar si falla lectura
      }
    }
  }
  return null;
}

async function main() {
  if (!options.to && !options.all) {
    console.error("❌ ERROR: Debes especificar al menos un destinatario (--to email) o el modo masivo (--all).");
    console.log("\n💡 Para probar con tu correo ejecuta:");
    console.log("   node scripts/send-marketing-email.js --to alejandrorc2717@gmail.com --name \"Alejandro\"\n");
    console.log("Usa --help para ver todas las opciones disponibles.");
    process.exit(1);
  }

  if (!options.dryRun && !apiKey) {
    console.error("❌ ERROR: No se encontró la variable de entorno RESEND_API_KEY.");
    console.log("\nPuedes configurarla en el archivo .env:\n  RESEND_API_KEY=tu_clave_resend\n");
    process.exit(1);
  }

  const resend = apiKey ? new Resend(apiKey) : null;
  const flyerAttachment = getFlyerAttachment();

  // CASO 1: Envío individual de prueba
  if (options.to) {
    let targetName = options.name;
    let targetToken = options.token;

    // Si no se pasó un token manual, intentar buscar en la base de datos
    if (!targetToken) {
      console.log(`🔍 Verificando si existe ticket registrado para ${options.to}...`);
      const existingTicket = findTicketByEmail(options.to);
      if (existingTicket) {
        targetToken = existingTicket.qr_token;
        if (targetName === "Amigo/a de 808" && existingTicket.full_name) {
          targetName = existingTicket.full_name;
        }
        console.log(`🎟️ Ticket encontrado en BD! Token: ${targetToken} | Nombre: ${targetName}`);
      } else {
        console.log(`ℹ️ No se encontró ticket en BD para ${options.to} (o no hay conexión a D1).`);
      }
    }

    const ticketUrl = targetToken 
      ? `https://el808fest.com/ticket/${targetToken}` 
      : "https://el808fest.com";

    console.log(`\n======================================================`);
    console.log(`🧪 ENVIANDO CORREO A: ${options.to}`);
    console.log(`======================================================`);
    console.log(`- Destinatario : ${targetName} <${options.to}>`);
    console.log(`- Remitente    : ${defaultSender}`);
    console.log(`- Asunto       : ${options.subject}`);
    console.log(`- Fecha        : ${options.date}`);
    console.log(`- Horario      : ${options.schedule}`);
    console.log(`- Ubicación    : ${options.location}`);
    console.log(`- Ticket URL   : ${ticketUrl}`);
    console.log(`- Flyer        : ${options.flyerUrl}`);

    let htmlContent = "";
    if (options.templateFile && fs.existsSync(options.templateFile)) {
      htmlContent = fs.readFileSync(options.templateFile, "utf-8");
      htmlContent = htmlContent.replace(/\{\{name\}\}/g, targetName);
      htmlContent = htmlContent.replace(/\{\{ticketUrl\}\}/g, ticketUrl);
    } else {
      htmlContent = generateHtmlTemplate({
        fullName: targetName,
        title: options.title,
        message: options.message,
        flyerUrl: options.flyerUrl,
        location: options.location,
        date: options.date,
        schedule: options.schedule,
        buttonText: options.buttonText,
        qrToken: targetToken,
      });
    }

    if (options.dryRun) {
      console.log("\n[DRY RUN] Simulación completada. No se envió el correo.");
      return;
    }

    try {
      console.log("\n⏳ Enviando a través de Resend...");
      const payload = {
        from: defaultSender,
        to: options.to,
        subject: options.subject,
        html: htmlContent,
      };

      const { data, error } = await resend.emails.send(payload);

      if (error) {
        console.error("❌ Error de Resend al enviar:", error);
      } else {
        console.log("✅ ¡Correo enviado con éxito!");
        console.log("Detalles:", data);
        console.log(`🔗 Enlace al ticket incluido en el correo: ${ticketUrl}`);
      }
    } catch (err) {
      console.error("❌ Error de conexión con Resend:", err.message || err);
    }
    return;
  }

  // CASO 2: Envío masivo a toda la base de datos
  if (options.all) {
    console.log(`\n======================================================`);
    console.log(`📢 MODO MASIVO: Para toda la base de datos`);
    console.log(`======================================================`);

    let recipients = [];
    try {
      recipients = getRecipientsFromD1();
    } catch (err) {
      console.error("❌ Error al obtener los registros de Cloudflare D1:", err.message || err);
      process.exit(1);
    }

    console.log(`📊 Se encontraron ${recipients.length} destinatarios únicos.`);

    if (recipients.length === 0) {
      console.log("⚠️ No hay correos registrados en la base de datos.");
      return;
    }

    if (options.dryRun) {
      console.log("\n[DRY RUN] Lista de destinatarios que recibirían el correo:");
      recipients.forEach((r, idx) => {
        const tUrl = r.qr_token ? `https://el808fest.com/ticket/${r.qr_token}` : "https://el808fest.com";
        console.log(`  ${idx + 1}. ${r.full_name} <${r.email}> -> ${tUrl}`);
      });
      console.log(`\nTotal: ${recipients.length} correos listos para el envío.`);
      return;
    }

    console.log(`\n⚠️ ATENCIÓN: Vas a enviar este correo a ${recipients.length} personas.`);
    console.log(`- Asunto: "${options.subject}"`);
    console.log(`- Remitente: ${defaultSender}`);
    console.log(`- Intervalo: ${options.delayMs}ms entre correos\n`);

    let successCount = 0;
    let failCount = 0;
    const failedList = [];

    for (let i = 0; i < recipients.length; i++) {
      const recipient = recipients[i];
      const name = recipient.full_name || "Amigo/a de 808";
      const email = recipient.email;
      const qrToken = recipient.qr_token;

      let htmlContent = "";
      if (options.templateFile && fs.existsSync(options.templateFile)) {
        htmlContent = fs.readFileSync(options.templateFile, "utf-8");
        htmlContent = htmlContent.replace(/\{\{name\}\}/g, name);
      } else {
        htmlContent = generateHtmlTemplate({
          fullName: name,
          title: options.title,
          message: options.message,
          flyerUrl: options.flyerUrl,
          location: options.location,
          date: options.date,
          schedule: options.schedule,
          buttonText: "VER MI TICKET",
          qrToken: qrToken,
        });
      }

      process.stdout.write(`[${i + 1}/${recipients.length}] Enviando a ${email}... `);

      try {
        const payload = {
          from: defaultSender,
          to: email,
          subject: options.subject,
          html: htmlContent,
        };

        const { data, error } = await resend.emails.send(payload);

        if (error) {
          process.stdout.write(`❌ ERROR: ${error.message || JSON.stringify(error)}\n`);
          failCount++;
          failedList.push({ email, error: error.message || error });
        } else {
          process.stdout.write(`✅ OK (ID: ${data?.id})\n`);
          successCount++;
        }
      } catch (err) {
        process.stdout.write(`❌ ERROR: ${err.message}\n`);
        failCount++;
        failedList.push({ email, error: err.message });
      }

      if (i < recipients.length - 1) {
        await sleep(options.delayMs);
      }
    }

    console.log(`\n======================================================`);
    console.log(`🏁 RESUMEN DEL ENVÍO MASIVO`);
    console.log(`======================================================`);
    console.log(`✅ Enviados con éxito : ${successCount}`);
    console.log(`❌ Fallidos           : ${failCount}`);
    if (failedList.length > 0) {
      console.log(`\nLista de correos con error:`);
      failedList.forEach((f) => console.log(`  - ${f.email}: ${f.error}`));
    }
  }
}

main();
