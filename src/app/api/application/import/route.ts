import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateSalary } from '@/lib/salary-utils';
import { verifyAuth, unauthorizedResponse } from '@/lib/auth';
import { encrypt } from '@/lib/encryption';
import * as XLSX from 'xlsx';

/**
 * MAP USER EXCEL FIELDS TO DATABASE FIELDS
 */
const FIELD_MAP: Record<string, string> = {
  'Email Address': 'email',
  'PF opt Status': 'pfStatus',
  'Name of Employee ( as of Aadhar)': 'name',
  'BY Compnay': 'companyName',
  'Employee Type': 'jobType',
  'Date Of Birth': 'dob',
  'Designation': 'designation',
  'Department': 'department',
  'Gender': 'gender',
  'Mobile Number': 'phone',
  'Aadhar Number': 'aadhar',
  'PAN Number': 'pan',
  'Date Of joining': 'joiningDate',
  'Gross Salary per Month': 'monthlySalary',
  'Bank A/c No': 'accountNumber',
  'IFSC Code': 'ifsc',
  'Bank Name': 'bankName',
  'Branch Name': 'branchName',
  'Address as Of Aadhar ': 'address',
  'UAN ': 'uan',
  'ESI': 'esi',
  'Employee ID': 'empId',
  'Remarks (Office Use only)': 'remarks',
  'Date Of Relieving(Office use only)': 'relievingDate',
  'Reference': 'referenceFile',
  'Father Name  ( as of Aadhar)': 'fatherName',
  'Marital Status ': 'maritalStatus',
  'Payment': 'paymentStatus'
};

export async function POST(request: Request) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) return unauthorizedResponse();

    const formData = await request.formData();
    const file = formData.get('file') as File;

    let rawData: any[] = [];

    if (file) {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      rawData = XLSX.utils.sheet_to_json(sheet);
    } else {
      const employeesStr = formData.get('employees') as string;
      if (employeesStr) rawData = JSON.parse(employeesStr);
    }

    if (!Array.isArray(rawData) || rawData.length === 0) {
      return NextResponse.json({ success: false, message: 'No valid data found to import.' }, { status: 400 });
    }

    const results = { success: 0, failed: 0, errors: [] as string[] };

    for (const row of rawData) {
      try {
        // Map raw row to internal object
        const emp: any = {};
        Object.keys(row).forEach(key => {
          const dbKey = FIELD_MAP[key.trim()];
          if (dbKey) emp[dbKey] = row[key];
        });

        // Basic Validation
        const email = emp.email?.toString().trim();
        const phone = emp.phone?.toString().trim();
        const name = emp.name?.toString().trim();

        if (!email || !phone || !name) {
          results.failed++;
          results.errors.push(`Skipping row: Email, Phone, and Name (Aadhar) are mandatory.`);
          continue;
        }

        // Check Duplicates
        const existing = await prisma.application.findFirst({
          where: { OR: [{ email }, { phone }] }
        });

        if (existing) {
          results.failed++;
          results.errors.push(`Employee ${name} (${email}) already exists.`);
          continue;
        }

        // Salary Logic: Monthly to Annual
        let salaryData = {};
        if (emp.monthlySalary) {
          const monthly = parseFloat(emp.monthlySalary.toString().replace(/,/g, ''));
          if (!isNaN(monthly)) {
            const annual = monthly * 12;
            salaryData = calculateSalary(annual);
          }
        }

        // Create Lead
        const lead = await prisma.lead.create({
          data: {
            name,
            email,
            phone,
            applicationSubmitted: true,
            paymentAmount: 15000,
            paymentStatus: emp.paymentStatus?.toString().toLowerCase().includes('paid') ? 'Paid' : 'Pending'
          }
        });

        // Create Application
        await prisma.application.create({
          data: {
            lead: { connect: { id: lead.id } },
            name,
            email,
            phone,
            fatherName: emp.fatherName?.toString() || '',
            dob: emp.dob?.toString() || '',
            gender: emp.gender?.toString() || '',
            maritalStatus: emp.maritalStatus?.toString() || '',
            address: emp.address?.toString() || '',
            aadhar: encrypt(emp.aadhar?.toString() || ''),
            pan: encrypt(emp.pan?.toString() || ''),
            designation: emp.designation?.toString() || '',
            department: emp.department?.toString() || '',
            joiningDate: emp.joiningDate?.toString() || '',
            relievingDate: emp.relievingDate?.toString() || '',
            ctc: (parseFloat(emp.monthlySalary?.toString()) * 12).toString() || '0',
            companyName: emp.companyName?.toString() || 'Techwell',
            jobType: emp.jobType?.toString() || 'Full Time',
            empId: emp.empId?.toString() || '',
            bankName: emp.bankName?.toString() || '',
            accountNumber: encrypt(emp.accountNumber?.toString() || ''),
            ifsc: emp.ifsc?.toString() || '',
            branchName: emp.branchName?.toString() || '',
            uan: emp.uan?.toString() || '',
            esi: emp.esi?.toString() || '',
            pfStatus: emp.pfStatus?.toString() || '',
            remarks: emp.remarks?.toString() || '',
            approved: true,
            ...salaryData,
          } as any
        });

        results.success++;
      } catch (err: any) {
        results.failed++;
        results.errors.push(`Error adding ${row['Name of Employee ( as of Aadhar)']}: ${err.message}`);
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Import completed. ${results.success} success, ${results.failed} failed.`,
      results 
    });

  } catch (err: any) {
    console.error('❌ Custom Import Error:', err);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

// GET: Template Generator
export async function GET(request: Request) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) return unauthorizedResponse();

    const templateHeaders = [
      'Timestamp', 'Email Address', 'Employee Status', 'PF opt Status', 
      'Name of Employee ( as of Aadhar)', 'BY Compnay', 'Employee Type', 
      'Date Of Birth', 'Designation', 'Department', 'Gender', 'Mail ID ', 
      'Mobile Number', 'Aadhar Number', 'PAN Number', 'Date Of joining', 
      'Gross Salary per Month', 'Net credit /Month', 'Bank A/c No', 'IFSC Code', 
      'Bank Name', 'Branch Name', 'Address as Of Aadhar ', 'UAN ', 'ESI', 
      'Resume (PDF)', 'Accept Terms', 'Employee ID', 'Remarks (Office Use only)', 
      'Date Of Relieving(Office use only)', 'Reference', 'Father Name  ( as of Aadhar)', 
      'Marital Status ', 'Education & ID Proofs (PDF)', 'Payment'
    ];

    const sampleRow: Record<string, string> = {};
    templateHeaders.forEach(h => sampleRow[h] = '');
    
    // Populate Sample
    sampleRow['Name of Employee ( as of Aadhar)'] = 'John Doe';
    sampleRow['Email Address'] = 'john@example.com';
    sampleRow['Mobile Number'] = '9876543210';
    sampleRow['Gross Salary per Month'] = '50000';
    sampleRow['Employee Type'] = 'Full Time';
    sampleRow['PF opt Status'] = 'Yes';
    sampleRow['BY Compnay'] = 'Techwell';

    const workbook = XLSX.utils.book_new();
    const sheet = XLSX.utils.json_to_sheet([sampleRow], { header: templateHeaders });
    XLSX.utils.book_append_sheet(workbook, sheet, 'Employees');
    
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename=Company_Data_Sheet_Template.xlsx'
      }
    });
  } catch {
    return NextResponse.json({ success: false, message: 'Template error' }, { status: 500 });
  }
}
