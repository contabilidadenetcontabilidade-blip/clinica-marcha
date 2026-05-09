const fetch = require('node-fetch');

async function testEndpoints() {
    const baseUrl = 'http://localhost:3000';

    try {
        console.log('--- Teste GET /api/patients ---');
        const resPatients = await fetch(`${baseUrl}/api/patients`);
        if (resPatients.ok) {
            const data = await resPatients.json();
            console.log(`Status: ${resPatients.status}`);
            console.log(`Pacientes encontrados: ${data.length}`);
            if (data.length > 0) console.log(`Primeiro paciente: ${data[0].name}`);
        } else {
            console.error(`Erro: ${resPatients.status}`);
        }
    } catch (e) { console.error('Falha na requisição:', e.message); }

    let patientId = 1;

    try {
        console.log('\n--- Teste POST /api/agenda ---');
        const body = {
            patient_id: patientId,
            date: new Date().toISOString().split('T')[0],
            status: 'Agendado'
        };
        const resPost = await fetch(`${baseUrl}/api/agenda`, {
            method: 'POST',
            body: JSON.stringify(body),
            headers: { 'Content-Type': 'application/json' }
        });
        const dataPost = await resPost.json();
        console.log(`Status: ${resPost.status}`);
        console.log('Resposta:', dataPost);
    } catch (e) { console.error('Falha na requisição:', e.message); }

    try {
        console.log('\n--- Teste GET /api/agenda ---');
        const resAgenda = await fetch(`${baseUrl}/api/agenda`);
        if (resAgenda.ok) {
            const data = await resAgenda.json();
            console.log(`Status: ${resAgenda.status}`);
            console.log(`Agendamentos encontrados: ${data.length}`);
            if (data.length > 0) {
                const last = data[0];
                console.log(`Último agendamento: Paciente ${last.patient_name} - ${last.date} (${last.status})`);
            }
        } else {
            console.error(`Erro: ${resAgenda.status}`);
        }
    } catch (e) { console.error('Falha na requisição:', e.message); }
}

testEndpoints();
