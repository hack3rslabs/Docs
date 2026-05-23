import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const settings = await prisma.setting.findMany();
    // Return in a format the frontend expects (it tries many keys)
    return NextResponse.json(settings);
  } catch (err) {
    console.error('❌ Get settings error:', err);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

