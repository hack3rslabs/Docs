import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateSalary } from '@/lib/salary-utils';
import { verifyAuth, unauthorizedResponse } from '@/lib/auth';
import { encrypt, decrypt } from '@/lib/encryption';
import fs from 'fs';
import path from 'path';

export async function GET(request: Request) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) return unauthorizedResponse();

    const applications = await prisma.application.findMany({
      where: auth.companyId ? { companyId: auth.companyId } : {},
      include: { lead: true },
      orderBy: { createdAt: 'desc' },
    });

    // Map and Decrypt sensitive fields
    const mappedApplications = applications.map(a => ({ 
      ...a, 
      _id: a.id,
      aadhar: decrypt(a.aadhar || ''),
      pan: decrypt(a.pan || ''),
      accountNumber: decrypt(a.accountNumber || ''),
    }));

    return NextResponse.json({ success: true, applications: mappedApplications });
  } catch (err: any) {
    console.error('❌ GET Applications Error:', err);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const token = formData.get('token') as string;

    if (!token) {
      return NextResponse.json({ success: false, message: 'Token is missing' }, { status: 400 });
    }

    const lead = await prisma.lead.findFirst({
      where: { applicationToken: token },
    });

    if (!lead) {
      return NextResponse.json({ success: false, message: 'Invalid or expired link' }, { status: 400 });
    }

    // Salary Calculation if CTC is provided
    let salaryData = {};
    const ctcValue = formData.get('ctc') as string;
    const pfStatus = formData.get('pfStatus') as string;
    if (ctcValue) {
      const annualCtc = parseFloat(ctcValue.replace(/,/g, ''));
      if (!isNaN(annualCtc)) {
        const optInEpf = pfStatus?.toLowerCase().trim() !== 'no';
        salaryData = calculateSalary(annualCtc, optInEpf);
      }
    }

    const uploadsDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

    const data: Record<string, string | boolean | number | null | object> = {
      lead: { connect: { id: lead.id } },
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      fatherName: formData.get('fatherName') as string,
      dob: formData.get('dob') as string,
      gender: formData.get('gender') as string,
      maritalStatus: formData.get('maritalStatus') as string,
      address: formData.get('address') as string,
      aadhar: encrypt(formData.get('aadhar') as string),
      pan: encrypt(formData.get('pan') as string),
      designation: formData.get('designation') as string,
      department: formData.get('department') as string,
      joiningDate: formData.get('joiningDate') as string,
      relievingDate: formData.get('relievingDate') as string,
      ctc: ctcValue,
      bankName: formData.get('bankName') as string,
      accountNumber: encrypt(formData.get('accountNumber') as string),
      ifsc: formData.get('ifsc') as string,
      branchName: formData.get('branchName') as string,
      uan: formData.get('uan') as string,
      esi: formData.get('esi') as string,
      pfStatus: pfStatus,
      referenceFile: formData.get('referenceFile') as string,
      experience: formData.get('experience') as string,
      education: formData.get('education') as string,
      ...salaryData,
    };

    // Handle File Uploads
    const fileFields = ['aadharFile', 'panFile', 'resume', 'bankPassbook'];
    for (const field of fileFields) {
      const file = formData.get(field) as File;
      if (file && file.size > 0) {
        const filename = `${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
        const filePath = path.join(uploadsDir, filename);
        const buffer = Buffer.from(await file.arrayBuffer());
        fs.writeFileSync(filePath, buffer);
        data[field] = filename;
      }
    }

    const application = await prisma.application.create({
      data: data as any,
    });

    // Mark lead as submitted
    await prisma.lead.update({
      where: { id: lead.id },
      data: { applicationSubmitted: true, applicationToken: null },
    });

    return NextResponse.json({ success: true, message: 'Application submitted successfully', data: application });
  } catch (err: any) {
    console.error('❌ POST Application Error:', err);
    return NextResponse.json({ success: false, message: 'Server error: ' + err.message }, { status: 500 });
  }
}
