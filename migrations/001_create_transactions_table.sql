-- Migration: Create transactions table
-- Date: 2026-04-26
-- Description: Table for tracking income and expenses per pocket

CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    pocket_id INTEGER NOT NULL REFERENCES pockets(id) ON DELETE CASCADE,
    amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
    type VARCHAR(10) NOT NULL CHECK (type IN ('income', 'expense')),
    category VARCHAR(50),
    description TEXT,
    date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster lookups by pocket
CREATE INDEX IF NOT EXISTS idx_transactions_pocket_id ON transactions(pocket_id);

-- Index for date-based queries
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date DESC);
