-- Add a selling price to inventory items (the New Invoice / New Bill forms need it).
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS unit_price numeric(20,2) NOT NULL DEFAULT 0;
