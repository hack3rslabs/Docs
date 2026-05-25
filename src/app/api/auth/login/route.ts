import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET;
if (!SECRET) {
  throw new Error('JWT_SECRET is not defined in environment variables');
}

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    console.log(`🔑 Login attempt for: "${email}" (Length: ${email?.length})`);
    console.log(`📏 Password Length provided: ${password?.length}`);

    if (!email || !password) {
      console.log('⚠️ Missing email or password');
      return NextResponse.json(
        { success: false, message: 'Email and password are required' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    console.log(`📧 Normalized Email: "${normalizedEmail}"`);

    const admin = await prisma.admin.findUnique({
      where: { email: normalizedEmail },
    });

    if (!admin) {
      console.log(`❌ Admin not found for email: ${normalizedEmail}`);
      return NextResponse.json(
        { success: false, message: 'Invalid credentials' },
        { status: 400 }
      );
    }

    console.log('🔍 Found admin, comparing passwords...');
    const isMatch = await bcrypt.compare(password, admin.password);
    console.log(`📊 Bcrypt result: ${isMatch}`);

    if (!isMatch) {
      console.log('❌ Password mismatch');
      return NextResponse.json(
        { success: false, message: 'Invalid credentials' },
        { status: 400 }
      );
    }

    if (!SECRET) {
      console.error('🔥 JWT_SECRET is missing during sign phase!');
      return NextResponse.json({ success: false, message: 'Server configuration error' }, { status: 500 });
    }

    console.log('🎟️ Generating token...');
    const token = jwt.sign({ id: admin.id, email: admin.email }, SECRET, {
      expiresIn: '1d',
    });

    console.log('✅ Login successful');
    return NextResponse.json({
      success: true,
      message: 'Login successful',
      token,
      admin: { email: admin.email },
    });
  } catch (err: any) {
    console.error('❌ Critical Login error:', err.message);
    return NextResponse.json(
      { success: false, message: 'Server error: ' + err.message },
      { status: 500 }
    );
  }
}
