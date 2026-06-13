const fs = require('fs');
const path = require('path');

function walk(dir) {
  fs.readdirSync(dir).forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath);
    } else if (fullPath.endsWith('.jsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Match ðŸ and any subsequent non-ASCII characters
      let newContent = content.replace(/ðŸ[^\x00-\x7F]*/g, '');
      
      // In case there are leftover spaces like "  Complaints"
      newContent = newContent.replace(/  +/g, ' ');
      
      if (content !== newContent) {
        fs.writeFileSync(fullPath, newContent, 'utf8');
        console.log('Cleaned', file);
      }
    }
  });
}
walk(path.join(__dirname, 'frontend/src'));
