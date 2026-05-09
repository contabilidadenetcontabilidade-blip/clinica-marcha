const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'index.js');
console.log('📝 Editando:', filePath);

let content = fs.readFileSync(filePath, 'utf8');

// Procura pela rota POST do chat
const startIdx = content.indexOf("app.post('/api/chat/house'");

if (startIdx === -1) {
  console.error('❌ Rota não encontrada!');
  process.exit(1);
}

// Encontra o fim da rota (próximo 'app.' ou 'app.get')
let braceCount = 0;
let foundFirstBrace = false;
let endIdx = startIdx;

for (let i = startIdx; i < content.length; i++) {
  if (content[i] === '{') {
    foundFirstBrace = true;
    braceCount++;
  } else if (content[i] === '}') {
    braceCount--;
    if (foundFirstBrace && braceCount === 0) {
      endIdx = i + 1;
      break;
    }
  }
}

const newRoute = `app.post('/api/chat/house', (req, res) => {
  const { house_id, patient_id, message } = req.body;

  if (!house_id || !patient_id || !message) {
    return res.status(400).json({ error: "Dados incompletos para envio." });
  }

  // ✅ VALIDAÇÃO: Verifica se patient_id existe e pertence à house_id
  db.get(
    "SELECT a.id FROM athletes a WHERE a.patient_id = ? AND a.house_id = ?",
    [patient_id, house_id],
    (err, athlete) => {
      if (err) return res.status(500).json({ error: "Erro na validação: " + err.message });
      if (!athlete) {
        return res.status(403).json({ error: "Você não pertence a esta casa." });
      }

      // Filtro de censura
      const phoneRegex = /(\\(?\\d{2}\\)?\\s?\\d{4,5}[-\\s]?\\d{4})|(\\d{10,11})/;
      const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}/;

      if (phoneRegex.test(message) || emailRegex.test(message)) {
        return res.status(403).json({ error: "CENSURA ATIVA: Contato proibido no chat." });
      }

      db.run(
        \`INSERT INTO house_messages (house_id, patient_id, message) VALUES (?, ?, ?)\`,
        [house_id, patient_id, message.trim()],
        function(err) {
          if (err) return res.status(500).json({ error: "Erro ao salvar: " + err.message });
          res.json({ success: true, id: this.lastID });
        }
      );
    }
  );
});`;

const before = content.substring(0, startIdx);
const after = content.substring(endIdx);
const newContent = before + newRoute + after;

fs.writeFileSync(filePath, newContent, 'utf8');
console.log('✅ ARQUIVO EDITADO COM SUCESSO!');