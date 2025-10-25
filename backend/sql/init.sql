CREATE TABLE IF NOT EXISTS metrics (
  id SERIAL PRIMARY KEY,
  category VARCHAR(100),
  priority VARCHAR(50),
  time_taken INTEGER,
  sla_breached BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);
