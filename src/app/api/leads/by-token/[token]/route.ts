import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const lead = await prisma.lead.findFirst({
      where: { applicationToken: token },
    });

    if (!lead) {
      return NextResponse.json(
        { success: false, message: 'Invalid or expired token' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      lead: {
        id: lead.id,
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
      },
    });
  } catch (err) {
    console.error('❌ Get lead by token error:', err);
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
}
