-- Create banks and branches tables for Bank Management Module
CREATE TABLE IF NOT EXISTS banks (
    id SERIAL PRIMARY KEY,
    bank_name VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS branches (
    id SERIAL PRIMARY KEY,
    bank_id INTEGER NOT NULL REFERENCES banks(id) ON DELETE CASCADE,
    branch_name VARCHAR(255) NOT NULL,
    geo_limit NUMERIC NOT NULL CHECK (geo_limit > 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_branches_bank_id ON branches(bank_id);
CREATE INDEX IF NOT EXISTS idx_banks_bank_name ON banks(bank_name);

-- Comments for documentation
COMMENT ON TABLE banks IS 'Table storing bank details';
COMMENT ON COLUMN banks.bank_name IS 'Unique name of the bank';
COMMENT ON TABLE branches IS 'Table storing branches associated with banks';
COMMENT ON COLUMN branches.bank_id IS 'Foreign key referencing the parent bank';
COMMENT ON COLUMN branches.branch_name IS 'Name of the branch';
COMMENT ON COLUMN branches.geo_limit IS 'Geographic service limit in KM, must be numeric and greater than zero';
