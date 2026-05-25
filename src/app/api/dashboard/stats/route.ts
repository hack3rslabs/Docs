import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth, unauthorizedResponse } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) return unauthorizedResponse();

    const totalLeads = await prisma.lead.count();
    const totalEmployees = await prisma.application.count({
      where: { approved: true }
    });
    
    // Calculate total worth (Paid Registration Fees)
    const paidLeads = await prisma.lead.findMany({
      where: { paymentStatus: 'Paid' },
      select: { paymentAmount: true }
    });
    
    const totalWorth = paidLeads.reduce((acc, lead) => acc + (lead.paymentAmount || 0), 0);

    // Calculate conversion percentage (Employees / Leads)
    const conversionRate = totalLeads > 0 ? Math.round((totalEmployees / totalLeads) * 100) : 0;

    return NextResponse.json({
      success: true,
      stats: {
        totalLeads,
        totalEmployees,
        totalWorth,
        conversionRate
      }
    });
  } catch (err: any) {
    console.error('❌ Dashboard stats error:', err);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
