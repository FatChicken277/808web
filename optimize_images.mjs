import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const directoryPath = path.join(__dirname, 'public', 'images');

async function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      await processDirectory(fullPath);
    } else {
      const ext = path.extname(file).toLowerCase();
      if (['.jpg', '.jpeg', '.png'].includes(ext)) {
        const tempPath = fullPath + '.tmp';
        console.log(`Optimizing ${fullPath}`);
        try {
          await sharp(fullPath)
            .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
            .jpeg({ quality: 75, progressive: true, force: false })
            .toFile(tempPath);
          fs.renameSync(tempPath, fullPath);
        } catch (e) {
          console.error(`Error on ${file}: ${e.message}`);
          if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
        }
      }
    }
  }
}

processDirectory(directoryPath).then(() => console.log('Image optimization done')).catch(console.error);
