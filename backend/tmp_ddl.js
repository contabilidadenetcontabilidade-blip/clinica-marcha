const db = require('./db');

const ddl = `
CREATE TABLE IF NOT EXISTS house_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    house_id INTEGER NOT NULL,
    sender_id INTEGER NOT NULL,
    sender_name TEXT NOT NULL,
    message TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_deleted INTEGER DEFAULT 0,
    FOREIGN KEY (house_id) REFERENCES houses(id),
    FOREIGN KEY (sender_id) REFERENCES patients(id)
);

CREATE INDEX IF NOT EXISTS idx_house_messages_house_timestamp 
ON house_messages(house_id, timestamp DESC, is_deleted);
`;

console.log("Executando DDL para Chat...");
db.exec(ddl, (err) => {
    if (err) {
        console.error("❌ ERRO:", err.message);
        process.exit(1);
    } else {
        console.log("✅ SUCESSO: Tabela e Índice criados.");
        process.exit(0);
    }
});
