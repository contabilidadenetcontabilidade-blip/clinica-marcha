-- =============== MARCHA CUP ===============

CREATE TABLE IF NOT EXISTS houses (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  crest TEXT,
  active INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS athletes (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  house_id INTEGER NOT NULL REFERENCES houses(id),
  active INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS scoring_rules (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  value INTEGER NOT NULL,
  active INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS scores (
  id SERIAL PRIMARY KEY,
  athlete_id INTEGER NOT NULL REFERENCES athletes(id),
  rule_id INTEGER NOT NULL REFERENCES scoring_rules(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============== GESTÃO DA CLÍNICA ===============

CREATE TABLE IF NOT EXISTS patients (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  cpf TEXT,
  phone TEXT,
  email TEXT,
  birth_date DATE,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  emergency_contact TEXT,
  emergency_phone TEXT,
  health_insurance TEXT,
  health_insurance_number TEXT,
  notes TEXT,
  active INTEGER DEFAULT 1,
  type TEXT DEFAULT 'Paciente',
  role TEXT DEFAULT 'aluno', -- Migration column included
  password TEXT,             -- Migration column included
  photo TEXT,                -- Migration column included
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS appointments (
  id SERIAL PRIMARY KEY,
  patient_id INTEGER NOT NULL REFERENCES patients(id),
  title TEXT NOT NULL,
  description TEXT,
  appointment_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME,
  service_type TEXT NOT NULL,
  professional TEXT,
  status TEXT DEFAULT 'agendado',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS financial_transactions (
  id SERIAL PRIMARY KEY,
  type TEXT NOT NULL,
  category TEXT,
  description TEXT NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  due_date DATE,
  payment_date DATE,
  payment_method TEXT,
  patient_id INTEGER REFERENCES patients(id),
  appointment_id INTEGER REFERENCES appointments(id),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP
);

-- =============== ÍNDICES ===============

CREATE INDEX IF NOT EXISTS idx_patients_name ON patients(name);
CREATE INDEX IF NOT EXISTS idx_patients_cpf ON patients(cpf);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date, start_time);
CREATE INDEX IF NOT EXISTS idx_appointments_patient ON patients(id); -- Logic correction
CREATE INDEX IF NOT EXISTS idx_financial_type ON financial_transactions(type);
