# Payment Mode Architecture: On-Chain vs Off-Chain Evidence Strategy

> **Date**: 2026-03-12
> **Status**: Active architectural decision
> **Scope**: Collaboration lifecycle, payment settlement, arbitration evidence chain

---

## 1. Background: Two Payment Modes

SuperGuild supports two payment modes for collaborations:

| | **self_managed** (DirectPay) | **guild_managed** (GuildEscrow) |
|---|---|---|
| USDC custody | No custody — atomic pass-through | Full escrow — contract holds USDC |
| Proof on-chain | No | Yes (`contentHash bytes32`) |
| 7-day window | No | Yes (`block.timestamp` enforced) |
| Arbitration | Not available | Full (dispute → Hand of Justice → resolve) |
| VCP multiplier | 0.5x | 1.0x |
| Gas per milestone | 1 tx (pay) | 2-3 tx (submitProof + confirm/dispute) |
| Contract audit required | Low risk (pass-through) | High risk (custodial) |

---

## 2. MVP Decision: self_managed Only

**Rationale (confirmed 2026-03-12):**

1. **Audit cost avoidance** — GuildEscrow holds user funds, requires professional security audit before mainnet. Self_managed (DirectPay) is a stateless pass-through with near-zero attack surface.
2. **Fund safety** — In self_managed mode, USDC never sits in a protocol-controlled wallet. Publisher pays worker directly via DirectPay contract. No custodial risk.
3. **Time to market** — Testnet public beta launched 2026-03-10. Opening guild_managed requires audit + infrastructure (resolver bot deployment), adding weeks to timeline.
4. **User trust building** — Start with familiar P2P payment model, graduate to escrow after community trust is established.

**Trade-off accepted:**
- In self_managed mode, the entire collaboration evidence chain (task details, proof submissions, milestone confirmations) exists **only in Supabase**, not on-chain.
- Supabase `proofs` table has RLS policies forbidding UPDATE/DELETE, providing "soft immutability", but this depends on service_role key security.
- **No on-chain arbitration is available** for self_managed collaborations.
- The `Paid` event from DirectPay only records `(collabId, publisher, worker, amount)` — no content hash.

**This is an intentional, temporary architectural compromise. It does NOT mean the on-chain evidence features are unnecessary or should be removed.**

---

## 3. guild_managed Implementation Status

> **DO NOT DELETE** any guild_managed code. It is ~80% complete and will be activated post-audit.

### Completed (ready for activation)

