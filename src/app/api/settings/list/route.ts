import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth, unauthorizedResponse } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) return unauthorizedResponse();

    const settings = await prisma.setting.findMany();
    // Return in a format the frontend expects (it tries many keys)
    return NextResponse.json(settings);
  } catch (err) {
    console.error('❌ Get settings error:', err);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

