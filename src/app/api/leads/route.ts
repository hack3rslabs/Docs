import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth, unauthorizedResponse } from '@/lib/auth';
import crypto from 'crypto';

// GET: Fetch all leads
export async function GET(request: Request) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) return unauthorizedResponse();

    const leads = await prisma.lead.findMany({
      orderBy: { createdAt: 'desc' },
    });
    // Map id to _id for frontend compatibility
    const mappedLeads = leads.map(l => ({ ...l, _id: l.id }));
    return NextResponse.json({ success: true, leads: mappedLeads });
  } catch (err) {
    console.error('❌ Get leads error:', err);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

// POST: Create a new lead or return existing one
export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('📥 Create lead request:', body);
    const { name, email, phone, paymentAmount } = body;

    if (!name || !email || !phone) {
      return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ success: false, message: 'Invalid email format' }, { status: 400 });
    }

    // Check if lead already exists
    let lead = await prisma.lead.findFirst({
      where: {
        OR: [{ email }, { phone }],
      },
    });

    const PUBLIC_APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    if (lead) {
      const existingLink = `${PUBLIC_APP_URL}/application?token=${lead.applicationToken}`;
      return NextResponse.json({
        success: true,
        message: 'Lead already exists',
        leadId: lead.id,
        _id: lead.id, // For compatibility
        link: existingLink,
        paymentStatus: lead.paymentStatus,
        paymentAmount: lead.paymentAmount
      });
    }

    const token = crypto.randomBytes(24).toString('hex');

    lead = await prisma.lead.create({
      data: {
        name,
        email,
        phone,
        applicationToken: token,
        paymentAmount: paymentAmount ? parseFloat(paymentAmount) : 15000,
        paymentStatus: 'Pending'
      },
    });

    const link = `${PUBLIC_APP_URL}/application?token=${token}`;

    return NextResponse.json({
      success: true,
      message: 'Lead created successfully',
      leadId: lead.id,
      _id: lead.id, // For compatibility
      link,
      paymentAmount: lead.paymentAmount,
      paymentStatus: lead.paymentStatus
    }, { status: 201 });
  } catch (err: any) {
    console.error('❌ Create lead error:', err);
    
    if (err.code === 'P2002') {
      return NextResponse.json({
        success: false,
        message: 'Duplicate lead detected — email or phone already exists.',
      }, { status: 400 });
    }

    return NextResponse.json({ success: false, message: 'Server error: ' + err.message }, { status: 500 });
  }
}
