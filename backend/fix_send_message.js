const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../frontend/casa_detalhe.js');
let content = fs.readFileSync(filePath, 'utf8');

// Encontra e substitui a função sendChatMessage
const oldFunction = `async function sendChatMessage() {
      const input = document.getElementById('chat-input');
      const text = input.value.trim();
      if (!text) return;

      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      if (!currentUser.id) {
        alert('Você precisa estar logado para enviar mensagens.');
        return;
      }`;

const newFunction = `async function sendChatMessage() {
      const input = document.getElementById('chat-input');
      const text = input.value.trim();
      if (!text) return;

      const storedUser = localStorage.getItem('currentUser');
      if (!storedUser) {
        alert('Você precisa estar logado para enviar mensagens.');
        return;
      }
      
      const currentUser = JSON.parse(storedUser);`;

if (content.includes(oldFunction)) {
  content = content.replace(oldFunction, newFunction);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('✅ FUNÇÃO CORRIGIDA!');
} else {
  console.log('❌ Função não encontrada - tentando método alternativo');
}