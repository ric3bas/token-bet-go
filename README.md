# 🚀 TokenBet — Solana Token Creator SaaS

Plataforma descentralizada de alta performance para criação instantânea de Tokens SPL na blockchain **Solana**, com metadados on-chain compatíveis com o padrão **Metaplex Metadata V3**, armazenamento descentralizado via **Pinata IPFS**, backend em **.NET 10 (Clean Architecture)** e persistência em banco de dados **PostgreSQL** (baseado no padrão arquitetural do projeto `peca-aki`).

---

## 💎 Regra de Ouro (Custo Zero para a Plataforma)

1. **Assinatura Exclusiva do Usuário (`feePayer`)**:
   - Toda a transação é construída e assinada exclusivamente no **client-side** no hook `useCreateToken.ts`.
   - Apenas a carteira do usuário (Phantom, Solflare) assina como pagadora de gás (`feePayer`) e autoridade inicial.
   - O backend **NUNCA** assina transações, não armazena chaves privadas e não paga taxas da rede.
2. **Modelo de Rentabilidade Atômica**:
   - As taxas de serviço da plataforma são cobradas na mesma transação atômica via instruções `SystemProgram.transfer` para a `NEXT_PUBLIC_TREASURY_WALLET`.
   - **Taxa Base**: `0.03 SOL`
   - **Revogar Mint Authority (Opcional)**: `+0.05 SOL`
   - **Revogar Freeze Authority (Opcional)**: `+0.05 SOL`
3. **Atomicidade Absoluta**:
   - Caso qualquer instrução falhe (saldo insuficiente, rejeição de assinatura ou falha de rede), **toda a transação é revertida**. Nem o usuário nem a plataforma perdem fundos.

---

## 🏛️ Arquitetura do Sistema

```mermaid
flowchart TD
    subgraph Client ["Frontend (Next.js 14 / Tailwind CSS)"]
        UserWallet["Phantom / Solflare Wallet (feePayer)"]
        FormUI["Formulário Dark Cards"]
        Hook["useCreateToken Hook"]
        TxBuilder["Atomic Transaction Builder"]
    end

    subgraph Backend [".NET 10 Web API (Clean Architecture)"]
        Endpoints["Minimal APIs (/api/upload, /api/tokens, /api/treasury)"]
        UseCases["Application Use Cases (UploadMetadata, RegisterToken)"]
        PinataSvc["Infrastructure PinataService"]
        DapperRepos["Infrastructure Dapper Repositories"]
    end

    subgraph Storage ["Infraestrutura & Persistência"]
        Postgres[("PostgreSQL (schema tb)")]
        PinataIPFS["Pinata Cloud IPFS"]
    end

    subgraph SolanaChain ["Solana Blockchain"]
        SysProg["System Program (Taxas Treasury 0.03 + 0.05 + 0.05 SOL)"]
        TokenProg["SPL Token Program (Mint & ATA Creation)"]
        MetaplexProg["Metaplex Metadata V3 Program"]
    end

    FormUI -->|1. Upload Logo & Metadados| Endpoints
    Endpoints --> UseCases
    UseCases --> PinataSvc
    PinataSvc -->|2. Pin Imagem & JSON| PinataIPFS
    Endpoints -->|3. Retorna Metadata URI| FormUI

    FormUI --> Hook
    Hook --> TxBuilder
    TxBuilder -->|4. Monta Transação Atômica| SysProg
    TxBuilder -->|5. Cria Mint & Inicializa ATA| TokenProg
    TxBuilder -->|6. Cria Metadados On-Chain| MetaplexProg
    UserWallet -->|7. Assina e Paga Gás (feePayer)| TxBuilder
    TxBuilder -->|8. Confirma On-Chain| SolanaChain

    Hook -->|9. Notifica Sucesso| Endpoints
    UseCases --> DapperRepos
    DapperRepos -->|10. Registra Token & Taxas| Postgres
```

---

## 📁 Estrutura do Projeto

```text
tokenBet/
├── .agents/
│   └── skills/                                # Especialistas e automações (modelo peca-aki)
│       ├── tokenbet-backend/SKILL.md          # Especialista em .NET 10, Clean Architecture e Postgres
│       ├── tokenbet-frontend/SKILL.md         # Especialista em Next.js, Tailwind e Web3
│       └── tokenbet-fullstack/SKILL.md        # Coordenador de ponta a ponta
│
├── database/
│   └── init.sql                               # Script DDL do PostgreSQL (schema tb)
│
├── backend/                                   # Backend .NET 10 (Clean Architecture)
│   ├── TokenBet.slnx                          # Solução .NET 10
│   └── src/
│       ├── Domain/                            # Entidades (TokenCreation, TreasuryPayment)
│       ├── Application/                       # Use Cases, DTOs, Interfaces, Validators
│       ├── Infrastructure/                    # DapperRepository, UnitOfWork, PinataService, HealthCheck
│       ├── API/                               # Endpoints Minimal API, Extensions, Swagger
│       ├── Program.cs                         # Configuração de bootstrap, Serilog, CORS e DI
│       └── appsettings.json                   # ConnectionStrings e credenciais
│
└── frontend/                                  # Frontend Next.js 14 (App Router)
    ├── src/
    │   ├── app/                               # Rotas, layouts e API gateways (/api/upload, /api/tokens)
    │   ├── components/                        # Cards Dark Theme, Header, FileUpload, Modais
    │   ├── hooks/                             # useCreateToken.ts (Transação Atômica Client-Side)
    │   └── types/                             # Tipos TypeScript
    ├── package.json
    └── tailwind.config.ts
```

---

## 🚀 Como Executar

### 1. Banco de Dados PostgreSQL
Execute o script [`database/init.sql`](file:///c:/Users/Ricardo/projetos/tokenBet/database/init.sql) no seu servidor PostgreSQL.

### 2. Backend .NET 10
```powershell
cd backend/src
dotnet run
```
A API iniciará em `http://localhost:5000` (Swagger disponível em `http://localhost:5000/swagger`).

### 3. Frontend Next.js
```powershell
cd frontend
npm run dev
```
Acesse a aplicação no navegador em `http://localhost:3000`.
