const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, '../database.sqlite');
const db = new sqlite3.Database(dbPath);

const athletesList = [
    { name: "AIRTON RODOLFO NASCIMENTO", house: "CHAIR" },
    { name: "ALEXANDRE AUGUSTO PEREIRA NUNES", house: "JOSEPH" },
    { name: "AMANDA MARTINEZ TORRES", house: "REFORMER" },
    { name: "AMANDA YOKOTA", house: "JOSEPH" },
    { name: "ANA CAROLINA NASCIMENTO NOBREGA", house: "BARREL" },
    { name: "ANA CLARA RAMOS BERNARDO", house: "CADILLAC" },
    { name: "ANA CLAUDIA RIBEIRO", house: "JOSEPH" },
    { name: "ANA HELOISA DE REZENDE EICK", house: "REFORMER" },
    { name: "ANDREA SILVA DOS SANTOS", house: "BARREL" },
    { name: "BRUNA YOKOTA", house: "JOSEPH" },
    { name: "BRUNO RODRIGUES", house: "CHAIR" },
    { name: "CARLA ALVES", house: "BARREL" },
    { name: "CIRO NOGUEIRA", house: "CADILLAC" },
    { name: "DANIELA MIYUKI NAKAJIMA", house: "REFORMER" },
    { name: "DANIELA NUNES", house: "JOSEPH" },
    { name: "DEBORA PINHEIRO FELIX", house: "CADILLAC" },
    { name: "DIANA SILVA", house: "REFORMER" },
    { name: "EDILSON VASCONCELOS", house: "REFORMER" },
    { name: "EMILLY ALVES DE SOUZA", house: "BARREL" },
    { name: "EVELYN DE ALMEIDA BERNARDO", house: "CADILLAC" },
    { name: "FABIO RODRIGUES LIMA", house: "REFORMER" },
    { name: "FATIMA RASERA", house: "BARREL" },
    { name: "GABRIELA DE ALMEIDA BRITO", house: "JOSEPH" },
    { name: "GABRIELA GONCALVES SANTOS", house: "CADILLAC" },
    { name: "GABRIELA RENATA MONTEIRO NASCIMENTO", house: "CHAIR" },
    { name: "GABRIELA SOUZA BOMFIM", house: "CHAIR" },
    { name: "GABRIELE DA SILVA OLIVEIRA", house: "CADILLAC" },
    { name: "GIULIANA TREFIGLIO ROCHA", house: "CHAIR" },
    { name: "INGRA ALBARELLO DUARTE", house: "REFORMER" },
    { name: "ISABELA RENATA", house: "CHAIR" },
    { name: "ISADORA TEIXEIRA BORGES", house: "CADILLAC" },
    { name: "JOANA GONCALVES DOS SANTOS", house: "CADILLAC" },
    { name: "JOAO FILIPE RENO PEIXOTO DE AZEVEDO SILVA", house: "JOSEPH" },
    { name: "JOCIANA ULBRICH BUENO BILL", house: "JOSEPH" },
    { name: "JULIA MARIA PIETRACATELLI PEREIRA", house: "CADILLAC" },
    { name: "KAREN HARUKA KOIKE", house: "JOSEPH" },
    { name: "KIRIAN LAIS DE CARVALHO SANTOS", house: "BARREL" },
    { name: "LUCIANA LIMA FONSECA ALONSO", house: "CHAIR" },
    { name: "LUZIA VIEIRA DE OLIVEIRA", house: "CADILLAC" },
    { name: "MARCIA BARBOZA", house: "CADILLAC" },
    { name: "MARINA GRANDCHAMP COSTA", house: "REFORMER" },
    { name: "MARINA KAMOEI", house: "BARREL" },
    { name: "MATHEUS COELHO GONCALVES", house: "CADILLAC" },
    { name: "MATHEUS VINICIUS FERRAZ", house: "REFORMER" },
    { name: "NATALIA SANTOS", house: "JOSEPH" },
    { name: "PAULO H BARCELOS", house: "BARREL" },
    { name: "PRISCILA RODRIGUES", house: "CHAIR" },
    { name: "RAFAELA GONCALVES SANTOS", house: "CADILLAC" },
    { name: "RAFAELA MARTINS", house: "CADILLAC" },
    { name: "RAISSA CAETANO", house: "BARREL" },
    { name: "RAPHAEL TREFIGLIO ROCHA", house: "CHAIR" },
    { name: "RAYSSA BAZILIO", house: "JOSEPH" },
    { name: "RENAN PACHECO", house: "REFORMER" },
    { name: "ROBERTA SIQUEIRA MONTEIRO NASCIMENTO", house: "CHAIR" },
    { name: "RODRIGO SILVA", house: "CADILLAC" },
    { name: "RONALDO PIRES DE ALMEIDA", house: "BARREL" },
    { name: "ROSANA LIMA", house: "BARREL" },
    { name: "SAMUEL ROCHA DA SILVA", house: "REFORMER" },
    { name: "THALITA PIMENTA CANCAS", house: "BARREL" },
    { name: "VALTER KAMOEI", house: "BARREL" },
    { name: "VANESSA MULLER PASQUALETTO", house: "BARREL" },
    { name: "FABIANA", house: "BARREL" },
    { name: "IASMIN", house: "BARREL" },
    { name: "FELIPE EVELYN", house: "CADILLAC" },
    { name: "FELIPE JU", house: "JOSEPH" },
    { name: "JULIANA SOUZA", house: "JOSEPH" },
    { name: "CAROL TREFIGLIO", house: "CHAIR" },
    { name: "BELINHA KOT", house: "CADILLAC" }
];

