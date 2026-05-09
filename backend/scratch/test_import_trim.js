const xlsx = require('xlsx');

function simulate() {
  const row = { Nome: 'TestData', Pontos: '1', Motivo: '[+1 Ponto] Presença ' }; // Note the trailing space
  
  const nome = (row.Nome || '').trim();
  const pontos = parseInt(row.Pontos) || 0;
  const motivoRaw = row.Motivo || 'Importação Excel';
  const motivoTrimmed = motivoRaw.trim();
  
  console.log('Motivo Raw:', JSON.stringify(motivoRaw));
  console.log('Motivo Trimmed:', JSON.stringify(motivoTrimmed));
  console.log('Exact Match would fail?', motivoRaw !== '[+1 Ponto] Presença');
}

simulate();
