const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

async function runTests() {
    const newStudentName = "Teste Duplo Nascimento " + Date.now();
    console.log("=== CADASTRO MANUAL ===");
    try {
        const res = await fetch('http://localhost:3000/api/patients', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: newStudentName })
        });
        const resData = await res.json();
        console.log("Cadastro Response:", res.status, resData);
        if (!res.ok) throw new Error("Cadastro falhou: " + JSON.stringify(resData));

        console.log(`\n=== IMPORTAÇÃO EXCEL ===`);
        // Create an Excel file in memory to test
        const data = [{ Nome: newStudentName, Pontos: 11, Motivo: "[+2 Pontos] Reels/Feed" }];
        const worksheet = xlsx.utils.json_to_sheet(data);
        const workbook = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(workbook, worksheet, "Pontos");

        // Write temporally
        const tmpFile = path.join(__dirname, 'test_excel.xlsx');
        xlsx.writeFile(workbook, tmpFile);

        // Create FormData manually using node built-ins or just fetch with raw binary if using fetch in Node 18+
        // Since fetch in Node doesn't always handle FormData properly without extra libs, 
        // we use a quick hack with blob/buffer or just use the local file format manually via standard HTTP.
        // Actually, Node 18+ fetch supports FormData! Let's build a FormData
        const fileBuf = fs.readFileSync(tmpFile);
        const blob = new Blob([fileBuf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const formData = new FormData();
        formData.append('file', blob, 'test_excel.xlsx');

        const impRes = await fetch('http://localhost:3000/api/admin/import-points', {
            method: 'POST',
            body: formData
        });

        const impData = await impRes.json();
        console.log("Importação Response:", impRes.status, impData);

        // Tenta limpar o DB pra não bagunçar (OPCIONAL), a ordem não exige cleanup de testes
        fs.unlinkSync(tmpFile);

    } catch (err) {
        console.error("Test Error:", err);
    }
}

// Since fetch API has FormData in Node 18+:
runTests();
