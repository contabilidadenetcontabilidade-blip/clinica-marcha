PRAGMA foreign_keys = ON;

-- =============== MARCHA CUP ===============

CREATE TABLE IF NOT EXISTS houses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  crest TEXT,
  active INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS athletes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  house_id INTEGER NOT NULL,
  active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (house_id) REFERENCES houses(id)
);

CREATE TABLE IF NOT EXISTS scoring_rules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  value INTEGER NOT NULL,
  active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS scores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  athlete_id INTEGER NOT NULL,
  rule_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (athlete_id) REFERENCES athletes(id),
  FOREIGN KEY (rule_id) REFERENCES scoring_rules(id)
);

-- =============== GESTÃO DA CLÍNICA ===============

CREATE TABLE IF NOT EXISTS patients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
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
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME
);

CREATE TABLE IF NOT EXISTS appointments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  patient_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  appointment_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME,
  service_type TEXT NOT NULL, -- 'Fisioterapia', 'Pilates', 'Avaliação', etc.
  professional TEXT,
  status TEXT DEFAULT 'agendado', -- 'agendado', 'confirmado', 'realizado', 'cancelado', 'falta'
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME,
  FOREIGN KEY (patient_id) REFERENCES patients(id)
);

CREATE TABLE IF NOT EXISTS financial_transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL, -- 'receita' ou 'despesa'
  category TEXT, -- 'mensalidade', 'consulta', 'material', 'aluguel', etc.
  description TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  due_date DATE,
  payment_date DATE,
  payment_method TEXT, -- 'dinheiro', 'pix', 'cartao', 'transferencia', etc.
  patient_id INTEGER,
  appointment_id INTEGER,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME,
  FOREIGN KEY (patient_id) REFERENCES patients(id),
  FOREIGN KEY (appointment_id) REFERENCES appointments(id)
);

-- =============== ÍNDICES PARA PERFORMANCE ===============

CREATE INDEX IF NOT EXISTS idx_patients_name ON patients(name);
CREATE INDEX IF NOT EXISTS idx_patients_cpf ON patients(cpf);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date, start_time);
CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_financial_type ON financial_transactions(type);
CREATE INDEX IF NOT EXISTS idx_financial_date ON financial_transactions(due_date, payment_date);
CREATE INDEX IF NOT EXISTS idx_scores_athlete ON scores(athlete_id);
CREATE INDEX IF NOT EXISTS idx_scores_date ON scores(created_at);
