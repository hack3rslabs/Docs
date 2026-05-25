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
    const body = await request.json();
    const { paymentStatus, paymentAmount } = body;

    const updatedLead = await prisma.lead.update({
      where: { id },
      data: {
        paymentStatus,
        paymentAmount: paymentAmount ? parseFloat(paymentAmount) : undefined
      }
    });

    return NextResponse.json({ success: true, lead: updatedLead });
  } catch (err: any) {
    console.error('❌ Update lead error:', err);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
