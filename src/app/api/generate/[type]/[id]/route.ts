import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ type: string; id: string }> }
) {
  try {
    const { type, id } = await params;
    
    const app = await prisma.application.findUnique({
      where: { id },
      include: { lead: true }
    });

    if (!app) {
      return NextResponse.json({ success: false, message: 'Application not found' }, { status: 404 });
    }

    const settings = await prisma.setting.findFirst({
      where: {
        companyName: {
          contains: app.companyName || '',
        }
      }
    }) || await prisma.setting.findFirst();

    if (!settings) {
      return NextResponse.json({ success: false, message: 'Company settings not found' }, { status: 404 });
    }

    // Create PDF
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const chunks: any[] = [];
    doc.on('data', (chunk) => chunks.push(chunk));

    const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      generatePDFContent(doc, type, app, settings);
      doc.end();
    });

    return new NextResponse(pdfBuffer as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=${app.name}_${type}.pdf`,
      },
    });

  } catch (err) {
    console.error('❌ PDF generation error:', err);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

function generatePDFContent(doc: PDFKit.PDFDocument, type: string, app: any, settings: any) {
  const pageWidth = doc.page.width;
  const pageHeight = doc.page.height;

  // Helper: Add Logo
  const addLogo = (startY = 40, width = 100) => {
    if (settings.companyLogo) {
      const logoPath = path.join(process.cwd(), settings.companyLogo);
      if (fs.existsSync(logoPath)) {
        let xPos = 50;
        if (settings.logoAlignment === 'center') xPos = pageWidth / 2 - width / 2;
        if (settings.logoAlignment === 'right') xPos = pageWidth - width - 50;
        doc.image(logoPath, xPos, startY, { width });
        return startY + 60;
      }
    }
    return startY;
  };

  // Helper: Add Footer
  const addFooter = () => {
    const footerY = pageHeight - 80;
    doc.fontSize(9).fillColor('gray');
    doc.text(settings.address || '', 50, footerY, { align: 'center', width: pageWidth - 100 });
    doc.text(`${settings.phone || ''} | ${settings.email || ''}`, 50, footerY + 15, { align: 'center', width: pageWidth - 100 });
    doc.fillColor('black');
  };

  if (type === 'certificate') {
    addLogo();
    doc.fontSize(18).font('Helvetica-Bold').text('INTERNSHIP CERTIFICATE', { align: 'center' });
    doc.moveDown();
    doc.font('Helvetica').fontSize(12).text(
      `This is to certify that ${app.name} has completed internship at ${app.companyName}.`
    );
    addFooter();
  } else if (type === 'noc') {
    addLogo();
    doc.moveDown(4);
    doc.fontSize(16).font('Helvetica-Bold').text('NO OBJECTION CERTIFICATE (NOC)', { align: 'center' });
    doc.moveDown(2);
    
    const pronoun = app.gender?.toLowerCase() === 'female' ? 'her' : 'his';
    doc.font('Helvetica').fontSize(11).text('To whom It may concern, this is to certify that ', { continued: true });
    doc.font('Helvetica-Bold').text(app.name, { continued: true });
    doc.font('Helvetica').text(`, who has been working with `, { continued: true });
    doc.font('Helvetica-Bold').text(app.companyName, { continued: true });
    doc.font('Helvetica').text(` as a `, { continued: true });
    doc.font('Helvetica-Bold').text(app.designation || '—', { continued: true });
    doc.font('Helvetica').text(` in the `, { continued: true });
    doc.font('Helvetica-Bold').text(app.department || '—', { continued: true });
    doc.font('Helvetica').text(` department, is an employee of our organization since `, { continued: true });
    doc.font('Helvetica-Bold').text(app.joiningDate || '—.');

    doc.moveDown();
    doc.font('Helvetica').text(`During the period of employment, ${pronoun} conduct and performance have been found satisfactory.`);
    
    doc.moveDown();
    doc.text(`This No Objection Certificate is being issued upon ${pronoun} request for the purpose of official use. The company has no objection to the same.`);

    doc.moveDown(2);
    const date = app.nocDate ? new Date(app.nocDate) : new Date();
    doc.text(`Issued on: ${date.toLocaleDateString('en-GB')}`);
    doc.text(`Place: ${settings.place || 'N/A'}`);

    addFooter();
  } else if (type === 'offer-letter' || type === 'appointment-letter') {
    const startY = addLogo();
    doc.moveDown(2);
    
    // Date and Ref
    const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
    doc.fontSize(10).font('Helvetica').text(`Date: ${today}`, 50);
    doc.text(`Ref: ${settings.companyName?.substring(0, 3).toUpperCase()}/${app.id.substring(0, 5).toUpperCase()}/2024`, 50);
    doc.moveDown();

    // Recipient Details
    doc.font('Helvetica-Bold').text('To,');
    doc.text(app.name);
    doc.font('Helvetica').text(app.address || '');
    doc.text(`Contact: ${app.phone}`);
    doc.moveDown(2);

    // Subject
    const title = type === 'offer-letter' ? 'OFFER LETTER' : 'APPOINTMENT LETTER';
    doc.fontSize(12).font('Helvetica-Bold').text(`Subject: ${title} FOR THE POSITION OF ${app.designation?.toUpperCase()}`, { align: 'center', underline: true });
    doc.moveDown(2);

    // Salutation
    doc.fontSize(11).font('Helvetica').text(`Dear ${app.name},`);
    doc.moveDown();

    // Body
    const content = type === 'offer-letter' 
      ? `We are pleased to offer you the position of ${app.designation} at ${app.companyName}. Based on our discussions, we believe that your skills and experience will be a valuable asset to our team. We are confident that you will find your time with us both challenging and rewarding.`
      : `Pursuant to our recent discussions, we are pleased to appoint you as ${app.designation} at ${app.companyName} effective from ${app.joiningDate}. This appointment is subject to the terms and conditions outlined in our corporate policy.`;

    doc.text(content, { align: 'justify', lineGap: 2 });
    doc.moveDown();

    doc.font('Helvetica-Bold').text('Key Terms of Employment:');
    doc.font('Helvetica');
    doc.list([
      `Designation: ${app.designation}`,
      `Joining Date: ${app.joiningDate}`,
      `Annual CTC: INR ${app.ctc} (Subject to statutory deductions)`,
      `Work Location: ${settings.place || 'As assigned'}`,
      `Reporting to: ${app.mentorName || 'Department Head'}`
    ], { bulletRadius: 2, textIndent: 20 });
    
    doc.moveDown();
    doc.text('A detailed salary breakdown and employment agreement will be provided on your date of joining. Please confirm your acceptance of this offer by signing and returning a copy of this letter.', { align: 'justify', lineGap: 2 });

    doc.moveDown(3);
    
    // Signature Section
    const currentY = doc.y;
    doc.font('Helvetica-Bold').text('For ' + settings.companyName, 50, currentY);
    
    if (settings.stamp) {
      const stampPath = path.join(process.cwd(), settings.stamp);
      if (fs.existsSync(stampPath)) {
        doc.image(stampPath, 60, currentY + 15, { width: 80 });
      }
    }

    doc.moveDown(5);
    doc.text(settings.authorizedPerson || 'Authorized Signatory', 50);
    doc.fontSize(10).font('Helvetica').text(settings.authorizedDesignation || 'Director', 50);

    addFooter();
  } else if (type === 'payslip') {
    addLogo();
    doc.moveDown(2);
    doc.fontSize(14).font('Helvetica-Bold').text('SALARY PAYSLIP', { align: 'center' });
    doc.fontSize(10).font('Helvetica').text(`Month: ${app.payslipDate || 'N/A'}`, { align: 'center' });
    doc.moveDown();

    // Employee Details Table
    doc.rect(50, doc.y, pageWidth - 100, 60).stroke();
    const tableTop = doc.y + 10;
    doc.text(`Emp Name: ${app.name}`, 60, tableTop);
    doc.text(`Emp ID: ${app.empId || 'N/A'}`, 300, tableTop);
    doc.text(`Designation: ${app.designation || 'N/A'}`, 60, tableTop + 15);
    doc.text(`Working Days: ${app.workingDays || '0'}`, 300, tableTop + 15);
    doc.text(`Bank Acc: ${app.accountNumber || 'N/A'}`, 60, tableTop + 30);
    doc.text(`PAN: ${app.pan || 'N/A'}`, 300, tableTop + 30);
    
    doc.moveDown(4);

    // Earnings & Deductions Table
    const tableY = doc.y;
    doc.rect(50, tableY, (pageWidth - 100) / 2, 150).stroke();
    doc.rect(50 + (pageWidth - 100) / 2, tableY, (pageWidth - 100) / 2, 150).stroke();
    
    doc.font('Helvetica-Bold');
    doc.text('EARNINGS', 60, tableY + 10);
    doc.text('AMOUNT', 220, tableY + 10);
    doc.text('DEDUCTIONS', 310, tableY + 10);
    doc.text('AMOUNT', 470, tableY + 10);
    doc.font('Helvetica');

    const rowStart = tableY + 30;
    doc.text('Basic Salary', 60, rowStart);
    doc.text(app.basic?.toString() || '0', 220, rowStart);
    doc.text('Provident Fund (PF)', 310, rowStart);
    doc.text(app.providentFund?.toString() || '0', 470, rowStart);

    doc.text('HRA', 60, rowStart + 15);
    doc.text(app.houseRentAllowance?.toString() || '0', 220, rowStart + 15);
    doc.text('ESI', 310, rowStart + 15);
    doc.text(app.employeeEsi?.toString() || '0', 470, rowStart + 15);

    doc.text('Statutory Bonus', 60, rowStart + 30);
    doc.text(app.statutoryBonus?.toString() || '0', 220, rowStart + 30);
    doc.text('Professional Tax', 310, rowStart + 30);
    doc.text(app.professionalTax?.toString() || '0', 470, rowStart + 30);

    doc.text('Special Allowance', 60, rowStart + 45);
    doc.text(app.specialAllowance?.toString() || '0', 220, rowStart + 45);

    doc.rect(50, tableY + 130, pageWidth - 100, 20).stroke();
    doc.font('Helvetica-Bold');
    doc.text('GROSS SALARY', 60, tableY + 135);
    doc.text(app.grossSalary?.toString() || '0', 220, tableY + 135);
    doc.text('TOTAL DEDUCTIONS', 310, tableY + 135);
    doc.text(app.totalDeduction?.toString() || '0', 470, tableY + 135);

    doc.moveDown(4);
    doc.fontSize(12).text(`NET TAKE HOME: INR ${app.netTakeHome || '0'}`, { align: 'right', width: pageWidth - 100 });
    doc.fontSize(10).font('Helvetica').text(`(In words: Rupees ${app.netTakeHome || 'zero'} only)`, { align: 'right', width: pageWidth - 100 });

    addFooter();
  } else {
    addLogo();
    doc.moveDown(4);
    doc.fontSize(16).font('Helvetica-Bold').text(type.toUpperCase().replace('-', ' '), { align: 'center' });
    doc.moveDown(2);
    doc.font('Helvetica').text(`This is the ${type} for ${app.name}.`);
    addFooter();
  }
}
