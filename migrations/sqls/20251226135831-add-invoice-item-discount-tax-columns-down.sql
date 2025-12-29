ALTER TABLE sales_invoice_items DROP COLUMN IF EXISTS discount_rate;
ALTER TABLE sales_invoice_items DROP COLUMN IF EXISTS discount_amount;
ALTER TABLE sales_invoice_items DROP COLUMN IF EXISTS tax_rate;
ALTER TABLE sales_invoice_items DROP COLUMN IF EXISTS tax_amount;
ALTER TABLE sales_invoice_items DROP COLUMN IF EXISTS net_amount;