import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { numberToWords } from '@/lib/number-to-words';
import { calculateSalary } from '@/lib/salary-utils';
import { verifyAuth, unauthorizedResponse } from '@/lib/auth';
import { decrypt } from '@/lib/encryption';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ type: string; id: string }> }
) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) return unauthorizedResponse();

    const { type, id } = await params;
    const body = await request.json().catch(() => ({}));
    const { manualCtc } = body;
    
    const app = await prisma.application.findUnique({
      where: { id },
      include: { lead: true }
    });

    if (!app) {
      return NextResponse.json({ success: false, message: 'Application not found' }, { status: 404 });
    }

    // Decrypt sensitive fields for PDF content
    app.aadhar = decrypt(app.aadhar || '');
    app.pan = decrypt(app.pan || '');
    app.accountNumber = decrypt(app.accountNumber || '');

    // Override with manual CTC if provided
    if (manualCtc) {
      const annualCtc = parseFloat(manualCtc.toString().replace(/,/g, ''));
      if (!isNaN(annualCtc)) {
        const salaryData = calculateSalary(annualCtc);
        Object.assign(app, salaryData);
        (app as any).ctc = annualCtc.toLocaleString('en-IN');
      }
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

    const doc = new PDFDocument({ 
      margin: 50, 
      size: 'A4'
    });

    const chunks: any[] = [];
    doc.on('data', (chunk) => chunks.push(chunk));

    const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
      try {
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', (err) => {
          console.error('PDFKit Error:', err);
          reject(err);
        });
        generatePDFContent(doc, type, app, settings);
        doc.end();
      } catch (e) {
        console.error('Sync PDF Error:', e);
        reject(e);
      }
    });

    return new NextResponse(pdfBuffer as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${(app.name || 'document').replace(/\s+/g, '_')}_${type}.pdf"`,
      },
    });

  } catch (err: any) {
    console.error('❌ PDF generation error:', err);
    return NextResponse.json({ success: false, message: 'Server error: ' + err.message }, { status: 500 });
  }
}

