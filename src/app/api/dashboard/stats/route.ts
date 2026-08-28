import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth, unauthorizedResponse } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) return unauthorizedResponse();

    const companyFilter = auth.companyId ? { companyId: auth.companyId } : {};

    const totalLeads = await prisma.lead.count({ where: companyFilter });
    const totalEmployees = await prisma.application.count({
      where: { approved: true, ...companyFilter }
    });
    const pendingToVerify = await prisma.application.count({
      where: { approved: false, ...companyFilter }
    });
    const totalApplications = await prisma.application.count({
      where: companyFilter
    });
    
    // Calculate total worth (Paid Registration Fees)
    const paidLeads = await prisma.lead.findMany({
      where: { paymentStatus: 'Paid', ...companyFilter },
      select: { paymentAmount: true }
    });
    
    const totalWorth = paidLeads.reduce((acc, lead) => acc + (lead.paymentAmount || 0), 0);

    // Calculate conversion percentage (Employees / Leads)
    const conversionRate = totalLeads > 0 ? Math.round((totalEmployees / totalLeads) * 100) : 0;

    // Fetch recent activities
    const recentLeads = await prisma.lead.findMany({
      where: companyFilter,
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, email: true, createdAt: true }
    });
    const recentEmployees = await prisma.application.findMany({
      where: { approved: true, ...companyFilter },
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, createdAt: true, jobType: true, email: true }
    });

    const employeeEmails = new Set(recentEmployees.map(e => e.email?.toLowerCase().trim()));

    const filteredLeads = recentLeads.filter(l => !employeeEmails.has(l.email?.toLowerCase().trim()) && !recentEmployees.some(e => e.name === l.name));

    const activities = [
      ...filteredLeads.map(l => ({ type: 'lead', name: l.name, date: l.createdAt })),
      ...recentEmployees.map(e => ({ type: 'employee', name: e.name, jobType: e.jobType, date: e.createdAt }))
    ].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 5);

    return NextResponse.json({
      success: true,
      stats: {
        totalLeads,
        totalEmployees,
        totalApplications,
        pendingToVerify,
        totalWorth,
        conversionRate,
        activities
      }
    });
  } catch (err: any) {
    console.error('❌ Dashboard stats error:', err);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
