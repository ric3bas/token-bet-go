-- ==============================================================================
-- Schema de Banco de Dados PostgreSQL - TokenBet (Solana Token Creator)
-- Compatível com Entity Framework Core (Code-First) & Dapper (Modelo peca-aki)
-- ==============================================================================

CREATE SCHEMA IF NOT EXISTS tb;

-- 1. Tabela Users (Autenticação Híbrida: Google OAuth 2.0 ou Solana Wallet SIWS)
CREATE TABLE IF NOT EXISTS tb.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    google_id VARCHAR(100) UNIQUE,
    wallet_address VARCHAR(44) UNIQUE,
    email VARCHAR(256) UNIQUE,
    name VARCHAR(150) NOT NULL,
    avatar_url VARCHAR(500),
    refresh_token VARCHAR(256),
    refresh_token_expiry_time TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_google_id ON tb.users(google_id) WHERE google_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_wallet_address ON tb.users(wallet_address) WHERE wallet_address IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_email ON tb.users(email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_refresh_token ON tb.users(refresh_token);

-- 2. Tabela Tokens (Histórico de Tokens SPL criados pelo usuário)
CREATE TABLE IF NOT EXISTS tb.tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES tb.users(id) ON DELETE CASCADE,
    token_address VARCHAR(44) NOT NULL UNIQUE, -- Mint Address da Solana
    name VARCHAR(32) NOT NULL,
    symbol VARCHAR(10) NOT NULL,
    supply NUMERIC(38, 0) NOT NULL,
    decimals SMALLINT NOT NULL DEFAULT 9,
    metadata_uri VARCHAR(500),
    image_uri VARCHAR(500),
    
    -- Status de segurança (true = seguro / autoridade revogada)
    status BOOLEAN NOT NULL DEFAULT FALSE,
    is_mint_revoked BOOLEAN NOT NULL DEFAULT FALSE,
    is_freeze_revoked BOOLEAN NOT NULL DEFAULT FALSE,
    immutable_metadata BOOLEAN NOT NULL DEFAULT TRUE,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tokens_user_id ON tb.tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_tokens_token_address ON tb.tokens(token_address);
CREATE INDEX IF NOT EXISTS idx_tokens_symbol ON tb.tokens(symbol);

-- 3. Tabela Transactions (Auditoria Financeira e Monetização da Empresa em SOL)
CREATE TABLE IF NOT EXISTS tb.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES tb.users(id) ON DELETE CASCADE,
    signature VARCHAR(88) NOT NULL UNIQUE, -- Hash da Transação na Solana
    type VARCHAR(30) NOT NULL,            -- 'Create', 'RevokeMint', 'RevokeFreeze'
    amount_earned NUMERIC(18, 6) NOT NULL, -- Valor em SOL coletado pela empresa
    date TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON tb.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_signature ON tb.transactions(signature);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON tb.transactions(type);
