-- Migration V9: Add missing authentication and relation columns
ALTER TABLE patients ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'aluno';
ALTER TABLE patients ADD COLUMN IF NOT EXISTS password TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS photo TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE athletes ADD COLUMN IF NOT EXISTS patient_id INTEGER REFERENCES patients(id);
