import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth, unauthorizedResponse } from '@/lib/auth';
import { calculateSalary } from '@/lib/salary-utils';

export async function POST(request: Request) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) return unauthorizedResponse();

    const body = await request.json();
    const { applicationId, hikeAmount, hikeDate, hikeIssueDate, percentage } = body;

    if (!applicationId || !hikeAmount || !hikeDate || !hikeIssueDate) {
      return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
    }

    const application = await prisma.application.findUnique({
      where: { id: applicationId },
    });

    if (!application) {
      return NextResponse.json({ success: false, message: 'Application not found' }, { status: 404 });
    }

    if (auth.companyId && application.companyId && application.companyId !== auth.companyId) {
      return unauthorizedResponse();
    }

    const previousAnnualCtc = Math.round((application.monthlyCtc || 0) * 12) || parseFloat(application.ctc?.replace(/,/g, '') || '0');
    const newAnnualCtc = previousAnnualCtc + parseFloat(hikeAmount);
    
    if (isNaN(previousAnnualCtc) || isNaN(newAnnualCtc)) {
      return NextResponse.json({ success: false, message: 'Invalid CTC calculations' }, { status: 400 });
    }

    // Create the HikeLetter record
    const hikeLetter = await prisma.hikeLetter.create({
      data: {
        applicationId,
        hikeAmount: parseFloat(hikeAmount),
        hikeDate,
        hikeIssueDate,
        previousCtc: previousAnnualCtc,
        newCtc: newAnnualCtc,
        percentage: percentage ? parseFloat(percentage) : null,
      }
    });

    // Update the application's current CTC
    const salaryData = calculateSalary(newAnnualCtc);
    
    // Add audit log for the CTC update
    await prisma.auditLog.create({
      data: {
        applicationId,
        field: 'CTC Update (Hike)',
        oldValue: previousAnnualCtc.toString(),
        newValue: newAnnualCtc.toString(),
        modifiedBy: auth.email
      }
    });

    await prisma.application.update({
      where: { id: applicationId },
      data: {
        ctc: newAnnualCtc.toLocaleString('en-IN'),
        hikeAmount: hikeAmount.toString(),
        hikeDate,
        hikeIssueDate,
        ...salaryData
      }
    });

    return NextResponse.json({ success: true, message: 'Hike letter created successfully', hikeLetter });
  } catch (err: any) {
    console.error('❌ POST Hike Error:', err);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
