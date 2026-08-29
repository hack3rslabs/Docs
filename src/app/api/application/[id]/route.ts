import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateSalary } from '@/lib/salary-utils';
import { verifyAuth, unauthorizedResponse } from '@/lib/auth';
import { encrypt, decrypt } from '@/lib/encryption';
import fs from 'fs';
import path from 'path';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) return unauthorizedResponse();

    const { id } = await params;
    
    if (!id || id === 'undefined') {
      console.error('❌ PUT Request: Missing or invalid ID');
      return NextResponse.json({ success: false, message: 'Invalid Application ID' }, { status: 400 });
    }

    const existingApp = await prisma.application.findUnique({ where: { id } });
    if (!existingApp) {
      return NextResponse.json({ success: false, message: 'Application not found' }, { status: 404 });
    }
    if (auth.companyId && existingApp.companyId && existingApp.companyId !== auth.companyId) {
      return unauthorizedResponse();
    }

    const contentType = request.headers.get('content-type') || '';
    const body: Record<string, string | number | boolean | File | null> = {};
    
    const uploadsDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      for (const [key, value] of formData.entries()) {
        if (value instanceof File && value.size > 0) {
          const filename = `${Date.now()}-${value.name.replace(/\s+/g, '_')}`;
          const filePath = path.join(uploadsDir, filename);
          const buffer = Buffer.from(await value.arrayBuffer());
          fs.writeFileSync(filePath, buffer);
          body[key] = filename;
        } else if (!(value instanceof File)) {
          body[key] = value as string;
        }
      }
    } else {
      const json = await request.json();
      Object.assign(body, json);
    }

    // Salary Calculation
    let salaryData = {};
    if (body.ctc) {
      const annualCtc = parseFloat(body.ctc.toString().replace(/,/g, ''));
      if (!isNaN(annualCtc)) {
        const pfStatus = body.pfStatus !== undefined ? body.pfStatus : existingApp.pfStatus;
        const optInEpf = pfStatus?.toString().toLowerCase().trim() !== 'no';
        salaryData = calculateSalary(annualCtc, optInEpf);
      }
    }

    // Data Cleaning
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { lead, createdAt, updatedAt, id: bodyId, _id, ...sanitizedBody } = body as any;

    const floatFields = [
      'basic', 'houseRentAllowance', 'statutoryBonus', 'specialAllowance', 'monthlyCtc',
      'employerEsi', 'employerPf', 'employeeEsi', 'providentFund', 'professionalTax',
      'grossSalary', 'totalContribution', 'totalDeduction', 'netTakeHome'
    ];
    
    const intFields = ['workingDays'];

    // Robust Numeric Conversion
    const finalUpdateData: Record<string, any> = {};
    
    // 1. Handle regular fields
    const stringFields = [
      'leadId', 'name', 'email', 'phone', 'fatherName', 'dob', 'gender', 
      'maritalStatus', 'address', 'aadhar', 'pan', 'aadharFile', 'resume', 
      'designation', 'department', 'joiningDate', 'relievingDate', 'ctc', 
      'companyName', 'jobType', 'mentorName', 'mentorDesignation', 
      'dateDocument', 'empId', 'bankName', 'accountNumber', 'ifsc', 
      'branchName', 'bankPassbook', 'uan', 'esi', 'pfFile', 'offerDate', 
      'appointmentDate', 'experienceDate', 'internshipDate', 'nocDate', 
      'payslipDate', 'hikeDate', 'referenceFile', 'hikeAmount', 'hikeIssueDate', 'pfStatus',
      'experience', 'education'
    ];

    stringFields.forEach(field => {
      if (sanitizedBody[field] !== undefined) {
        let value = sanitizedBody[field];
        if (value === '' || value === 'null') {
          value = null;
        } else if (['aadhar', 'pan', 'accountNumber'].includes(field)) {
          value = encrypt(value as string);
        }
        finalUpdateData[field] = value;
      }
    });

    // 2. Handle Float fields
    floatFields.forEach(field => {
      if (sanitizedBody[field] !== undefined) {
        const val = sanitizedBody[field];
        if (val === '' || val === null || val === 'null' || val === undefined) {
          finalUpdateData[field] = null;
        } else {
          const parsed = parseFloat(val.toString().replace(/,/g, ''));
          finalUpdateData[field] = isNaN(parsed) ? null : parsed;
        }
      }
    });

    // 3. Handle Int fields
    intFields.forEach(field => {
      if (sanitizedBody[field] !== undefined) {
        const val = sanitizedBody[field];
        if (val === '' || val === null || val === 'null' || val === undefined) {
          finalUpdateData[field] = null;
        } else {
          const parsed = parseInt(val.toString(), 10);
          finalUpdateData[field] = isNaN(parsed) ? null : parsed;
        }
      }
    });

    // 4. Overwrite with calculated salary data if available
    Object.assign(finalUpdateData, salaryData);

    // 5. Handle Boolean approved
    if (body.approved !== undefined) {
      finalUpdateData.approved = (body.approved === 'true' || body.approved === true);
      
      // Auto-generate Employee ID if approving and empId is missing
      if (finalUpdateData.approved && !existingApp.empId && !finalUpdateData.empId) {
        const jType = (finalUpdateData.jobType || existingApp.jobType || '').toLowerCase();
        let prefix = 'EMP';
        if (jType.includes('full time') || jType.includes('full-time')) prefix = 'FT';
        else if (jType.includes('part time') || jType.includes('part-time')) prefix = 'PT';
        else if (jType.includes('intern')) prefix = 'INT';
        else if (jType.includes('contract')) prefix = 'CT';

        const existingAppsWithPrefix = await prisma.application.findMany({
          where: { empId: { startsWith: `${prefix}-` } },
          select: { empId: true }
        });
        
        let maxNum = 1000;
        existingAppsWithPrefix.forEach(app => {
          if (app.empId) {
            const parts = app.empId.split('-');
            if (parts.length === 2) {
              const num = parseInt(parts[1], 10);
              if (!isNaN(num) && num > maxNum) {
                maxNum = num;
              }
            }
          }
        });
        
        finalUpdateData.empId = `${prefix}-${maxNum + 1}`;
      }
    }

    try {
      const auditLogs = [];
      for (const key in finalUpdateData) {
        if (finalUpdateData[key] !== (existingApp as any)[key]) {
          auditLogs.push({
            applicationId: id,
            field: key,
            oldValue: String((existingApp as any)[key] ?? ''),
            newValue: String(finalUpdateData[key] ?? ''),
            modifiedBy: auth.email
          });
        }
      }

      if (auditLogs.length > 0) {
        await prisma.auditLog.createMany({ data: auditLogs });
      }

      const updated = await prisma.application.update({
        where: { id },
        data: finalUpdateData,
      });
      return NextResponse.json({ success: true, application: updated });
    } catch (prismaErr: any) {
      console.error('❌ Prisma Update Failed:', prismaErr);
      return NextResponse.json({ 
        success: false, 
        message: 'Database update failed. Please check field types.',
        error: prismaErr.message,
      }, { status: 400 });
    }
  } catch (err: any) {
    console.error('❌ Critical Server Error:', err);
    return NextResponse.json({ success: false, message: 'Internal Server Error', details: err.message }, { status: 500 });
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) return unauthorizedResponse();

    const { id } = await params;
    const application = await prisma.application.findUnique({
      where: { id },
      include: { lead: true, auditLogs: { orderBy: { createdAt: 'desc' } }, hikeLetters: { orderBy: { createdAt: 'desc' } } }
    });

    if (!application) {
      return NextResponse.json({ success: false, message: 'Application not found' }, { status: 404 });
    }

    if (auth.companyId && application.companyId && application.companyId !== auth.companyId) {
      return unauthorizedResponse();
    }

    // Decrypt sensitive fields
    const decryptedApplication = {
      ...application,
      aadhar: decrypt(application.aadhar || ''),
      pan: decrypt(application.pan || ''),
      accountNumber: decrypt(application.accountNumber || ''),
    };

    return NextResponse.json({ success: true, application: decryptedApplication });
  } catch (err: any) {
    console.error('❌ GET Application Error:', err);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) return unauthorizedResponse();

    const { id } = await params;
    
    const existingApp = await prisma.application.findUnique({ where: { id } });
    if (!existingApp) {
      return NextResponse.json({ success: false, message: 'Application not found' }, { status: 404 });
    }
    if (auth.companyId && existingApp.companyId && existingApp.companyId !== auth.companyId) {
      return unauthorizedResponse();
    }

    // Optional: Delete associated lead as well?
    // For now just delete the application
    await prisma.application.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Application deleted successfully' });
  } catch (err: any) {
    console.error('❌ DELETE Application Error:', err);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
