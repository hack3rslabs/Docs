/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');

const srcDir = '../frontend/src/pages';
const destMap = {
  'Dashboard.tsx': 'src/app/(dashboard)/dashboard/page.tsx',
  'Leads.tsx': 'src/app/(dashboard)/leads/page.tsx',
  'Employee.tsx': 'src/app/(dashboard)/employee/page.tsx',
  'Settings.tsx': 'src/app/(dashboard)/settings/page.tsx',
  'Calendar.tsx': 'src/app/(dashboard)/calendar/page.tsx',
  'Tables.tsx': 'src/app/(dashboard)/tables/page.tsx',
  'Login.tsx': 'src/app/login/page.tsx',
  'ApplicationForm.tsx': 'src/app/application/page.tsx',
};

for (const [file, dest] of Object.entries(destMap)) {
  const content = fs.readFileSync(path.join(srcDir, file), 'utf-8');
  fs.writeFileSync(dest, '"use client";\n\n' + content);
}
console.log("Done");
