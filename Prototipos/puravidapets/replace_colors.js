const fs = require('fs');
const path = require('path');

const directory = './src';
const replacements = [
  { search: /#FF8A18/g, replace: 'var(--color-brand-orange)' },
  { search: /#2D2D2D/g, replace: 'var(--color-brand-dark)' },
  { search: /rgba\(45,45,45,1\)/g, replace: 'rgba(76,29,3,1)' }
];

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.jsx') || fullPath.endsWith('.js') || fullPath.endsWith('.css')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let changed = false;
      for (const { search, replace } of replacements) {
        if (search.test(content)) {
          content = content.replace(search, replace);
          changed = true;
        }
      }
      if (changed) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

processDirectory(directory);
console.log('Replacement complete.');
