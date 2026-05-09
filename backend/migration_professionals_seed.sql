INSERT INTO patients (name, email, password, role, type, active) VALUES 
('Administrador', 'admin@marcha.com.br', 'admin123', 'admin', 'Fisioterapeuta', 1),
('Fisio Teste', 'fisio@marcha.com.br', 'fisio123', 'fisio', 'Fisioterapeuta', 1)
ON CONFLICT (email) DO NOTHING;
-- Note: 'email' column often doesn't have unique constraint in basic schemas unless specified.
-- Migration V12 schema: CREATE TABLE IF NOT EXISTS patients ( ... email TEXT ... ). No unique index.
-- So we should use WHERE NOT EXISTS.

INSERT INTO patients (name, email, password, role, type, active)
SELECT 'Administrador', 'admin@marcha.com.br', 'admin123', 'admin', 'Fisioterapeuta', 1
WHERE NOT EXISTS (SELECT 1 FROM patients WHERE email = 'admin@marcha.com.br');

INSERT INTO patients (name, email, password, role, type, active)
SELECT 'Fisio Teste', 'fisio@marcha.com.br', 'fisio123', 'fisio', 'Fisioterapeuta', 1
WHERE NOT EXISTS (SELECT 1 FROM patients WHERE email = 'fisio@marcha.com.br');
