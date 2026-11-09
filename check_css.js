const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, 'css/style.css');
const content = fs.readFileSync(cssPath, 'utf8');

// Strip comments
const stripped = content.replace(/\/\*[\s\S]*?\*\//g, '');

let openBraces = 0;
let errors = 0;
const lines = stripped.split('\n');

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  for (let j = 0; j < line.length; j++) {
    if (line[j] === '{') openBraces++;
    if (line[j] === '}') {
      openBraces--;
      if (openBraces < 0) {
        console.error(`Extra closing brace around line ${i + 1}`);
        errors++;
        openBraces = 0;
      }
    }
  }
}

if (openBraces !== 0) {
  console.error(`Unclosed braces remaining: ${openBraces}`);
  errors++;
} else {
  console.log('CSS braces are balanced!');
}

process.exit(errors > 0 ? 1 : 0);

