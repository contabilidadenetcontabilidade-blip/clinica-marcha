-- Seed Initial Appointments (if none exist)
-- This ensures the user sees something on the calendar immediately

DO $$
DECLARE
    patient_id INT;
BEGIN
    SELECT id INTO patient_id FROM patients WHERE email = 'aluno@marcha.com.br' LIMIT 1;
    
    IF patient_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM appointments WHERE appointment_date = CURRENT_DATE) THEN
            INSERT INTO appointments (patient_id, title, appointment_date, start_time, end_time, service_type, price, status, payment_method)
            VALUES 
            (patient_id, 'Pilates - Aluno Exemplo', CURRENT_DATE, '09:00', '10:00', 'Pilates', 22.39, 'agendado', 'pix'),
            (patient_id, 'Avaliação - Aluno Exemplo', CURRENT_DATE, '14:00', '15:00', 'Avaliação', 0.00, 'agendado', 'dinheiro');
        END IF;
    END IF;
END $$;
