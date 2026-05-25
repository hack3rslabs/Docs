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
    const { type, date } = await request.json();

    const fieldMap: { [key: string]: string } = {
      'offer-letter': 'offerDate',
      'appointment-letter': 'appointmentDate',
      'experience-letter': 'experienceDate',
      'noc': 'nocDate',
      'certificate': 'internshipDate',
    };

    const field = fieldMap[type];
    if (!field) {
      return NextResponse.json({ success: false, message: 'Invalid document type' }, { status: 400 });
    }

    const updated = await prisma.application.update({
      where: { id },
      data: { [field]: date },
    });

    // Map id to _id for frontend
    const mapped = { ...updated, _id: updated.id };

    return NextResponse.json({ success: true, application: mapped });
  } catch (err) {
    console.error('❌ Update document date error:', err);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
