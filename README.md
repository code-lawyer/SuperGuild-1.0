# 🌌 SuperGuild 5.0 (VCP & AI Oracle)

![SuperGuild Cover](https://via.placeholder.com/1280x300.png?text=SuperGuild+v5.0)

**SuperGuild** is a decentralized "Super Individual" collaboration platform powered by an AI Oracle. It leverages the "Blind Box" audit mechanism of an AI judge (via LLM APIs like Claude/GPT-4o) and on-chain credibility (VCP Token & dynamic 3D SBT Medals) to enable intermediate-free, zero-fee P2P collaboration.

## 🚀 Key Features

- **Decentralized Reputation (VCP Token):**
  SuperGuild ditches traditional fiat/token payments for direct tasks. Instead, contributions are rewarded with **VCP (Value Contribution Points)**, an ERC-20 token minted as Proof-of-Work onto the Arbitrum Sepolia network. VCP determines your governance weight.
  
- **AI Oracle Evaluation Engine:**
  An autonomous evaluator parsing GitHub PR/Commits and web deliverables through Jina Reader. It calculates rewards using a multi-dimensional standard (`ln(budget) * Difficulty * Quality * Efficiency`), ensuring objective, blind-box auditing.
  
- **Dynamic 3D On-chain Medals (SBTs):**
  Built with React Three Fiber (`@react-three/fiber`), SuperGuild introduces dynamic 3D Medals (ERC-7496 format). A user's accumulated VCP directly mutating the glTF physical material rendering effects on their Web3 Profile.
  
- **Pioneer Recruitment System:**
  Built-in invite-code system (`SG-XXXXXX`) featuring EIP-191 cryptographic signatures for wallet minting. Secures the initial "100 Founders" genesis block of the protocol.

## 🛠 Tech Stack

- **Frontend & App Framework:** Next.js 15 (App Router), React 19, Tailwind CSS v4
- **Web3 Interaction:** Wagmi v3, Viem, RainbowKit
- **Database Backend:** Supabase (PostgreSQL), Next.js Server Actions
- **3D Engine:** React Three Fiber, Three.js
- **Network Layer:** Arbitrum Sepolia (Primary)
- **AI Oracle Engine:** Claude 3.5 Sonnet / OpenAI / Gemini APIs

## 📦 Getting Started

### 1. Pre-requisites

- Node.js v18+ (v20+ recommended)
- `pnpm` package manager
- A Supabase Project (for PostgreSQL and Realtime sync)
- Alchemy API Key (for Arbitrum Sepolia RPC)

### 2. Installation

```bash
git clone https://github.com/code-lawyer/SuperGuild.git
cd SuperGuild
pnpm install
```

### 3. Environment Variables

Copy the example environment file and fill in your keys:

```bash
cp .env.example .env.local
```

**Critical `.env.local` Variables:**

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Web3 & RPC
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your-project-id
NEXT_PUBLIC_ALCHEMY_ID=your-alchemy-key

# AI Oracle
ORACLE_LLM_API_KEY=your-claude-or-openai-api-key

# Hot Wallet (For VCP Minting via API)
HOT_WALLET_PRIVATE_KEY=0x...
```

### 4. Development Server

Start the Next.js development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 📜 Smart Contracts

Contracts are deployed on **Arbitrum Sepolia**:

- `VCPTokenV2` (UUPS Proxy): `0xcDD2b15fEFC2071339234Ee2D72104F8E702f63C`
- `MedalNFT`: `0xef96bE9fFf59B5653085C11583beaC0D16450F1a`

*All protocol hot wallet private keys must be strictly isolated to the secure server API environments.*

## ⚖️ License

[MIT License](LICENSE)
