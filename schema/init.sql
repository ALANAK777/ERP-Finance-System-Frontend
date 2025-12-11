-- =====================================================
-- Mini ERP & Finance System Database Schema
-- For Neon DB (PostgreSQL)
-- Matches Prisma Schema
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- ENUMS
-- =====================================================

CREATE TYPE account_type AS ENUM ('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE');
CREATE TYPE entry_status AS ENUM ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE invoice_type AS ENUM ('RECEIVABLE', 'PAYABLE');
CREATE TYPE invoice_status AS ENUM ('DRAFT', 'SENT', 'PAID', 'PARTIAL', 'OVERDUE', 'CANCELLED');
CREATE TYPE project_status AS ENUM ('PLANNING', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED');
CREATE TYPE risk_level AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE cash_flow_type AS ENUM ('INFLOW', 'OUTFLOW');

-- =====================================================
-- USER MANAGEMENT TABLES
-- =====================================================

-- Roles Table
CREATE TABLE "Role" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Permissions Table
CREATE TABLE "Permission" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT
);

-- Role-Permission Junction Table
CREATE TABLE "_PermissionToRole" (
    "A" TEXT REFERENCES "Permission"(id) ON DELETE CASCADE,
    "B" TEXT REFERENCES "Role"(id) ON DELETE CASCADE,
    PRIMARY KEY ("A", "B")
);

-- Users Table
CREATE TABLE "User" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    "firstName" VARCHAR(255) NOT NULL,
    "lastName" VARCHAR(255) NOT NULL,
    "roleId" TEXT REFERENCES "Role"(id),
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audit Logs Table
CREATE TABLE "AuditLog" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userId" TEXT REFERENCES "User"(id),
    action VARCHAR(100) NOT NULL,
    entity VARCHAR(100) NOT NULL,
    "entityId" TEXT,
    details JSONB,
    "ipAddress" VARCHAR(45),
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- CHART OF ACCOUNTS (GENERAL LEDGER)
-- =====================================================

-- Accounts Table
CREATE TABLE "Account" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    type account_type NOT NULL,
    "parentId" TEXT REFERENCES "Account"(id),
    balance DECIMAL(15, 2) DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'USD',
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Journal Entries Table
CREATE TABLE "JournalEntry" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "entryNumber" VARCHAR(50) NOT NULL UNIQUE,
    date TIMESTAMP NOT NULL,
    description TEXT NOT NULL,
    status entry_status DEFAULT 'DRAFT',
    "createdById" TEXT REFERENCES "User"(id),
    "approvedAt" TIMESTAMP,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Journal Lines Table (Double-Entry)
CREATE TABLE "JournalLine" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "journalEntryId" TEXT REFERENCES "JournalEntry"(id) ON DELETE CASCADE,
    "accountId" TEXT REFERENCES "Account"(id),
    debit DECIMAL(15, 2) DEFAULT 0,
    credit DECIMAL(15, 2) DEFAULT 0,
    description TEXT
);

-- =====================================================
-- ACCOUNTS RECEIVABLE / PAYABLE
-- =====================================================

-- Vendors Table
CREATE TABLE "Vendor" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    "taxId" VARCHAR(100),
    "paymentTerms" INTEGER DEFAULT 30,
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Customers Table
CREATE TABLE "Customer" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    "taxId" VARCHAR(100),
    "creditLimit" DECIMAL(15, 2) DEFAULT 0,
    "paymentTerms" INTEGER DEFAULT 30,
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Projects Table (must be before Invoice due to FK)
CREATE TABLE "Project" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    location VARCHAR(255),
    "startDate" TIMESTAMP NOT NULL,
    "endDate" TIMESTAMP,
    budget DECIMAL(15, 2) DEFAULT 0,
    "actualCost" DECIMAL(15, 2) DEFAULT 0,
    status project_status DEFAULT 'PLANNING',
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Invoices Table
CREATE TABLE "Invoice" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "invoiceNumber" VARCHAR(50) NOT NULL UNIQUE,
    type invoice_type NOT NULL,
    "customerId" TEXT REFERENCES "Customer"(id),
    "vendorId" TEXT REFERENCES "Vendor"(id),
    "projectId" TEXT REFERENCES "Project"(id),
    "issueDate" TIMESTAMP NOT NULL,
    "dueDate" TIMESTAMP NOT NULL,
    subtotal DECIMAL(15, 2) DEFAULT 0,
    tax DECIMAL(15, 2) DEFAULT 0,
    total DECIMAL(15, 2) DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'USD',
    "exchangeRate" DECIMAL(10, 6) DEFAULT 1,
    status invoice_status DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Invoice Items Table
