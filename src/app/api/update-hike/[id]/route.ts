import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { hikeIssueDate, hikeAmount } = await request.json();

    const updated = await prisma.application.update({
      where: { id },
      data: { 
        hikeIssueDate, 
        hikeAmount: hikeAmount.toString() 
      },
    });

    const mapped = { ...updated, _id: updated.id };
    return NextResponse.json({ success: true, application: mapped });
  } catch (err) {
    console.error('❌ Update hike error:', err);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
