import { Resend } from "resend";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

// Cargar variables de entorno manualmente del archivo .env si existe
try {
  const envPath = path.resolve(process.cwd(), ".env");
  if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, "utf-8");
    for (const line of envConfig.split(/\r?\n/)) {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let value = (match[2] || "").trim();
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        process.env[key] = value;
      }
    }
  }
} catch (e) {
  // Silenciar errores al leer .env
}

const apiKey = process.env.RESEND_API_KEY;

if (!apiKey) {
  console.error("ERROR: Debes definir la variable de entorno RESEND_API_KEY.");
  console.log("\nEn Windows (PowerShell), puedes definirla ejecutando:");
  console.log('  $env:RESEND_API_KEY="tu_api_key_de_resend"');
  console.log("\nO crear un archivo .env en la raíz del proyecto con:");
  console.log('  RESEND_API_KEY=tu_api_key_de_resend');
  process.exit(1);
}

// Leer argumentos
const args = process.argv.slice(2);
let searchType = ""; // "email", "token", "name"
let searchValue = "";
let overrideEmail = "";

for (let i = 0; i < args.length; i++) {
  if (args[i] === "--email") {
    searchType = "email";
    searchValue = args[i + 1];
    i++;
  } else if (args[i] === "--token") {
    searchType = "token";
    searchValue = args[i + 1];
    i++;
  } else if (args[i] === "--name") {
    searchType = "name";
    searchValue = args[i + 1];
    i++;
  } else if (args[i] === "--to") {
    overrideEmail = args[i + 1];
    i++;
  }
}

if (!searchType || !searchValue) {
  console.log("Uso:");
  console.log("  node scripts/resend-by-db.js [criterio de búsqueda] [valor] [--to nuevo-email]");
  console.log("\nCriterios de búsqueda permitidos:");
  console.log('  --email "correo@ejemplo.com"');
  console.log('  --token "uuid-del-ticket"');
  console.log('  --name "Nombre de la Persona"');
  console.log("\nEjemplos:");
  console.log('  node scripts/resend-by-db.js --email "hanna@example.com"');
  console.log('  node scripts/resend-by-db.js --token "75fac2a3-4c8d-4ee2-a9ca-dfcf53fb5bb4" --to "correo-correcto@gmail.com"');
  process.exit(1);
}

// Construir la consulta SQL
let query = "";
if (searchType === "email") {
  query = `SELECT full_name, email, qr_token FROM tickets WHERE email = '${searchValue.trim().toLowerCase()}';`;
} else if (searchType === "token") {
  query = `SELECT full_name, email, qr_token FROM tickets WHERE qr_token = '${searchValue.trim()}';`;
} else if (searchType === "name") {
  query = `SELECT full_name, email, qr_token FROM tickets WHERE full_name LIKE '%${searchValue.trim()}%';`;
}

async function run() {
  try {
    console.log(`Buscando ticket en la base de datos remota D1...`);
    const cmd = `npx wrangler d1 execute 808web-db --remote --json --command="${query}"`;
    const output = execSync(cmd, { encoding: "utf-8" });
    
    const parsed = JSON.parse(output);
    const results = parsed[0]?.results || [];
    
    if (results.length === 0) {
      console.error(`No se encontró ningún ticket que coincida con ${searchType} = "${searchValue}".`);
      process.exit(1);
    }
    
    if (results.length > 1) {
      console.log(`Se encontraron múltiples tickets (${results.length}). Por favor, sé más específico o busca por token.`);
      results.forEach((r, idx) => {
        console.log(`  ${idx + 1}. Nombre: ${r.full_name} | Email: ${r.email} | Token: ${r.qr_token}`);
      });
      process.exit(1);
    }
    
    const ticket = results[0];
    const targetEmail = overrideEmail || ticket.email;
    
    console.log(`Ticket encontrado:`);
    console.log(`  - Nombre: ${ticket.full_name}`);
    console.log(`  - Email registrado: ${ticket.email}`);
    console.log(`  - Destinatario final: ${targetEmail}`);
    console.log(`  - Token: ${ticket.qr_token}`);
    
    console.log(`\nEnviando correo a través de Resend...`);
    
    const resend = new Resend(apiKey);
    const qrUrl = `https://el808fest.com/ticket/${ticket.qr_token}`;
    const safeName = ticket.full_name
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
      
    const { data, error } = await resend.emails.send({
      from: "808 Fest <tickets@el808fest.com>",
      to: targetEmail,
      subject: "Tu ticket para 808 Fest",
      html: `
        <div style="font-family: monospace; background-color: #000; color: #fff; padding: 40px; text-align: center;">
          <h1 style="color: #39FF14; text-transform: uppercase;">808 FEST</h1>
          <h2>HOLA ${safeName.toUpperCase()}, AQUÍ ESTÁ TU TICKET</h2>
          <p>Muestra este código QR en la entrada del evento.</p>
          <div style="background: white; padding: 20px; display: inline-block; margin-top: 20px; border-radius: 10px;">
            <img src="https://el808fest.com/api/qr/${ticket.qr_token}" alt="Ticket QR" width="220" height="220" style="display: block; border: 0; outline: none; text-decoration: none;" />
          </div>
          <p style="margin-top: 40px; opacity: 0.7; font-size: 12px;">Token: ${ticket.qr_token}</p>
          <p style="margin-top: 20px;">
            Si no ves el QR:
            <a href="${qrUrl}" style="color: #39FF14;">abre tu ticket aquí</a>
          </p>
        </div>
      `,
    });
    
    if (error) {
      console.error("Error al enviar con Resend:", error);
    } else {
      console.log("¡Correo enviado con éxito!", data);
    }
  } catch (err) {
    console.error("Error ejecutando la consulta o enviando el correo:", err.message || err);
  }
}

run();
