import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { leadId, applicationLink } = await request.json();

    if (!leadId || !applicationLink) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    await prisma.lead.update({
      where: { id: leadId },
      data: { lastCopiedLink: applicationLink },
    });

    return NextResponse.json({
      success: true,
      message: 'Link stored successfully',
    });
  } catch (err) {
    console.error('❌ Store link error:', err);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
