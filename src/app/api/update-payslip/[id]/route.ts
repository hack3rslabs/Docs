import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth, unauthorizedResponse } from '@/lib/auth';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) return unauthorizedResponse();

    const { id } = await params;
    const { payslipDate, workingDays } = await request.json();

    const updated = await prisma.application.update({
      where: { id },
      data: { 
        payslipDate, 
        workingDays: workingDays.toString() 
      },
    });

    const mapped = { ...updated, _id: updated.id };
    return NextResponse.json({ success: true, application: mapped });
  } catch (err) {
    console.error('❌ Update payslip error:', err);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
