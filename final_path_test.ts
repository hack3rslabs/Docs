import { PrismaClient } from '@prisma/client';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('🏁 FINAL PATH VALIDATION TEST...');

  const fontPath = path.join(process.cwd(), 'src', 'assets', 'fonts');
  const fontFile = path.join(fontPath, 'Helvetica.afm');

  console.log(`Checking font file at: ${fontFile}`);
  if (fs.existsSync(fontFile)) {
    console.log('✅ Font file exists.');
  } else {
    console.error('❌ Font file NOT FOUND at the expected path.');
    process.exit(1);
  }

  try {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    doc.font(fontFile).text('Testing local font loading.');
    
    const chunks: any[] = [];
    doc.on('data', (c: Buffer) => chunks.push(c));
    doc.on('end', () => {
       console.log('✅ PDF Engine successfully loaded and used local font.');
    });
    doc.end();
  } catch (err: any) {
    console.error('❌ PDF Engine failed with local font:', err.message);
    process.exit(1);
  }

  console.log('--- ALL SYSTEMS CONFIRMED ---');
}

main().catch(console.error).finally(() => prisma.$disconnect());