CREATE TABLE "InvoiceItem" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "invoiceId" TEXT REFERENCES "Invoice"(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    quantity DECIMAL(10, 2) NOT NULL DEFAULT 1,
    "unitPrice" DECIMAL(15, 2) NOT NULL,
    amount DECIMAL(15, 2) NOT NULL
);

-- Payments Table
CREATE TABLE "Payment" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "paymentNumber" VARCHAR(50) NOT NULL UNIQUE,
    "invoiceId" TEXT REFERENCES "Invoice"(id),
    "vendorId" TEXT REFERENCES "Vendor"(id),
    "customerId" TEXT REFERENCES "Customer"(id),
    amount DECIMAL(15, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    "exchangeRate" DECIMAL(10, 6) DEFAULT 1,
    "paymentDate" TIMESTAMP NOT NULL,
    "paymentMethod" VARCHAR(50),
    reference VARCHAR(100),
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- MULTI-CURRENCY
-- =====================================================

-- Exchange Rates Table
CREATE TABLE "ExchangeRate" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "fromCurrency" VARCHAR(3) NOT NULL,
    "toCurrency" VARCHAR(3) NOT NULL,
    rate DECIMAL(10, 6) NOT NULL,
    "effectiveDate" TIMESTAMP NOT NULL,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE ("fromCurrency", "toCurrency", "effectiveDate")
);

-- =====================================================
-- PROJECT MANAGEMENT
-- =====================================================

-- Project Progress Table
CREATE TABLE "ProjectProgress" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "projectId" TEXT REFERENCES "Project"(id) ON DELETE CASCADE,
    date TIMESTAMP NOT NULL,
    "plannedProgress" DECIMAL(5, 2) DEFAULT 0,
    "actualProgress" DECIMAL(5, 2) DEFAULT 0,
    notes TEXT,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Risk Logs Table
CREATE TABLE "RiskLog" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "projectId" TEXT REFERENCES "Project"(id) ON DELETE CASCADE,
    "riskScore" INTEGER NOT NULL,
    "riskLevel" risk_level NOT NULL,
    factors JSONB NOT NULL,
    "calculatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- BUDGETS
-- =====================================================

-- Budgets Table
CREATE TABLE "Budget" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name VARCHAR(255) NOT NULL,
    "fiscalYear" INTEGER NOT NULL,
    "startDate" TIMESTAMP NOT NULL,
    "endDate" TIMESTAMP NOT NULL,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Budget Items Table
CREATE TABLE "BudgetItem" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "budgetId" TEXT REFERENCES "Budget"(id) ON DELETE CASCADE,
    category VARCHAR(255) NOT NULL,
    planned DECIMAL(15, 2) DEFAULT 0,
    actual DECIMAL(15, 2) DEFAULT 0
);

-- =====================================================
-- CASH FLOW TRACKING
-- =====================================================

-- Cash Flow Table
CREATE TABLE "CashFlow" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    date TIMESTAMP NOT NULL,
    type cash_flow_type NOT NULL,
    category VARCHAR(100) NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    description TEXT,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX idx_users_email ON "User"(email);
CREATE INDEX idx_users_role ON "User"("roleId");
CREATE INDEX idx_audit_logs_user ON "AuditLog"("userId");
CREATE INDEX idx_audit_logs_entity ON "AuditLog"(entity, "entityId");
CREATE INDEX idx_accounts_type ON "Account"(type);
CREATE INDEX idx_accounts_parent ON "Account"("parentId");
CREATE INDEX idx_journal_entries_status ON "JournalEntry"(status);
CREATE INDEX idx_journal_entries_date ON "JournalEntry"(date);
CREATE INDEX idx_journal_lines_entry ON "JournalLine"("journalEntryId");
CREATE INDEX idx_journal_lines_account ON "JournalLine"("accountId");
CREATE INDEX idx_invoices_customer ON "Invoice"("customerId");
CREATE INDEX idx_invoices_vendor ON "Invoice"("vendorId");
CREATE INDEX idx_invoices_status ON "Invoice"(status);
CREATE INDEX idx_invoices_due_date ON "Invoice"("dueDate");
CREATE INDEX idx_invoices_project ON "Invoice"("projectId");
CREATE INDEX idx_payments_invoice ON "Payment"("invoiceId");
CREATE INDEX idx_payments_date ON "Payment"("paymentDate");
CREATE INDEX idx_projects_status ON "Project"(status);
CREATE INDEX idx_project_progress_project ON "ProjectProgress"("projectId");
CREATE INDEX idx_risk_logs_project ON "RiskLog"("projectId");
CREATE INDEX idx_cash_flows_date ON "CashFlow"(date);
CREATE INDEX idx_cash_flows_type ON "CashFlow"(type);
CREATE INDEX idx_exchange_rates_currencies ON "ExchangeRate"("fromCurrency", "toCurrency");

