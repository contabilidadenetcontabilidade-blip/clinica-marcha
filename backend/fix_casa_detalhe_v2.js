const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../frontend/casa_detalhe.js');
console.log('📝 Removendo verificação agressiva...');

let content = fs.readFileSync(filePath, 'utf8');

// Remove a verificação que está redirecionando
const badCode = `// ✅ CARREGA USUARIO LOGADO
const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
if (!currentUser || !currentUser.id) {
  alert('Você precisa estar logado. Redirecionando...');
  window.location.href = '/login.html';
}

`;

content = content.replace(badCode, '');

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ VERIFICAÇÃO REMOVIDA!');