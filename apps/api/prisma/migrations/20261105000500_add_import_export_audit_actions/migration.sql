-- Distinguish data transfers from ordinary create/read events so the audit
-- centre can answer "who imported or exported this data, and when".
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'IMPORT';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'EXPORT';