function generatePDFContent(doc: PDFKit.PDFDocument, type: string, app: any, settings: any) {
  const pageWidth = doc.page.width;
  const pageHeight = doc.page.height;

  // Use built-in PDFKit font names directly (no file paths).
  // Passing a file path to doc.font() causes pdfkit to read the .afm via
  // __dirname which Next.js/webpack corrupts, producing ENOENT errors.
  const fontRegular = 'Helvetica';
  const fontBold = 'Helvetica-Bold';

  // Auto-generate a deterministic Offer Number (TW-XXXXXX)
  let numericHash = 0;
  for (let i = 0; i < (app.id || '').length; i++) {
    numericHash = (numericHash * 31 + (app.id || '').charCodeAt(i)) % 1000000;
  }
  const offerNumber = `TW-${numericHash.toString().padStart(6, '0')}`;

  // Helper: Format Date
  const formatDate = (dateStr?: string | null) => {
    if (!dateStr || dateStr === 'null') return '—';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  const addLogo = (startY = 40, width = 110) => {
    if (settings.companyLogo) {
      const logoPath = path.join(process.cwd(), settings.companyLogo);
      if (fs.existsSync(logoPath)) {
        let xPos = 50;
        if (settings.logoAlignment === 'center') xPos = pageWidth / 2 - width / 2;
        if (settings.logoAlignment === 'right') xPos = pageWidth - width - 50;
        doc.image(logoPath, xPos, startY, { width });
        return startY + 70;
      }
    }
    return startY;
  };

  const addFooter = () => {
    const footerY = pageHeight - 80;
    doc.fontSize(8).font(fontRegular).fillColor('#6b7280');
    doc.text(settings.address || '', 50, footerY, { align: 'center', width: pageWidth - 100 });
    
    const contactInfo = [settings.phone, settings.email, settings.webAddress, settings.companyName].filter(Boolean).join(' | ');
    doc.text(contactInfo, 50, footerY + 12, { align: 'center', width: pageWidth - 100 });
    
    doc.fillColor('black');
  };

  const addSignature = (currentY: number) => {
    doc.font(fontBold).fontSize(11).text('For ' + settings.companyName, 50, currentY);
    if (settings.stamp) {
      const stampPath = path.join(process.cwd(), settings.stamp);
      if (fs.existsSync(stampPath)) {
        doc.image(stampPath, 60, currentY + 15, { width: 85 });
      }
    }
    doc.moveDown(5);
    doc.font(fontBold).text(settings.authorizedPerson || 'Authorized Signatory', 50);
    doc.fontSize(10).font(fontRegular).text(settings.authorizedDesignation || 'Director', 50);
  };

  const drawSalaryAnnexure = () => {
    doc.addPage();
    addLogo();
    doc.moveDown(1.5);
    doc.fontSize(14).font(fontBold).text('ANNEXURE - 1: COMPENSATION DETAILS', { align: 'center', underline: true });
    doc.moveDown(1);

    // ── Employee info strip ──
    const infoBoxY = doc.y;
    doc.rect(50, infoBoxY, 500, 54).fill('#f1f5f9').stroke('#cbd5e1');
    doc.fill('#000');
    const iLX = 62, iRX = 320;
    doc.fontSize(9).font(fontBold).text('Employee Name:', iLX, infoBoxY + 8);
    doc.font(fontRegular).text(app.name || '—', iLX + 105, infoBoxY + 8);
    doc.font(fontBold).text('Designation:', iLX, infoBoxY + 24);
    doc.font(fontRegular).text(app.designation || '—', iLX + 105, infoBoxY + 24);
    doc.font(fontBold).text('Department:', iLX, infoBoxY + 40);
    doc.font(fontRegular).text(app.department || '—', iLX + 105, infoBoxY + 40);
    
    doc.font(fontBold).text('Offer No:', iRX, infoBoxY + 8);
    doc.font(fontRegular).text(offerNumber, iRX + 90, infoBoxY + 8);
    doc.font(fontBold).text('Employee ID:', iRX, infoBoxY + 24);
    doc.font(fontRegular).text(app.empId || 'N/A', iRX + 90, infoBoxY + 24);
    doc.font(fontBold).text('Annual CTC:', iRX, infoBoxY + 40);
    doc.font(fontRegular).text(`INR ${app.ctc || '—'}`, iRX + 90, infoBoxY + 40);
    doc.moveDown(4.5);

    const col1 = 50, col2 = 300, col3 = 450;
    let tableY = doc.y;

    const drawHeader = (title: string, y: number) => {
      doc.rect(col1, y, 500, 24).fill('#1e293b'); // Dark header
      doc.fill('#ffffff').font(fontBold).fontSize(9).text(title, col1 + 12, y + 8);
      doc.text('Monthly (INR)', col2 + 10, y + 8);
      doc.text('Annual (INR)', col3 + 10, y + 8);
      return y + 24;
    };

    const drawRow = (label: string, monthly: number | string, annual: number | string, y: number, isBold = false, isAlt = false) => {
      if (isAlt) doc.rect(col1, y, 500, 22).fill('#f8fafc'); else doc.rect(col1, y, 500, 22).fill('#ffffff');
      doc.rect(col1, y, 500, 22).stroke('#e2e8f0');
      
      if (isBold) doc.font(fontBold).fill('#0f172a'); else doc.font(fontRegular).fill('#334155');
      doc.fontSize(9).text(label, col1 + 12, y + 7);
      doc.text(typeof monthly === 'number' ? Math.round(monthly).toLocaleString('en-IN') : monthly, col2 + 10, y + 7);
      doc.text(typeof annual === 'number' ? Math.round(annual).toLocaleString('en-IN') : annual, col3 + 10, y + 7);
      return y + 22;
    };

    tableY = drawHeader('GROSS EARNINGS (A)', tableY);
    tableY = drawRow('Basic Salary (50% of CTC)', app.basic || 0, (app.basic || 0) * 12, tableY, false, false);
    tableY = drawRow('House Rent Allowance (HRA)', app.houseRentAllowance || 0, (app.houseRentAllowance || 0) * 12, tableY, false, true);
    tableY = drawRow('Statutory Bonus', app.statutoryBonus || 0, (app.statutoryBonus || 0) * 12, tableY, false, false);
    tableY = drawRow('Special Allowance', app.specialAllowance || 0, (app.specialAllowance || 0) * 12, tableY, false, true);
    tableY = drawRow('TOTAL GROSS WAGES (A)', app.grossSalary || 0, (app.grossSalary || 0) * 12, tableY, true, false);
    
    doc.moveDown(1); tableY = doc.y;
    tableY = drawHeader("EMPLOYER'S CONTRIBUTIONS (B)", tableY);
    tableY = drawRow('Employer Provident Fund (EPF)', app.employerPf || 0, (app.employerPf || 0) * 12, tableY, false, false);
    tableY = drawRow('Employer State Insurance (ESI)', app.employerEsi || 0, (app.employerEsi || 0) * 12, tableY, false, true);
    tableY = drawRow('TOTAL CONTRIBUTIONS (B)', app.totalContribution || 0, (app.totalContribution || 0) * 12, tableY, true, false);

    doc.moveDown(1); tableY = doc.y;
    tableY = drawHeader('DEDUCTIONS & NET TAKE-HOME', tableY);
    tableY = drawRow('Employee Provident Fund (EPF)', app.providentFund || 0, (app.providentFund || 0) * 12, tableY, false, false);
    tableY = drawRow('Employee State Insurance (ESI)', app.employeeEsi || 0, (app.employeeEsi || 0) * 12, tableY, false, true);
    tableY = drawRow('Professional Tax (PT)', app.professionalTax || 0, (app.professionalTax || 0) * 12, tableY, false, false);
    tableY = drawRow('Income Tax (TDS)', app.tds || 0, (app.tds || 0) * 12, tableY, false, true);
    tableY = drawRow('TOTAL DEDUCTIONS (C)', app.totalDeduction || 0, (app.totalDeduction || 0) * 12, tableY, true, false);
    
    doc.rect(col1, tableY, 500, 32).fill('#f1f5f9').stroke('#cbd5e1');
    doc.fill('#0f172a').font(fontBold).fontSize(10).text('NET TAKE-HOME (A - C)', col1 + 12, tableY + 11);
    doc.text(Math.round(app.netTakeHome || 0).toLocaleString('en-IN'), col2 + 10, tableY + 11);
    doc.text(Math.round((app.netTakeHome || 0) * 12).toLocaleString('en-IN'), col3 + 10, tableY + 11);

    doc.moveDown(3);
    const finalY = doc.y;
    doc.rect(50, finalY, 500, 36).fill('#0f172a').stroke('#000');
    doc.fill('#ffffff').fontSize(10).font(fontBold);
    doc.text('TOTAL COST TO COMPANY (CTC = A + B)', 62, finalY + 13);
    doc.fontSize(11).text(`INR ${Math.round((app.monthlyCtc || 0) * 12).toLocaleString('en-IN')} / Annum`, 300, finalY + 13, { align: 'right', width: 240 });
    doc.fill('#000');
    addFooter();
  };

  const addLetterHeader = (title: string, date?: string | null, showOfferNo = false) => {
    addLogo();
    doc.moveDown(2);
    doc.fontSize(16).font(fontBold).text(title, { align: 'center', underline: true });
    doc.moveDown(2);
    doc.fontSize(10).font(fontRegular).text(`Date: ${formatDate(date)}`, 50);
    
    const prefix = settings.companyName?.substring(0, 3).toUpperCase() || 'TEC';
    const refYear = new Date().getFullYear();
    const refId = showOfferNo 
      ? `CMPJO/${offerNumber.replace('TW-', '')}` 
      : `HR/${app.empId || app.id.substring(0, 6).toUpperCase()}`;
    doc.text(`Ref: ${prefix}/${refId}/${refYear}`, 50);

    if (showOfferNo) {
      doc.font(fontBold).fillColor('#1d4ed8').text(`Offer No: ${offerNumber}`, 50);
      doc.fillColor('#000');
    }
    doc.moveDown();
  };

  if (type === 'certificate') {
    addLetterHeader('INTERNSHIP CERTIFICATE', app.internshipDate);
    doc.fontSize(12).font(fontBold).text('TO WHOMSOEVER IT MAY CONCERN', { align: 'center' });
    doc.moveDown(2);
    doc.fontSize(11).font(fontRegular).text(`This is to certify that `, { continued: true }).font(fontBold).text(app.name, { continued: true }).font(fontRegular).text(` has successfully completed [his/her] internship at `, { continued: true }).font(fontBold).text(settings.companyName, { continued: true }).font(fontRegular).text(` from `, { continued: true }).font(fontBold).text(app.joiningDate || '—', { continued: true }).font(fontRegular).text(` to `, { continued: true }).font(fontBold).text(app.relievingDate || '—', { continued: true }).font(fontRegular).text(`.`);
    doc.moveDown();
    doc.text(`During the internship, [he/she] held the position of `, { continued: true }).font(fontBold).text(`${app.designation || 'Intern'}`, { continued: true }).font(fontRegular).text(` and was involved in various professional projects related to the `, { continued: true }).font(fontBold).text(`${app.department || 'assigned'}`, { continued: true }).font(fontRegular).text(` department.`);
    doc.moveDown();
    doc.text(`We found [him/her] to be dedicated, punctual, and hardworking. [His/Her] contributions to the team were significant, and [he/she] exhibited a keen interest in learning and professional development. [His/Her] character and conduct during the tenure were found to be exemplary.`, { align: 'justify', lineGap: 2 });
    doc.moveDown();
    doc.text(`We wish [him/her] all the very best for all future professional endeavors.`);
    doc.moveDown(4);
    addSignature(doc.y);
    addFooter();

  } else if (type === 'experience-letter' || type === 'service-letter') {
    const title = type === 'experience-letter' ? 'EXPERIENCE CERTIFICATE' : 'SERVICE LETTER';
    addLetterHeader(title, app.experienceDate);
    doc.fontSize(12).font(fontBold).text('TO WHOMSOEVER IT MAY CONCERN', { align: 'center' });
    doc.moveDown(2);
    
    doc.fontSize(11).font(fontBold).fillColor('#1e293b');
    const metaX = 50, dataX = 180;
    doc.text('Employee Name:', metaX); doc.font(fontRegular).text(app.name, dataX, doc.y - 11);
    doc.font(fontBold).text('Employee ID:', metaX); doc.font(fontRegular).text(app.empId || 'N/A', dataX, doc.y - 11);
    doc.font(fontBold).text('Designation:', metaX); doc.font(fontRegular).text(app.designation || '—', dataX, doc.y - 11);
    doc.font(fontBold).text('Department:', metaX); doc.font(fontRegular).text(app.department || '—', dataX, doc.y - 11);
    doc.font(fontBold).text('Employment Period:', metaX); doc.font(fontRegular).text(`${app.joiningDate || '—'} to ${app.relievingDate || '—'}`, dataX, doc.y - 11);
    doc.fillColor('black').moveDown(2.5);

    doc.font(fontRegular).text(`${app.name} has been a dedicated and hardworking professional during [his/her] tenure with ${settings.companyName}. [He/She] has demonstrated a high level of integrity, technical proficiency, and a positive attitude toward [his/her] responsibilities. [His/Her] conduct during the period of employment was found to be satisfactory and professional.`, { align: 'justify', lineGap: 3 });
    doc.moveDown();
    doc.text(`We appreciate [his/her] contributions to the growth of the organization and wish [him/her] the very best in [his/her] future professional career.`);
    doc.moveDown(5);
    addSignature(doc.y);
    addFooter();

  } else if (type === 'relieving-letter') {
    addLetterHeader('RELIEVING LETTER', app.relievingDate);
    doc.fontSize(11).font(fontBold).text('To,');
    doc.text(app.name);
    doc.text(`Emp ID: ${app.empId || 'N/A'}`);
    doc.moveDown(2);

    doc.fontSize(12).font(fontBold).text(`Subject: Relieving Letter & Acceptance of Resignation`, { underline: true });
    doc.moveDown();

    doc.fontSize(11).font(fontRegular).text(`Dear ${app.name},`);
    doc.moveDown();
    doc.text(`This is with reference to your resignation letter dated ${formatDate(app.relievingDate)}. We would like to inform you that your resignation has been accepted and you are being relieved from your services as ${app.designation || 'Employee'} at ${settings.companyName} at the close of office hours on ${formatDate(app.relievingDate)}.`, { align: 'justify', lineGap: 3 });
    doc.moveDown();
    doc.text(`We confirm that you have cleared all your outstanding dues, submitted all project-related documentation, and handed over all company property in your possession to the satisfaction of the management. You have been formally relieved of all professional responsibilities and liabilities toward the organization.`, { align: 'justify', lineGap: 3 });
    doc.moveDown();
    doc.text(`We thank you for your dedicated contributions during your tenure and wish you great success in all your future professional assignments.`);
    doc.moveDown(5);
    addSignature(doc.y);
    addFooter();

  } else if (type === 'noc') {
    addLetterHeader('NO OBJECTION CERTIFICATE', app.nocDate);
    const pronoun = app.gender?.toLowerCase() === 'female' ? 'her' : 'his';
    const pronounCap = pronoun.charAt(0).toUpperCase() + pronoun.slice(1);
    const subPronoun = app.gender?.toLowerCase() === 'female' ? 'she' : 'he';

    doc.fontSize(12).font(fontBold).text('TO WHOMSOEVER IT MAY CONCERN', { align: 'center' });
    doc.moveDown(1.5);

    // Employee details table
    const nocMetaX = 50, nocDataX = 200;
    doc.fontSize(10).font(fontBold).fillColor('#1e293b');
    doc.text('Employee Name:', nocMetaX); doc.font(fontRegular).fillColor('#000').text(app.name, nocDataX, doc.y - 10);
    doc.font(fontBold).fillColor('#1e293b').text('Employee ID:', nocMetaX); doc.font(fontRegular).fillColor('#000').text(app.empId || 'N/A', nocDataX, doc.y - 10);
    doc.font(fontBold).fillColor('#1e293b').text('Designation:', nocMetaX); doc.font(fontRegular).fillColor('#000').text(app.designation || '—', nocDataX, doc.y - 10);
    doc.font(fontBold).fillColor('#1e293b').text('Department:', nocMetaX); doc.font(fontRegular).fillColor('#000').text(app.department || '—', nocDataX, doc.y - 10);
    doc.font(fontBold).fillColor('#1e293b').text('Date of Joining:', nocMetaX); doc.font(fontRegular).fillColor('#000').text(formatDate(app.joiningDate), nocDataX, doc.y - 10);
    doc.fillColor('#000').moveDown(1.5);

    doc.fontSize(11).font(fontRegular).text(`This is to certify that `, { continued: true }).font(fontBold).text(app.name, { continued: true }).font(fontRegular).text(` (Emp ID: ${app.empId || 'N/A'}) has been working with `, { continued: true }).font(fontBold).text(app.companyName || settings.companyName, { continued: true }).font(fontRegular).text(` as `, { continued: true }).font(fontBold).text(app.designation || '—', { continued: true }).font(fontRegular).text(` in the `, { continued: true }).font(fontBold).text(app.department || '—', { continued: true }).font(fontRegular).text(` department since ${formatDate(app.joiningDate)}.`);
    doc.moveDown();
    doc.font(fontRegular).text(`During the period of employment, ${pronoun} conduct and performance have been found satisfactory and up to the organizational standards. This No Objection Certificate is being issued upon ${pronounCap} specific request for the purpose of seeking employment elsewhere / pursuing higher studies. The company has no objection to the same.`, { align: 'justify', lineGap: 2 });
    doc.moveDown();
    doc.text(`We further confirm that ${app.name} has no pending liabilities, financial obligations, or unresolved disciplinary matters with the organization as of this date. ${subPronoun.charAt(0).toUpperCase() + subPronoun.slice(1)} is free to seek employment or pursue academic opportunities as ${subPronoun} deems fit.`);
    doc.moveDown(2);
    doc.text(`Place: ${settings.place || 'N/A'}`);
    doc.moveDown(4);
    addSignature(doc.y);
    addFooter();

  } else if (type === 'offer-letter' || type === 'internship-offer') {
    const isIntern = type === 'internship-offer';
    const title = isIntern ? 'INTERNSHIP OFFER LETTER' : 'OFFER LETTER';
    addLetterHeader(title, app.offerDate, true /* show offer number */);
    doc.font(fontBold).fontSize(11).text('To,');
    doc.text(app.name);
    doc.text(`Emp ID: ${app.empId || 'N/A'}`);
    doc.font(fontRegular).text(app.address || '');
    doc.text(`Contact: ${app.phone}`);
    doc.moveDown(2);
    doc.fontSize(12).font(fontBold).text(`Subject: ${title} FOR THE POSITION OF ${(app.designation || 'PROFESSIONAL').toUpperCase()}`, { align: 'center', underline: true });
    doc.moveDown(2);
    doc.fontSize(11).font(fontRegular).text(`Dear ${app.name},`);
    doc.moveDown();
    doc.text(`We are pleased to offer you the position of `, { continued: true }).font(fontBold).text(app.designation || 'Associate', { continued: true }).font(fontRegular).text(` at `, { continued: true }).font(fontBold).text(app.companyName || settings.companyName, { continued: true }).font(fontRegular).text(`. We believe that your skills and experience will be a valuable asset to our team. This offer is an invitation to join our organization and is subject to the terms outlined below.`, { align: 'justify', lineGap: 3 });
    doc.moveDown();
    doc.font(fontBold).text('Offer Summary:');
    doc.font(fontRegular);
    const computedAnnualCtc = Math.round((app.monthlyCtc || 0) * 12);
    const displayCtc = computedAnnualCtc > 0 
      ? computedAnnualCtc.toLocaleString('en-IN') 
      : (app.ctc ? Number(app.ctc.toString().replace(/,/g, '')).toLocaleString('en-IN') : '—');

    doc.list([
      `Offer Number: ${offerNumber}`,
      `Designation: ${app.designation || 'Associate'}`,
      `Proposed Joining Date: ${formatDate(app.joiningDate)}`,
      isIntern ? `Stipend: INR ${app.ctc || '—'} /Month` : `Annual CTC: INR ${displayCtc} /Annum (See Annexure-1)`,
      `Work Location: ${settings.place || 'As assigned'}`,
      `Reporting to: ${app.mentorName || 'Department Head'} — ${app.mentorDesignation || 'Senior Manager'}`,
    ], { bulletRadius: 2, textIndent: 20, lineGap: 2 });
    doc.moveDown();
    doc.text('This offer is contingent upon successful verification of your professional documents and background check. Please confirm your acceptance by signing and returning a copy of this letter within 3 working days.', { align: 'justify', lineGap: 2 });
    doc.moveDown(3);
    addSignature(doc.y);
    addFooter();
    if (!isIntern) drawSalaryAnnexure();

  } else if (type === 'appointment-letter') {
    addLetterHeader('APPOINTMENT LETTER', app.appointmentDate);
    doc.font(fontBold).text('To,');
    doc.text(app.name);
    doc.font(fontRegular).text(app.address || '');
    doc.text(`Contact: ${app.phone}`);
    doc.moveDown(2);
    doc.fontSize(12).font(fontBold).text(`Subject: FORMAL APPOINTMENT AS ${app.designation?.toUpperCase() || 'PROFESSIONAL'}`, { align: 'center', underline: true });
    doc.moveDown(2);
    doc.fontSize(11).font(fontRegular).text(`Dear ${app.name},`);
    doc.moveDown();
    doc.text(`Pursuant to your acceptance of our offer and your subsequent joining, we are pleased to formally appoint you as ${app.designation || 'Associate'} at ${app.companyName || settings.companyName} effective from ${app.joiningDate || '—'}. This document constitutes your formal employment contract with the organization.`, { align: 'justify', lineGap: 3 });
    doc.moveDown();
    doc.font(fontBold).text('Primary Terms:');
    doc.font(fontRegular);
    const computedAnnualCtc = Math.round((app.monthlyCtc || 0) * 12);
    const displayCtc = computedAnnualCtc > 0 
      ? computedAnnualCtc.toLocaleString('en-IN') 
      : (app.ctc ? Number(app.ctc.toString().replace(/,/g, '')).toLocaleString('en-IN') : '—');

    doc.list([
      `Offer Number: ${offerNumber}`,
      `Designation: ${app.designation || 'Associate'}`,
      `Department: ${app.department || 'N/A'}`,
      `Confirmed Joining Date: ${formatDate(app.joiningDate)}`,
      `Annual CTC: INR ${displayCtc} /Annum (Detailed in Annexure-1)`,
      `Work Location: ${settings.place || 'As assigned'}`,
      `Reporting to: ${app.mentorName || 'Department Head'} — ${app.mentorDesignation || 'Senior Manager'}`,
    ], { bulletRadius: 2, textIndent: 20, lineGap: 2 });
    doc.moveDown();
    doc.text('Your employment will be governed by the company’s rules and regulations and the specific terms and conditions detailed in the following pages of this contract. We look forward to a mutually productive and rewarding association.', { align: 'justify', lineGap: 2 });
    doc.moveDown(3);
    addSignature(doc.y);
    addFooter();
    drawSalaryAnnexure();
    doc.addPage(); addLogo(); doc.moveDown(1.5);
    doc.fontSize(12).font(fontBold).text('TERMS AND CONDITIONS OF EMPLOYMENT', { align: 'center', underline: true });
    doc.moveDown(1.5);
    const tc = [
      { t: '1. Probation and Confirmation:', d: 'You will be on probation for a period of six (6) months from your date of joining. During this period, your performance and conduct will be closely monitored to ensure alignment with the organization’s standards. Upon successful completion, your services will be confirmed in writing. The management reserves the right to extend the probation period if deemed necessary.' },
      { t: '2. Notice Period and Resignation:', d: 'During probation, either party may terminate this contract by providing fifteen (15) days’ written notice. Post-confirmation, a mandatory notice period of thirty (30) days is required. In the event of resignation, you must complete all pending assignments and formally hand over all company assets before being relieved.' },
      { t: '3. Confidentiality and Non-Disclosure:', d: 'During the course of your employment, you will have access to confidential information belonging to the company. You agree to maintain the highest level of confidentiality and shall not, during or after your tenure, disclose such information to any third party without prior written consent. Any breach will lead to legal action.' },
      { t: '4. Non-Compete and Non-Solicitation:', d: 'For a period of one (1) year following termination, you agree not to directly engage in any business that is in direct competition with the company. Additionally, you shall not solicit any employee, consultant, or client of the company to terminate their relationship with the organization.' },
      { t: '5. Intellectual Property Rights:', d: 'All work created or developed by you during your working hours or using company resources shall be the exclusive property of the company. You hereby assign all rights and interests in such intellectual property to the organization and agree that all such work is created as a "work for hire".' },
      { t: '6. Relieving and Experience Certificate:', d: 'A formal relieving letter and experience certificate will be issued only after successful completion of the full exit process, including handover of responsibilities and clearance of dues. If you leave without serving the full notice period, the company reserves the right to withhold these documents.' },
      { t: '7. Code of Conduct:', d: 'You are expected to adhere to the company’s policies and ethical standards. This includes maintaining professional demeanor and complying with all statutory regulations. Any behavior that brings disrepute to the company will be dealt with through disciplinary proceedings.' },
      { t: '8. Mandatory Documentation:', d: 'This appointment is contingent upon the submission of: (a) Aadhaar and PAN Card, (b) Educational certificates, (c) Relieving letters from previous employers, and (d) Last 3 months salary slips. Any discrepancy found will result in immediate termination of employment.' }
    ];
    doc.fontSize(9).font(fontRegular);
    tc.forEach((item) => {
      if (doc.y > 720) { addFooter(); doc.addPage(); addLogo(); doc.moveDown(1.5); }
      doc.font(fontBold).text(item.t, 50);
      doc.font(fontRegular).text(item.d, 60, doc.y + 1, { align: 'justify', width: 490, lineGap: 2 });
      doc.moveDown(0.8);
    });
    
    if (doc.y > 630) { addFooter(); doc.addPage(); addLogo(); doc.moveDown(1.5); }
    doc.moveDown(2);
    const finalSigY = doc.y;
    addSignature(finalSigY);
    
    // Employee Signature Block
    doc.font(fontBold).fontSize(11).text('Accepted and Agreed', 350, finalSigY);
    doc.font(fontRegular).fontSize(10).text('Employee Signature: _______________________', 350, finalSigY + 50);
    doc.text(`Name: ${app.name}`, 350, finalSigY + 70);
    doc.text(`Date: _______________________`, 350, finalSigY + 90);
    
    addFooter();

  } else if (type === 'hike-letter') {
    addLetterHeader('SALARY INCREMENT LETTER', app.hikeIssueDate);
    doc.font(fontBold).fontSize(11).text('To,');
    doc.text(app.name);
    doc.text(`Emp ID: ${app.empId || 'N/A'}`);
    doc.moveDown();
    doc.fontSize(10).font(fontBold);
    doc.text('Designation:', 50); doc.font(fontRegular).text(app.designation || '—', 150, doc.y - 10);
    doc.font(fontBold).text('Department:', 50); doc.font(fontRegular).text(app.department || '—', 150, doc.y - 10);
    doc.font(fontBold).text('Joining Date:', 50); doc.font(fontRegular).text(app.joiningDate || '—', 150, doc.y - 10);
    let yearsOfService = "—";
    if (app.joiningDate) {
      const join = new Date(app.joiningDate);
      const issue = app.hikeIssueDate ? new Date(app.hikeIssueDate) : new Date();
      if (!isNaN(join.getTime())) {
        const years = ( (issue.getTime() - join.getTime()) / (1000 * 60 * 60 * 24 * 365.25)).toFixed(1);
        yearsOfService = `${years} Year(s)`;
      }
    }
    doc.font(fontBold).text('Tenure:', 50); doc.font(fontRegular).text(yearsOfService, 150, doc.y - 10);
    doc.moveDown(2);
    doc.fontSize(12).font(fontBold).text('Subject: Notification of Salary Increment', { underline: true });
    doc.moveDown();
    doc.fontSize(11).font(fontRegular).text(`Dear ${app.name},`);
    doc.moveDown();
    doc.text(`We are pleased to inform you that, following your performance review and in recognition of your dedicated service of ${yearsOfService} with ${settings.companyName}, the management has approved an increment in your salary effective from ${app.hikeDate || 'the next payroll cycle'}.`, { align: 'justify', lineGap: 3 });
    doc.moveDown();
    const currentCtc = parseFloat(app.ctc?.toString().replace(/,/g, '') || '0');
    const hikeAmt = parseFloat(app.hikeAmount?.toString().replace(/,/g, '') || '0');
    const revisedCtc = currentCtc + hikeAmt;
    const incrementPercent = currentCtc > 0 ? ((hikeAmt / currentCtc) * 100).toFixed(2) : '0';
    doc.font(fontBold).text('Revised Compensation Details:');
    doc.font(fontRegular);
    doc.list([`Current Annual CTC: INR ${currentCtc.toLocaleString('en-IN')}`, `Increment Amount: INR ${hikeAmt.toLocaleString('en-IN')}`, `Revised Annual CTC: INR ${revisedCtc.toLocaleString('en-IN')}`, `Increment Percentage: ${incrementPercent}%`, `Effective Date: ${app.hikeDate || 'Next Payroll Cycle'}`], { bulletRadius: 2, textIndent: 20 });
    doc.moveDown();
    doc.text('We appreciate your hard work and contribution toward the growth of the organization. We look forward to your continued commitment and excellence.', { align: 'justify', lineGap: 2 });
    doc.moveDown(2);
    doc.text('Congratulations on your well-deserved hike!');
    doc.moveDown(4);
    addSignature(doc.y);
    addFooter();

  } else if (type === 'payslip') {
    addLogo();
    doc.moveDown(2);
    doc.fontSize(14).font(fontBold).text('SALARY PAYSLIP', { align: 'center' });
    doc.fontSize(10).font(fontRegular).text(`Month: ${app.payslipDate || 'N/A'}`, { align: 'center' });
    doc.moveDown();
    
    // Employee Info Box
    doc.rect(50, doc.y, 500, 95).fill('#f8fafc').stroke('#e2e8f0');
    doc.fill('#000');
    const tableTop = doc.y + 12;
    doc.fontSize(9);
    doc.font(fontBold).text('Employee Name:', 65, tableTop);
    doc.font(fontRegular).text(app.name, 160, tableTop);
    doc.font(fontBold).text('Designation:', 65, tableTop + 18);
    doc.font(fontRegular).text(app.designation || 'N/A', 160, tableTop + 18);
    doc.font(fontBold).text('Department:', 65, tableTop + 36);
    doc.font(fontRegular).text(app.department || 'N/A', 160, tableTop + 36);
    doc.font(fontBold).text('Joining Date:', 65, tableTop + 54);
    doc.font(fontRegular).text(app.joiningDate || 'N/A', 160, tableTop + 54);
    
    doc.font(fontBold).text('Employee ID:', 310, tableTop);
    doc.font(fontRegular).text(app.empId || 'N/A', 405, tableTop);
    doc.font(fontBold).text('Bank Account:', 310, tableTop + 18);
    doc.font(fontRegular).text(app.accountNumber || 'N/A', 405, tableTop + 18);
    doc.font(fontBold).text('PAN No:', 310, tableTop + 36);
    doc.font(fontRegular).text(app.pan || 'N/A', 405, tableTop + 36);
    doc.font(fontBold).text('UAN / ESI:', 310, tableTop + 54);
    doc.font(fontRegular).text(`${app.uan || 'N/A'} / ${app.esi || 'N/A'}`, 405, tableTop + 54);
    
    doc.moveDown(7.5);
    const tableYStart = doc.y;
    const colWidth = 250;
    
    // Table Header
    doc.rect(50, tableYStart, 500, 24).fill('#1e293b'); // Dark header
    doc.fill('#ffffff').font(fontBold).fontSize(9);
    doc.text('EARNINGS', 65, tableYStart + 8);
    doc.text('AMOUNT', 210, tableYStart + 8);
    doc.text('DEDUCTIONS', 320, tableYStart + 8);
    doc.text('AMOUNT', 465, tableYStart + 8);
    
    doc.font(fontRegular).fontSize(9).fill('#000');
    let rowY = tableYStart + 24;
    const rowHeight = 22;
    const earnings = [['Basic Salary', app.basic], ['HRA', app.houseRentAllowance], ['Statutory Bonus', app.statutoryBonus], ['Special Allowance', app.specialAllowance]];
    const deductions = [['Employee PF', app.providentFund], ['Employee ESI', app.employeeEsi], ['Professional Tax', app.professionalTax], ['Income Tax (TDS)', app.tds]];
    
    for (let i = 0; i < 4; i++) {
      if (i % 2 === 1) {
        doc.rect(50, rowY, colWidth, rowHeight).fill('#f8fafc');
        doc.rect(50 + colWidth, rowY, colWidth, rowHeight).fill('#f8fafc');
      }
      doc.rect(50, rowY, colWidth, rowHeight).stroke('#e2e8f0');
      doc.rect(50 + colWidth, rowY, colWidth, rowHeight).stroke('#e2e8f0');
      doc.fill('#000');
      if (earnings[i]) { doc.text(earnings[i][0].toString(), 65, rowY + 7); doc.text(Math.round(Number(earnings[i][1] || 0)).toLocaleString('en-IN'), 210, rowY + 7); }
      if (deductions[i]) { doc.text(deductions[i][0].toString(), 320, rowY + 7); doc.text(Math.round(Number(deductions[i][1] || 0)).toLocaleString('en-IN'), 465, rowY + 7); }
      rowY += rowHeight;
    }
    
    // Totals Row
    doc.rect(50, rowY, colWidth, rowHeight).fill('#f1f5f9').stroke('#cbd5e1');
    doc.rect(50 + colWidth, rowY, colWidth, rowHeight).fill('#f1f5f9').stroke('#cbd5e1');
    doc.fill('#0f172a').font(fontBold);
    doc.text('GROSS SALARY', 65, rowY + 7); doc.text(Math.round(app.grossSalary || 0).toLocaleString('en-IN'), 210, rowY + 7);
    doc.text('TOTAL DEDUCTIONS', 320, rowY + 7); doc.text(Math.round(app.totalDeduction || 0).toLocaleString('en-IN'), 465, rowY + 7);
    
    rowY += rowHeight + 15;
    const netTakeHome = Math.round(app.netTakeHome || 0);
    
    // Net Take Home Box
    doc.rect(50, rowY, 500, 55).fill('#0f172a').stroke('#000');
    doc.fill('#ffffff').font(fontBold).fontSize(11);
    doc.text('NET TAKE HOME (INR):', 70, rowY + 15);
    doc.fontSize(15).text(`INR ${netTakeHome.toLocaleString('en-IN')}`, 300, rowY + 15, { align: 'right', width: 230 });
    doc.fontSize(9).font(fontRegular).text(`Amount in words: ${numberToWords(netTakeHome)} Rupees Only`, 70, rowY + 36);
    
    doc.moveDown(4);
    doc.fontSize(8).fillColor('#6b7280').text('This is a computer-generated document and does not require a signature.', { align: 'center' });
    addFooter();
  } else {
    addLogo();
    doc.moveDown(4);
    doc.fontSize(16).font(fontBold).text(type.toUpperCase().replace('-', ' '), { align: 'center' });
    doc.moveDown(2);
    doc.font(fontRegular).text(`This is the ${type} for ${app.name}.`);
    addFooter();
  }
}