| Component | File | Status |
|-----------|------|--------|
| GuildEscrow hook (all 5 core functions) | `hooks/useGuildEscrow.ts` | Done |
| Conditional payment flow in detail page | `app/collaborations/[id]/page.tsx` | Done |
| On-chain proof submission (dual write: chain + DB) | `components/collaborations/UploadProofDialog.tsx` | Done |
| Escrow monitor UI (locked funds, progress bar) | `app/collaborations/[id]/page.tsx:284-327` | Done |
| Dispute button (calls `escrow.disputeMilestone`) | `app/collaborations/[id]/page.tsx:367-371` | Done |
| Escrow cancel with refund | `app/collaborations/[id]/page.tsx:388-392` | Done |
| Arbitration page (Token #4 NFT gate) | `app/council/arbitration/page.tsx` | Done |
| Dispute vote API (sig verify + NFT check) | `app/api/council/arbitration/vote/route.ts` | Done |
| Resolver bot: auto-release (7-day window) | `scripts/resolver-bot.ts:115-195` | Done |
| Resolver bot: dispute resolution (tally + on-chain) | `scripts/resolver-bot.ts:197-279` | Done |
| Contract ABIs | `constants/GuildEscrow.json` | Done |

### Not yet completed (required before activation)

| Component | Description | Priority |
|-----------|-------------|----------|
| Remove `self_managed` gate in create form | `create/page.tsx` line 79: `paymentMode === 'self_managed'` | Trivial |
| Standalone deposit UI | If approval + deposit fails, user needs a "deposit now" button | Medium |
| Dispute outcome display | Post-resolution page showing who won, amounts distributed | Medium |
| Resolver bot deployment infrastructure | Currently CLI script, needs systemd/Lambda/Cloud Run | High (mainnet) |
| GuildEscrow security audit | Professional audit of custodial contract | Critical (mainnet) |

---

## 4. Evidence Chain Comparison

### self_managed (current MVP)

```
Task Created ──────────── Supabase only (no on-chain record)
     │
Provider Approved ─────── Supabase only
     │
Proof Submitted ───────── Supabase proofs table (RLS: INSERT-only)
     │                     content_hash stored but NOT anchored on-chain
     │
Milestone Confirmed ───── Supabase status update
     │
Payment ───────────────── DirectPay.pay() ON-CHAIN
     │                     Records: collabId, publisher, worker, amount
     │                     Does NOT record: contentHash
     │
All Settled ───────────── Supabase status → SETTLED
     │
VCP Mint ──────────────── VCPToken.mint() ON-CHAIN (via AI Oracle)
```

**Arbitration evidence**: Only Supabase records. No on-chain proof hash.

### guild_managed (post-audit)

```
Task Created ──────────── Supabase (metadata)
     │
Provider Approved ─────── Supabase
     │
USDC Deposited ────────── GuildEscrow.deposit() ON-CHAIN
     │                     Records: publisher, worker, milestoneAmounts[]
     │
Proof Submitted ───────── GuildEscrow.submitProof() ON-CHAIN
     │                     Records: contentHash (bytes32), submittedAt
     │                     Starts 7-day optimistic window
     │                     ALSO: Supabase proofs table (dual write)
     │
     ├── Publisher Confirms → GuildEscrow.confirmMilestone() ON-CHAIN
     │                         USDC released atomically to worker
     │
     ├── 7 Days Pass ──────→ GuildEscrow.autoRelease() ON-CHAIN
     │                         Resolver bot triggers, USDC released
     │
     └── Publisher Disputes → GuildEscrow.disputeMilestone() ON-CHAIN
                               10% penalty to treasury (IRREVERSIBLE)
                               Hand of Justice votes → resolveDispute()
                               Winner receives 90%
```

**Arbitration evidence**: Full on-chain trail — content hash, timestamps, status transitions, penalty records.

---

## 5. Future Enhancement: Hybrid Mode

A potential intermediate approach (post-MVP, pre-mainnet) could add lightweight on-chain anchoring to self_managed without requiring escrow:

- Add `contentHash` parameter to `DirectPay.pay()` so payment records also anchor proof hash
- Or deploy a minimal `EvidenceAnchor` contract: `anchor(collabId, contentHash)` — gas cost ~30k gas (~$0.01 on Arbitrum)

This would give self_managed collaborations on-chain evidence without custodial risk.

**Decision**: Deferred to post-MVP evaluation. Not needed for testnet.

---

## 6. Mainnet Activation Checklist for guild_managed

When ready to open guild_managed mode:

1. [ ] Complete GuildEscrow security audit
2. [ ] Deploy resolver bot as persistent service (with monitoring)
3. [ ] Remove `paymentMode === 'self_managed'` gate in create form
4. [ ] Build standalone deposit UI (fallback for failed approval+deposit)
5. [ ] Build dispute outcome display page
6. [ ] Load test resolver bot (concurrent collabs, edge cases)
7. [ ] Configure mainnet resolver hot wallet + treasury address
8. [ ] Update user documentation (explain both modes)

---

## 7. Code Preservation Notice

> **WARNING TO FUTURE DEVELOPERS / AI AGENTS:**
>
> The following files contain guild_managed (GuildEscrow) logic that is **intentionally disabled in MVP** but **must not be deleted or refactored away**:
>
> - `hooks/useGuildEscrow.ts` — Full escrow interaction hook
> - `scripts/resolver-bot.ts` — Auto-release + dispute resolution bot
> - `constants/GuildEscrow.json` — Contract ABI
> - `constants/DirectPay.json` — DirectPay contract ABI
> - `app/council/arbitration/page.tsx` — Arbitration UI
> - `app/api/council/arbitration/vote/route.ts` — Vote API
> - `components/collaborations/UploadProofDialog.tsx` — Contains dual-write logic (on-chain + DB)
> - `app/collaborations/[id]/page.tsx` — Contains `isGuildManaged` conditional branches
>
> These components form the complete on-chain evidence chain for guild_managed collaborations.
> They will be activated after contract security audit is complete.
> **DO NOT treat them as dead code.**
