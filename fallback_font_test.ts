import { PrismaClient } from '@prisma/client';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('🏁 FALLBACK FONT TEST...');

  const geistFont = path.join(process.cwd(), 'node_modules/next/dist/compiled/@vercel/og/Geist-Regular.ttf');

  console.log(`Checking Geist font at: ${geistFont}`);
  if (fs.existsSync(geistFont)) {
    console.log('✅ Geist font exists.');
  } else {
    console.error('❌ Geist font NOT FOUND.');
    process.exit(1);
  }

  try {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    doc.font(geistFont).fontSize(12).text('Testing Geist font loading. This should work because it is a TrueType font.');
    
    const chunks: any[] = [];
    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => {
       console.log('✅ PDF Engine successfully loaded and used Geist font!');
    });
    doc.end();
  } catch (err: any) {
    console.error('❌ PDF Engine failed with Geist font:', err.message);
    process.exit(1);
  }

  console.log('--- FALLBACK TEST COMPLETED ---');
}

main().catch(console.error).finally(() => prisma.$disconnect());
