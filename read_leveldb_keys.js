import fs from 'fs';
import path from 'path';

// Let's find all leveldb folders
const roots = [
  'C:\\Users\\Marcelo\\AppData\\Local\\Google\\Chrome\\User Data',
  'C:\\Users\\Marcelo\\AppData\\Local\\Microsoft\\Edge\\User Data'
];

function walkDir(dir, results = []) {
  if (!fs.existsSync(dir)) return results;
  let files;
  try {
    files = fs.readdirSync(dir);
  } catch (e) {
    return results;
  }
  for (const file of files) {
    const fullPath = path.join(dir, file);
    let stat;
    try {
      stat = fs.statSync(fullPath);
    } catch (e) {
      continue;
    }
    if (stat.isDirectory()) {
      if (file === 'leveldb' && fullPath.includes('Local Storage')) {
        results.push(fullPath);
      } else {
        walkDir(fullPath, results);
      }
    }
  }
  return results;
}

function searchLevelDB(dbPath) {
  let files;
  try {
    files = fs.readdirSync(dbPath);
  } catch (e) {
    return;
  }
  files.forEach(file => {
    const filePath = path.join(dbPath, file);
    if (file.endsWith('.log') || file.endsWith('.ldb')) {
      try {
        const content = fs.readFileSync(filePath);
        if (content.includes('productos')) {
          console.log(`\nFound products cache in file: ${filePath}`);
          // Let's find any JSON array containing GAI-000300
          const contentStr = content.toString('utf8');
          // Match the products array
          const startIdx = contentStr.indexOf('[{"');
          if (startIdx !== -1) {
            // Find matching brackets
            let openBrackets = 0;
            let endIdx = -1;
            for (let i = startIdx; i < contentStr.length; i++) {
              if (contentStr[i] === '[') openBrackets++;
              else if (contentStr[i] === ']') {
                openBrackets--;
                if (openBrackets === 0) {
                  endIdx = i;
                  break;
                }
              }
            }
            if (endIdx !== -1) {
              const jsonStr = contentStr.substring(startIdx, endIdx + 1).replace(/[\x00-\x1F\x7F-\x9F]/g, '');
              try {
                const arr = JSON.parse(jsonStr);
                if (Array.isArray(arr) && arr.some(p => p.codigo === 'GAI-000300')) {
                  console.log("PRODUCTS ARRAY FOUND:");
                  arr.forEach(p => {
                    if (p.codigo === 'GAI-000300' || p.categoria === 'Leche') {
                      console.log(`  - id: "${p.id}", codigo: "${p.codigo}", descripcion: "${p.descripcion}", categoria: "${p.categoria}"`);
                    }
                  });
                }
              } catch (e) {
                // Not valid JSON, try to clean and parse
              }
            }
          }
        }
      } catch (err) {}
    }
  });
}

const dbPaths = [];
roots.forEach(root => {
  walkDir(root, dbPaths);
});

dbPaths.forEach(dbPath => {
  searchLevelDB(dbPath);
});
process.exit(0);
