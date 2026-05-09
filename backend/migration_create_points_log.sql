CREATE TABLE IF NOT EXISTS house_points_log (
    id SERIAL PRIMARY KEY,
    house_id INTEGER REFERENCES houses(id),
    student_id INTEGER REFERENCES patients(id), 
    rule_id INTEGER REFERENCES scoring_rules(id),
    points_awarded INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
