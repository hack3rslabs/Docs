import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET;

export async function POST(request: Request) {
  try {
    if (!SECRET) {
      return NextResponse.json({ success: false, message: 'JWT_SECRET not configured' }, { status: 500 });
    }
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    let decoded: any;
    try {
      decoded = jwt.verify(token, SECRET);
    } catch {
      return NextResponse.json({ success: false, message: 'Invalid token' }, { status: 401 });
    }

    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ success: false, message: 'All fields are required' }, { status: 400 });
    }

    const admin = await prisma.admin.findUnique({
      where: { id: decoded.id },
    });

    if (!admin) {
      return NextResponse.json({ success: false, message: 'Admin not found' }, { status: 404 });
    }

    const isMatch = await bcrypt.compare(currentPassword, admin.password);
    if (!isMatch) {
      return NextResponse.json({ success: false, message: 'Incorrect current password' }, { status: 400 });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    await prisma.admin.update({
      where: { id: admin.id },
      data: { password: hashedNewPassword },
    });

    return NextResponse.json({ success: true, message: 'Password updated successfully' });

  } catch (err: any) {
    console.error('❌ Password Update Error:', err);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
