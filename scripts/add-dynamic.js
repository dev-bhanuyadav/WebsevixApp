const fs = require('fs');
const path = require('path');

const DYNAMIC_EXPORT = "export const dynamic = 'force-dynamic';\n";

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  files.forEach(f => {
    const full = path.join(dir, f);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      walkDir(full);
    } else if (f === 'route.ts') {
      let content = fs.readFileSync(full, 'utf8');
      if (!content.includes('force-dynamic')) {
        content = DYNAMIC_EXPORT + content;
        fs.writeFileSync(full, content);
        console.log('Updated:', full.replace(process.cwd() + path.sep, ''));
      }
    }
  });
}

walkDir(path.join(process.cwd(), 'app', 'api'));
console.log('Done');
