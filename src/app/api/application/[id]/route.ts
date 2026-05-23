import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateSalary } from '@/lib/salary-utils';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Handle both JSON and FormData
    const contentType = request.headers.get('content-type') || '';
    let body: any = {};
    
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      formData.forEach((value, key) => {
        body[key] = value;
      });
    } else {
      body = await request.json();
    }

    // Calculate Salary breakdown if CTC is present
    let salaryData = {};
    if (body.ctc) {
      const annualCtc = parseFloat(body.ctc.toString().replace(/,/g, ''));
      if (!isNaN(annualCtc)) {
        salaryData = calculateSalary(annualCtc);
      }
    }

    const updated = await prisma.application.update({
      where: { id },
      data: {
        ...body,
        ...salaryData,
        approved: body.approved !== undefined ? (body.approved === 'true' || body.approved === true) : true,
      },
    });

    return NextResponse.json({ success: true, application: updated });
  } catch (err) {
    console.error('❌ Update application error:', err);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const application = await prisma.application.findUnique({
      where: { id },
      include: { lead: true }
    });

    if (!application) {
      return NextResponse.json({ success: false, message: 'Application not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, application });
  } catch (err) {
    console.error('❌ Get application error:', err);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
