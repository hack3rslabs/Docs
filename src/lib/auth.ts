import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET;

export interface AuthPayload {
  id: string;
  email: string;
  companyId?: string | null;
}

export async function verifyAuth(request: Request): Promise<AuthPayload | null> {
  if (!SECRET) {
    console.error('JWT_SECRET missing in verifyAuth');
    return null;
  }
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, SECRET) as AuthPayload;
    return decoded;
  } catch {
    return null;
  }
}

export function unauthorizedResponse() {
  return NextResponse.json({ success: false, message: 'Unauthorized access' }, { status: 401 });
}