-- =====================================================
-- SEED DATA
-- =====================================================

-- Insert Permissions
INSERT INTO "Permission" (id, name, description) VALUES
    (gen_random_uuid()::text, 'users:read', 'View users'),
    (gen_random_uuid()::text, 'users:write', 'Create/Edit users'),
    (gen_random_uuid()::text, 'finance:read', 'View financial data'),
    (gen_random_uuid()::text, 'finance:write', 'Create/Edit financial data'),
    (gen_random_uuid()::text, 'projects:read', 'View projects'),
    (gen_random_uuid()::text, 'projects:write', 'Create/Edit projects');

-- Insert Roles
INSERT INTO "Role" (id, name, description) VALUES
    ('admin-role-id', 'Admin', 'Full system access'),
    ('finance-role-id', 'Finance Manager', 'Finance module access'),
    ('project-role-id', 'Project Manager', 'Project module access');

-- Link Permissions to Admin Role (all permissions)
INSERT INTO "_PermissionToRole" ("A", "B")
SELECT p.id, 'admin-role-id'
FROM "Permission" p;

-- Insert Default Admin User (password: password123)
INSERT INTO "User" (id, email, password, "firstName", "lastName", "roleId") VALUES
    (gen_random_uuid()::text, 'admin@erp.com', '$2a$10$rKN7/2sNEF1RgP1rTflD0e1iBSxp0NK7GxTGR6puqpvVpNXrQxyKm', 'Admin', 'User', 'admin-role-id'),
    (gen_random_uuid()::text, 'finance@erp.com', '$2a$10$rKN7/2sNEF1RgP1rTflD0e1iBSxp0NK7GxTGR6puqpvVpNXrQxyKm', 'Finance', 'Manager', 'finance-role-id'),
    (gen_random_uuid()::text, 'project@erp.com', '$2a$10$rKN7/2sNEF1RgP1rTflD0e1iBSxp0NK7GxTGR6puqpvVpNXrQxyKm', 'Project', 'Manager', 'project-role-id');

-- Insert Sample Chart of Accounts
INSERT INTO "Account" (id, code, name, type) VALUES
    (gen_random_uuid()::text, '1000', 'Cash', 'ASSET'),
    (gen_random_uuid()::text, '1100', 'Accounts Receivable', 'ASSET'),
    (gen_random_uuid()::text, '1200', 'Inventory', 'ASSET'),
    (gen_random_uuid()::text, '1500', 'Fixed Assets', 'ASSET'),
    (gen_random_uuid()::text, '2000', 'Accounts Payable', 'LIABILITY'),
    (gen_random_uuid()::text, '2100', 'Accrued Expenses', 'LIABILITY'),
    (gen_random_uuid()::text, '2500', 'Long-term Debt', 'LIABILITY'),
    (gen_random_uuid()::text, '3000', 'Common Stock', 'EQUITY'),
    (gen_random_uuid()::text, '3100', 'Retained Earnings', 'EQUITY'),
    (gen_random_uuid()::text, '4000', 'Construction Revenue', 'REVENUE'),
    (gen_random_uuid()::text, '4100', 'Service Revenue', 'REVENUE'),
    (gen_random_uuid()::text, '5000', 'Cost of Materials', 'EXPENSE'),
    (gen_random_uuid()::text, '5100', 'Labor Costs', 'EXPENSE'),
    (gen_random_uuid()::text, '5200', 'Equipment Rental', 'EXPENSE'),
    (gen_random_uuid()::text, '5300', 'Utilities', 'EXPENSE');

-- Insert Sample Customers
INSERT INTO "Customer" (id, code, name, email, phone, "paymentTerms", "creditLimit") VALUES
    ('cust-001', 'CUST001', 'Metro Construction Co.', 'contact@metroconstruction.com', '555-0101', 30, 500000),
    ('cust-002', 'CUST002', 'Green Building Ltd.', 'info@greenbuilding.com', '555-0102', 45, 750000),
    ('cust-003', 'CUST003', 'City Infrastructure Inc.', 'sales@cityinfra.com', '555-0103', 30, 1000000);

