import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth, unauthorizedResponse } from '@/lib/auth';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) return unauthorizedResponse();

    const { id } = await params;
    
    // We need to delete the application
    // Note: The lead stays, but is marked as applicationSubmitted: false to allow retry?
    // Actually, usually delete means purge.
    
    const app = await prisma.application.findUnique({
        where: { id },
        include: { lead: true }
    });

    if (app && app.lead) {
        await prisma.lead.update({
            where: { id: app.lead.id },
            data: { applicationSubmitted: false }
        });
    }

    await prisma.application.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Employee record removed.' });
  } catch (err: any) {
    console.error('❌ DELETE Application Error:', err);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
