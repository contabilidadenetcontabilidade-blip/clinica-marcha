const xlsx = require('xlsx');
const path = require('path');

const data = [
    { Nome: "João Silva", Pontos: 15, Motivo: "Desafio Semanal - Exemplo 1", Data: new Date().toLocaleDateString('pt-BR') },
    { Nome: "Maria Souza", Pontos: 5, Motivo: "Participação em Evento - Exemplo 2", Data: new Date().toLocaleDateString('pt-BR') }
];

const worksheet = xlsx.utils.json_to_sheet(data);

// Define column widths for better readability
worksheet['!cols'] = [
    { wch: 30 }, // Nome
    { wch: 10 }, // Pontos
    { wch: 40 }, // Motivo
    { wch: 15 }  // Data
];

const workbook = xlsx.utils.book_new();
xlsx.utils.book_append_sheet(workbook, worksheet, "Pontos");

const filePath = path.join(__dirname, '../frontend/modelo_marcha_cup.xlsx');
xlsx.writeFile(workbook, filePath);

console.log(`Planilha modelo criada em: ${filePath}`);
