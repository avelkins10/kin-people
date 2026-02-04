-- Add columns to documents table for webhook events (decline, email delivery failed)

ALTER TABLE documents
ADD COLUMN IF NOT EXISTS declined_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS declined_by VARCHAR(255),
ADD COLUMN IF NOT EXISTS decline_reason TEXT,
ADD COLUMN IF NOT EXISTS delivery_failed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS delivery_failed_email VARCHAR(255);

-- Add index for declined documents
CREATE INDEX IF NOT EXISTS idx_documents_declined ON documents(declined_at) WHERE declined_at IS NOT NULL;

-- Add index for delivery failures
CREATE INDEX IF NOT EXISTS idx_documents_delivery_failed ON documents(delivery_failed_at) WHERE delivery_failed_at IS NOT NULL;
