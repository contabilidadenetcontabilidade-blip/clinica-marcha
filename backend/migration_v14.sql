-- Migration V14: Fix Athletes Table (Add patient_id)
-- Critico para integracao Cadastro x Ranking

ALTER TABLE athletes ADD COLUMN IF NOT EXISTS patient_id INTEGER REFERENCES patients(id);
CREATE INDEX IF NOT EXISTS idx_athletes_patient_id ON athletes(patient_id);

-- Opcional: Garantir unicidade 1:1 entre paciente e atleta?
-- CREATE UNIQUE INDEX IF NOT EXISTS idx_athletes_patient_unique ON athletes(patient_id);
