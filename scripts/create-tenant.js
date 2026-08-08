/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const companyName = process.argv[2];
  const adminEmail = process.argv[3];
  const adminPassword = process.argv[4];

  if (!companyName || !adminEmail || !adminPassword) {
    console.log("Usage: node scripts/create-tenant.js <CompanyName> <AdminEmail> <AdminPassword>");
    process.exit(1);
  }

  // Calculate 1 year from now
  const oneYearFromNow = new Date();
  oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

  // Create Company
  const company = await prisma.company.create({
    data: { 
      companyName,
      subscriptionEnd: oneYearFromNow,
      subscriptionActive: true
    }
  });
  console.log(`✅ Company created: ${company.companyName} (ID: ${company.id})`);

  // Create Admin
  const hashedPassword = await bcrypt.hash(adminPassword, 10);
  const admin = await prisma.admin.create({
    data: {
      email: adminEmail,
      password: hashedPassword,
      companyId: company.id
    }
  });
  console.log(`✅ Admin created: ${admin.email} for Company ${company.companyName}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