-- Insert Sample Vendors
INSERT INTO "Vendor" (id, code, name, email, phone, "paymentTerms") VALUES
    ('vend-001', 'VEND001', 'Steel Supply Corp', 'orders@steelsupply.com', '555-0201', 30),
    ('vend-002', 'VEND002', 'Concrete Masters', 'sales@concretemasters.com', '555-0202', 15),
    ('vend-003', 'VEND003', 'Equipment Rentals LLC', 'rentals@equiprent.com', '555-0203', 7);

-- Insert Sample Projects
INSERT INTO "Project" (id, code, name, description, location, "startDate", "endDate", budget, "actualCost", status) VALUES
    ('prj-001', 'PRJ001', 'Downtown Office Tower', 'Construction of 20-story office building', 'Downtown Business District', '2025-01-15', '2026-06-30', 15000000, 3500000, 'IN_PROGRESS'),
    ('prj-002', 'PRJ002', 'Highway Bridge Renovation', 'Renovation of Main Street bridge', 'Highway 101', '2025-03-01', '2025-12-31', 5000000, 2200000, 'IN_PROGRESS'),
    ('prj-003', 'PRJ003', 'Residential Complex Phase 1', 'Construction of 50-unit residential complex', 'Suburban Heights', '2025-06-01', '2026-12-31', 25000000, 0, 'PLANNING');

-- Insert Sample Exchange Rates
INSERT INTO "ExchangeRate" ("fromCurrency", "toCurrency", rate, "effectiveDate") VALUES
    ('USD', 'EUR', 0.92, CURRENT_TIMESTAMP),
    ('USD', 'GBP', 0.79, CURRENT_TIMESTAMP),
    ('USD', 'INR', 83.50, CURRENT_TIMESTAMP),
    ('USD', 'CAD', 1.36, CURRENT_TIMESTAMP),
    ('EUR', 'USD', 1.09, CURRENT_TIMESTAMP);

-- Insert Sample Project Progress
INSERT INTO "ProjectProgress" ("projectId", date, "plannedProgress", "actualProgress", notes) VALUES
    ('prj-001', '2025-02-01', 10, 8, 'Initial foundation work - slight delay due to weather'),
    ('prj-001', '2025-03-01', 20, 18, 'Foundation complete, structural work started'),
    ('prj-001', '2025-04-01', 30, 28, 'Catching up on schedule'),
    ('prj-002', '2025-04-01', 15, 18, 'Ahead of schedule'),
    ('prj-002', '2025-05-01', 30, 35, 'Excellent progress, favorable conditions'),
    ('prj-002', '2025-06-01', 45, 48, 'Bridge deck installation ahead of schedule');

-- Insert Sample Risk Logs
INSERT INTO "RiskLog" ("projectId", "riskScore", "riskLevel", factors, "calculatedAt") VALUES
    ('prj-001', 35, 'MEDIUM', '{"delayedInvoices": 2, "budgetOverrun": 5, "progressMismatch": 2}', '2025-03-15'),
    ('prj-001', 28, 'LOW', '{"delayedInvoices": 1, "budgetOverrun": 3, "progressMismatch": 2}', '2025-04-15'),
    ('prj-002', 15, 'LOW', '{"delayedInvoices": 0, "budgetOverrun": 0, "progressMismatch": -3}', '2025-05-01');

