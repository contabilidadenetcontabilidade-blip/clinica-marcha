const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'index.js');
let content = fs.readFileSync(filePath, 'utf8');

// Remove parênteses duplicados
content = content.replace('}););', '});');

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ SINTAXE CORRIGIDA!');