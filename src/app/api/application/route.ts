import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateSalary } from '@/lib/salary-utils';

export async function GET() {
  try {
    const applications = await prisma.application.findMany({
      include: { lead: true },
      orderBy: { createdAt: 'desc' },
    });
    // Map id to _id for frontend compatibility
    const mappedApplications = applications.map(a => ({ ...a, _id: a.id }));
    return NextResponse.json({ success: true, applications: mappedApplications });
  } catch (err) {
    console.error('❌ Get applications error:', err);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const token = formData.get('token') as string;

    if (!token) {
      return NextResponse.json({ success: false, message: 'Token is required' }, { status: 400 });
    }

    const lead = await prisma.lead.findFirst({
      where: { applicationToken: token },
    });

    if (!lead) {
      return NextResponse.json({ success: false, message: 'Invalid or expired token' }, { status: 404 });
    }

    const ctcValue = formData.get('ctc') as string;
    let salaryData = {};
    if (ctcValue) {
      const annualCtc = parseFloat(ctcValue.replace(/,/g, ''));
      if (!isNaN(annualCtc)) {
        salaryData = calculateSalary(annualCtc);
      }
    }

    const data: any = {
      leadId: lead.id,
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      fatherName: formData.get('fatherName') as string,
      dob: formData.get('dob') as string,
      gender: formData.get('gender') as string,
      maritalStatus: formData.get('maritalStatus') as string,
      address: formData.get('address') as string,
      aadhar: formData.get('aadhar') as string,
      pan: formData.get('pan') as string,
      designation: formData.get('designation') as string,
      department: formData.get('department') as string,
      joiningDate: formData.get('joiningDate') as string,
      relievingDate: formData.get('relievingDate') as string,
      ctc: ctcValue,
      bankName: formData.get('bankName') as string,
      accountNumber: formData.get('accountNumber') as string,
      ifsc: formData.get('ifsc') as string,
      branchName: formData.get('branchName') as string,
      uan: formData.get('uan') as string,
      esi: formData.get('esi') as string,
      referenceFile: formData.get('referenceFile') as string,
      ...salaryData,
    };

    // Note: Files are not handled yet in this draft (aadharFile, resume, bankPassbook, pfFile)

    const application = await prisma.application.create({
      data,
    });

    // Mark lead as submitted
    await prisma.lead.update({
      where: { id: lead.id },
      data: { applicationSubmitted: true, applicationToken: null },
    });

    return NextResponse.json({ success: true, message: 'Application submitted successfully', data: application });
  } catch (err) {
    console.error('❌ Create application error:', err);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