-- Insert Sample Cash Flow Data
INSERT INTO "CashFlow" (date, type, category, amount, description) VALUES
    (CURRENT_TIMESTAMP - INTERVAL '6 months', 'INFLOW', 'Customer Payment', 550000, 'Monthly customer payments'),
    (CURRENT_TIMESTAMP - INTERVAL '6 months', 'OUTFLOW', 'Vendor Payment', 350000, 'Monthly vendor payments'),
    (CURRENT_TIMESTAMP - INTERVAL '6 months', 'OUTFLOW', 'Salaries', 250000, 'Monthly payroll'),
    (CURRENT_TIMESTAMP - INTERVAL '5 months', 'INFLOW', 'Customer Payment', 620000, 'Monthly customer payments'),
    (CURRENT_TIMESTAMP - INTERVAL '5 months', 'OUTFLOW', 'Vendor Payment', 380000, 'Monthly vendor payments'),
    (CURRENT_TIMESTAMP - INTERVAL '5 months', 'OUTFLOW', 'Salaries', 250000, 'Monthly payroll'),
    (CURRENT_TIMESTAMP - INTERVAL '4 months', 'INFLOW', 'Customer Payment', 480000, 'Monthly customer payments'),
    (CURRENT_TIMESTAMP - INTERVAL '4 months', 'OUTFLOW', 'Vendor Payment', 320000, 'Monthly vendor payments'),
    (CURRENT_TIMESTAMP - INTERVAL '4 months', 'OUTFLOW', 'Salaries', 250000, 'Monthly payroll'),
    (CURRENT_TIMESTAMP - INTERVAL '3 months', 'INFLOW', 'Customer Payment', 590000, 'Monthly customer payments'),
    (CURRENT_TIMESTAMP - INTERVAL '3 months', 'OUTFLOW', 'Vendor Payment', 360000, 'Monthly vendor payments'),
    (CURRENT_TIMESTAMP - INTERVAL '3 months', 'OUTFLOW', 'Salaries', 250000, 'Monthly payroll'),
    (CURRENT_TIMESTAMP - INTERVAL '2 months', 'INFLOW', 'Customer Payment', 520000, 'Monthly customer payments'),
    (CURRENT_TIMESTAMP - INTERVAL '2 months', 'OUTFLOW', 'Vendor Payment', 340000, 'Monthly vendor payments'),
    (CURRENT_TIMESTAMP - INTERVAL '2 months', 'OUTFLOW', 'Salaries', 250000, 'Monthly payroll'),
    (CURRENT_TIMESTAMP - INTERVAL '1 month', 'INFLOW', 'Customer Payment', 650000, 'Monthly customer payments'),
    (CURRENT_TIMESTAMP - INTERVAL '1 month', 'OUTFLOW', 'Vendor Payment', 390000, 'Monthly vendor payments'),
    (CURRENT_TIMESTAMP - INTERVAL '1 month', 'OUTFLOW', 'Salaries', 250000, 'Monthly payroll');

-- Insert Sample Budget
INSERT INTO "Budget" (id, name, "fiscalYear", "startDate", "endDate") VALUES
    ('budget-2025', 'FY 2025 Budget', 2025, '2025-01-01', '2025-12-31');

INSERT INTO "BudgetItem" ("budgetId", category, planned, actual) VALUES
    ('budget-2025', 'Revenue', 10000000, 3200000),
    ('budget-2025', 'Salaries', 3000000, 1500000),
    ('budget-2025', 'Materials', 4000000, 1800000),
    ('budget-2025', 'Equipment', 1500000, 600000),
    ('budget-2025', 'Overhead', 500000, 200000);

-- =====================================================
-- VIEWS FOR REPORTING
-- =====================================================

-- Cash Flow Summary View
CREATE OR REPLACE VIEW vw_cash_flow_summary AS
SELECT 
    DATE_TRUNC('month', date) as month,
    SUM(CASE WHEN type = 'INFLOW' THEN amount ELSE 0 END) as total_inflow,
    SUM(CASE WHEN type = 'OUTFLOW' THEN amount ELSE 0 END) as total_outflow,
    SUM(CASE WHEN type = 'INFLOW' THEN amount ELSE -amount END) as net_cash_flow
FROM "CashFlow"
GROUP BY DATE_TRUNC('month', date)
ORDER BY month DESC;

-- Project Health Dashboard View
CREATE OR REPLACE VIEW vw_project_health AS
SELECT 
    p.id,
    p.code,
    p.name,
    p.status,
    p.budget,
    p."actualCost",
    ROUND((p."actualCost" / NULLIF(p.budget, 0)) * 100, 2) as budget_utilization,
    pp."plannedProgress",
    pp."actualProgress",
    (pp."actualProgress" - pp."plannedProgress") as progress_variance,
    CASE 
        WHEN (pp."actualProgress" - pp."plannedProgress") >= -5 
            AND (p."actualCost" / NULLIF(p.budget, 0)) <= 1.0 THEN 'ON_TRACK'
        WHEN (pp."actualProgress" - pp."plannedProgress") >= -15 
            AND (p."actualCost" / NULLIF(p.budget, 0)) <= 1.1 THEN 'WARNING'
        ELSE 'AT_RISK'
    END as health_status
FROM "Project" p
LEFT JOIN LATERAL (
    SELECT "plannedProgress", "actualProgress" 
    FROM "ProjectProgress" 
    WHERE "projectId" = p.id 
    ORDER BY date DESC 
    LIMIT 1
) pp ON true
WHERE p.status IN ('PLANNING', 'IN_PROGRESS', 'ON_HOLD');

COMMIT;
