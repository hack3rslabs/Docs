import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth, unauthorizedResponse } from '@/lib/auth';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) return unauthorizedResponse();

    const formData = await request.formData();
    const companyName = formData.get('companyName') as string;
    const id = formData.get('_id') as string;

    const data: any = {
      companyName,
      logoAlignment: (formData.get('logoAlignment') as string) || 'left',
      address: formData.get('address') as string,
      authorizedPerson: formData.get('authorizedPerson') as string,
      authorizedDesignation: formData.get('authorizedDesignation') as string,
      purpose: formData.get('purpose') as string,
      place: formData.get('place') as string,
      phone: formData.get('phone') as string,
      email: formData.get('email') as string,
      webAddress: formData.get('webAddress') as string,
    };

    // Handle File Uploads
    const uploadsDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

    const logo = formData.get('companyLogo') as File;
    const stamp = formData.get('stamp') as File;

    if (logo && logo.size > 0) {
      const logoFilename = `${Date.now()}-${logo.name}`;
      const logoPath = path.join(uploadsDir, logoFilename);
      const buffer = Buffer.from(await logo.arrayBuffer());
      fs.writeFileSync(logoPath, buffer);
      data.companyLogo = `uploads/${logoFilename}`;
    }

    if (stamp && stamp.size > 0) {
      const stampFilename = `${Date.now()}-${stamp.name}`;
      const stampPath = path.join(uploadsDir, stampFilename);
      const buffer = Buffer.from(await stamp.arrayBuffer());
      fs.writeFileSync(stampPath, buffer);
      data.stamp = `uploads/${stampFilename}`;
    }

    if (id) {
      const updated = await prisma.company.update({
        where: { id },
        data,
      });
      return NextResponse.json({ success: true, message: 'Settings updated', data: updated });
    } else {
      // Set 1-year default subscription for newly created companies via UI
      const oneYearFromNow = new Date();
      oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
      
      data.subscriptionEnd = oneYearFromNow;

      const created = await prisma.company.create({
        data,
      });
      return NextResponse.json({ success: true, message: 'Settings created', data: created });
    }
  } catch (err) {
    console.error('❌ Save settings error:', err);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