const houseMap = {
    "JOSEPH": 1,
    "CADILLAC": 2, // No banco está "Cadilac"
    "REFORMER": 3,
    "BARREL": 4,
    "CHAIR": 5
};

function normalizeName(name) {
    if (!name) return "";
    return name
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toUpperCase()
        .trim();
}

async function ingest() {
    console.log(`Iniciando ingestão de ${athletesList.length} registros...`);
    let processedCount = 0;
    let skipCount = 0;

    for (const item of athletesList) {
        const normalizedName = normalizeName(item.name);
        const houseId = houseMap[item.house];

        if (!houseId) {
            console.error(`Casa não encontrada para: ${item.name} (${item.house})`);
            continue;
        }

        try {
            // Verifica se já existe em patients
            const existingPatient = await new Promise((resolve, reject) => {
                db.get("SELECT id FROM patients WHERE name = ?", [normalizedName], (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                });
            });

            let patientId;
            if (existingPatient) {
                patientId = existingPatient.id;
                console.log(`Paciente já existe: ${normalizedName} (ID: ${patientId})`);
            } else {
                // Insere em patients
                patientId = await new Promise((resolve, reject) => {
                    db.run(
                        "INSERT INTO patients (name, house_id, type, active) VALUES (?, ?, ?, 1)",
                        [normalizedName, houseId, 'Aluno'],
                        function(err) {
                            if (err) reject(err);
                            else resolve(this.lastID);
                        }
                    );
                });
                console.log(`Paciente inserido: ${normalizedName} (ID: ${patientId})`);
            }

            // Verifica se já existe em athletes (opcional, mas bom para evitar duplicidade no relacionamento)
            const existingAthlete = await new Promise((resolve, reject) => {
                db.get("SELECT id FROM athletes WHERE patient_id = ?", [patientId], (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                });
            });

            if (existingAthlete) {
                console.log(`Atleta já vinculado em athletes: ${normalizedName}`);
                skipCount++;
            } else {
                // Insere em athletes
                await new Promise((resolve, reject) => {
                    db.run(
                        "INSERT INTO athletes (name, house_id, patient_id, active) VALUES (?, ?, ?, 1)",
                        [normalizedName, houseId, patientId],
                        (err) => {
                            if (err) reject(err);
                            else resolve();
                        }
                    );
                });
                console.log(`Atleta vinculado: ${normalizedName}`);
                processedCount++;
            }
        } catch (error) {
            console.error(`Erro ao processar ${normalizedName}:`, error.message);
        }
    }

    console.log("\n--- RESULTADO FINAL ---");
    console.log(`Total na lista: ${athletesList.length}`);
    console.log(`Processados (Novos vínculos): ${processedCount}`);
    console.log(`Pulados (Já existentes): ${skipCount}`);
    console.log(`Total de registros tratados: ${processedCount + skipCount}`);
    
    db.close();
}

ingest();
