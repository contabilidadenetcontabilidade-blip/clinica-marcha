INSERT INTO patients (name, email, phone, password, role, type, active, house_id) 
SELECT 'Aluno Exemplo', 'aluno@marcha.com.br', '(11) 99999-9999', 'aluno123', 'aluno', 'Aluno', 1, (SELECT id FROM houses WHERE name = 'Cadillac' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM patients WHERE email = 'aluno@marcha.com.br');

INSERT INTO patients (name, email, phone, password, role, type, active, house_id) 
SELECT 'Cliente Teste', 'cliente@marcha.com.br', '(11) 88888-8888', 'cliente123', 'cliente', 'Cliente', 1, NULL
WHERE NOT EXISTS (SELECT 1 FROM patients WHERE email = 'cliente@marcha.com.br');

-- Ensure Athlete Link for Aluno
INSERT INTO athletes (name, house_id, patient_id)
SELECT 'Aluno Exemplo', (SELECT id FROM houses WHERE name = 'Cadillac' LIMIT 1), (SELECT id FROM patients WHERE email = 'aluno@marcha.com.br')
WHERE NOT EXISTS (SELECT 1 FROM athletes WHERE name = 'Aluno Exemplo');
