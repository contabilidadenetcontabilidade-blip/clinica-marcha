const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../frontend/casa_detalhe.js');
console.log('📝 Editando:', filePath);

let content = fs.readFileSync(filePath, 'utf8');

// Procura pelas linhas iniciais
const oldStart = `let HOUSE_ID = null;
let currentAthletes = [];
let currentRules = [];

function getHouseIdFromUrl()`;

const newStart = `let HOUSE_ID = null;
let currentAthletes = [];
let currentRules = [];

// ✅ CARREGA USUARIO LOGADO
const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
if (!currentUser || !currentUser.id) {
  alert('Você precisa estar logado. Redirecionando...');
  window.location.href = '/login.html';
}

function getHouseIdFromUrl()`;

if (content.includes(oldStart)) {
  content = content.replace(oldStart, newStart);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('✅ ARQUIVO CORRIGIDO COM SUCESSO!');
} else {
  console.log('❌ Padrão não encontrado');
}