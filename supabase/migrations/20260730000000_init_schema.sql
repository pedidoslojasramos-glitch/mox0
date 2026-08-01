-- =============================================================================
-- SUPABASE MIGRATION: LOGÍSTICA & DEPOSITOS - LOJAS RAMOS / RAMOX
-- Created: 2026-07-30
-- Target: Supabase (PostgreSQL 15+)
-- =============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- 1. ENUMS & CONSTANTS
-- =============================================================================

CREATE TYPE user_role AS ENUM ('admin', 'branch', 'logistics');

CREATE TYPE po_status AS ENUM ('pending', 'approved', 'checked', 'received');

CREATE TYPE order_status AS ENUM (
  'pending',
  'approved',
  'rejected',
  'picking',
  'picked',
  'invoiced',
  'loading',
  'shipped',
  'delivered',
  'discrepancy'
);

CREATE TYPE inventory_count_status AS ENUM ('pending', 'completed');

-- =============================================================================
-- 2. CORE TABLES
-- =============================================================================

-- Filiais (Branches)
CREATE TABLE IF NOT EXISTS public.branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  location TEXT,
  manager TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fornecedores (Suppliers)
CREATE TABLE IF NOT EXISTS public.suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  cnpj TEXT,
  contact TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Usuários (Users Profile)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role user_role NOT NULL DEFAULT 'branch',
  branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Produtos (Products)
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL DEFAULT 'Geral',
  unit TEXT NOT NULL DEFAULT 'un',
  price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  current_stock INT NOT NULL DEFAULT 0,
  min_stock INT NOT NULL DEFAULT 0,
  image TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Limites de Filial (Branch Limits & Budgets)
CREATE TABLE IF NOT EXISTS public.branch_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID UNIQUE NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  max_order_budget NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  product_monthly_limits JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pedidos de Compra (Purchase Orders)
CREATE TABLE IF NOT EXISTS public.purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_code TEXT UNIQUE,
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  status po_status NOT NULL DEFAULT 'pending',
  total_value NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pedidos de Filiais (Branch Orders / Pedidos Internos)
CREATE TABLE IF NOT EXISTS public.branch_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_code TEXT UNIQUE,
  branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  status order_status NOT NULL DEFAULT 'pending',
  total_value NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Solicitacoes de Contagem de Estoque (Inventory Counts)
CREATE TABLE IF NOT EXISTS public.inventory_counts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  status inventory_count_status NOT NULL DEFAULT 'pending',
  counted_quantity INT,
  warehouse_quantity_at_request INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Distribuicoes em Massa (Distributions)
CREATE TABLE IF NOT EXISTS public.distributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Configurações Gerais da Empresa (App Settings)
CREATE TABLE IF NOT EXISTS public.app_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- 3. INDEXES FOR HIGH-VOLUME PERFORMANCE (>800 ORDERS)
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_branch_orders_branch_id ON public.branch_orders(branch_id);
CREATE INDEX IF NOT EXISTS idx_branch_orders_status ON public.branch_orders(status);
CREATE INDEX IF NOT EXISTS idx_branch_orders_created_at ON public.branch_orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_code ON public.products(code);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_suppliers_code ON public.suppliers(code);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier_id ON public.purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_status ON public.purchase_orders(status);

-- =============================================================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================

ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branch_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branch_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_counts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.distributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Allow public read & write operations for authenticated & anon clients (custom policy for app runtime)
CREATE POLICY "Allow full access for application users on branches" ON public.branches FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow full access for application users on suppliers" ON public.suppliers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow full access for application users on users" ON public.users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow full access for application users on products" ON public.products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow full access for application users on branch_limits" ON public.branch_limits FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow full access for application users on purchase_orders" ON public.purchase_orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow full access for application users on branch_orders" ON public.branch_orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow full access for application users on inventory_counts" ON public.inventory_counts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow full access for application users on distributions" ON public.distributions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow full access for application users on app_settings" ON public.app_settings FOR ALL USING (true) WITH CHECK (true);

-- =============================================================================
-- 5. INITIAL SEED DATA
-- =============================================================================

INSERT INTO public.branches (id, name, location, manager) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Filial Centro', 'Rua Principal, 100', 'João Silva'),
  ('22222222-2222-2222-2222-222222222222', 'Filial Norte', 'Av. das Flores, 500', 'Maria Oliveira')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.suppliers (id, name, code, cnpj, contact) VALUES
  ('33333333-3333-3333-3333-333333333333', 'Distribuidora Alimentos S.A.', 'FORN001', '12.345.678/0001-90', 'contato@distalimentos.com'),
  ('44444444-4444-4444-4444-444444444444', 'Logística Express', 'FORN002', '98.765.432/0001-10', 'comercial@logexpress.com')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.products (id, name, code, category, unit, price, current_stock, min_stock, image) VALUES
  ('55555555-5555-5555-5555-555555555555', 'Arroz 5kg', 'ARR001', 'Alimentos', 'un', 25.90, 150, 50, 'https://picsum.photos/seed/rice/200/200'),
  ('66666666-6666-6666-6666-666666666666', 'Feijão 1kg', 'FEI001', 'Alimentos', 'un', 8.50, 200, 40, 'https://picsum.photos/seed/beans/200/200'),
  ('77777777-7777-7777-7777-777777777777', 'Óleo de Soja', 'OLE001', 'Alimentos', 'un', 6.20, 80, 30, 'https://picsum.photos/seed/oil/200/200')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.users (id, name, email, role, branch_id) VALUES
  ('88888888-8888-8888-8888-888888888888', 'Admin Master', 'admin@ramox.com', 'admin', NULL),
  ('99999999-9999-9999-9999-999999999999', 'Logística Operador', 'log@ramox.com', 'logistics', NULL),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Gerente Centro', 'centro@ramox.com', 'branch', '11111111-1111-1111-1111-111111111111'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Gerente Norte', 'pedidoslojasramos@gmail.com', 'branch', '22222222-2222-2222-2222-222222222222')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.app_settings (key, value) VALUES
  ('company_settings', '{"companyLogo": "", "vignetteEnabled": true, "vignetteWords": ["Agilidade", "Precisão", "Controle"]}'::jsonb),
  ('product_classifications', '["Alimentos", "Bebidas", "Limpeza", "Higiene", "Descartáveis"]'::jsonb)
ON CONFLICT (key) DO NOTHING;
