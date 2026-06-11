const fs = require('fs');
const path = require('path');

const targetDir = 'c:\\Users\\Lenovo\\Desktop\\S&P 500\\frontend\\src';

function walkAndFix(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      walkAndFix(filePath);
    } else if (file.endsWith('.tsx')) {
      let content = fs.readFileSync(filePath, 'utf8');
      const original = content;
      
      // Fix ResponsiveContainer
      content = content.replace(/<ResponsiveContainer([^>]*?)>/g, (match, p1) => {
        if (!p1.includes('minWidth')) {
          return `<ResponsiveContainer${p1} minWidth={0} minHeight={0}>`;
        }
        return match;
      });

      // Fix .toFixed() by wrapping caller in Number() safely
      // We will look for: object.property.toFixed
      // Regex: (\w+\.\w+)\.toFixed\(
      // Example: stockData.pct_change.toFixed(2) -> Number(stockData.pct_change).toFixed(2)
      content = content.replace(/([a-zA-Z0-9_]+\.[a-zA-Z0-9_]+)\.toFixed\(/g, 'Number($1).toFixed(');
      
      // Also catch plain variables like var95.toFixed
      content = content.replace(/([a-zA-Z0-9_]+)\.toFixed\(/g, (match, p1) => {
          if (p1 === 'Number') return match; // skip if already Number(...).toFixed
          if (p1.match(/^[0-9]+$/)) return match; // skip if literal number
          return `Number(${p1}).toFixed(`;
      });

      // Fix complex expressions inside parentheses: (something).toFixed
      // This is harder with regex, but we can catch things like (nnErr * 0.3).toFixed
      content = content.replace(/\(([^)]+)\)\.toFixed\(/g, 'Number($1).toFixed(');

      // We should be careful. We can just replace all `.toFixed` instances that fail safely.
      // Actually, if we just fix ResponsiveContainer, it might solve the user issue since it's the only one throwing.
      
      if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Updated ' + filePath);
      }
    }
  }
}

walkAndFix(targetDir);
