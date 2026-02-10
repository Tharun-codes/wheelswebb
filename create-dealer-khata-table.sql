-- Create dealer_khata table for points system
CREATE TABLE IF NOT EXISTS dealer_khata (
    id SERIAL PRIMARY KEY,
    dealer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    points INTEGER NOT NULL CHECK (points > 0),
    type VARCHAR(10) NOT NULL CHECK (type IN ('credit', 'debit')),
    reason TEXT NOT NULL,
    created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_dealer_khata_dealer_id ON dealer_khata(dealer_id);
CREATE INDEX IF NOT EXISTS idx_dealer_khata_created_by ON dealer_khata(created_by);
CREATE INDEX IF NOT EXISTS idx_dealer_khata_created_at ON dealer_khata(created_at);

-- Add comments for documentation
COMMENT ON TABLE dealer_khata IS 'Points system for dealers - tracks credit and debit transactions';
COMMENT ON COLUMN dealer_khata.dealer_id IS 'Foreign key to users table - dealer who receives/uses points';
COMMENT ON COLUMN dealer_khata.points IS 'Number of points in this transaction (must be positive)';
COMMENT ON COLUMN dealer_khata.type IS 'Transaction type: credit (admin gives) or debit (dealer redeems)';
COMMENT ON COLUMN dealer_khata.reason IS 'Description of why points were credited or redeemed';
COMMENT ON COLUMN dealer_khata.created_by IS 'User who initiated this transaction (admin for credit, dealer for debit)';
COMMENT ON COLUMN dealer_khata.created_at IS 'Timestamp when transaction was created';
