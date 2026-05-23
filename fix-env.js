const fs = require('fs');
const path = require('path');

function replaceInDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      replaceInDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('import.meta.env')) {
        content = content.replace(/import\.meta\.env\.VITE_API_BASE/g, '(process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000/api")');
        content = content.replace(/import\.meta\.env\.PUBLIC_APP_URL/g, 'process.env.NEXT_PUBLIC_APP_URL');
        fs.writeFileSync(fullPath, content);
      }
    }
  }
}
replaceInDir('src');
console.log('done');
