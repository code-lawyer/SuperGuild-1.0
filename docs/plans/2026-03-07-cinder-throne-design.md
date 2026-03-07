# Cinder Throne (柴薪王座) — Visual Redesign Design Doc

**Date:** 2026-03-07
**Phase:** 11
**Page:** `/council/ai`

---

## Overview

The Cinder Throne is a 3D visual space for observing the guild's senior members. It is not an admin tool — it is an artistic, contemplative interface. Each of the 13 rotating stone slabs represents a guild elder. The central icosahedron is the visual anchor for Rhythm, the guild's core AI persona.

This document covers the **Phase 11 visual implementation only**. AI functionality (elder persona agents, Rhythm chat) is explicitly out of scope and is reserved for a future phase.

---

## Conceptual Model

| Element | Represents | Current Scope |
|---------|-----------|---------------|
| 13 black stone slabs | Guild elders (VCP ≥ 1% total supply, or specific NFT holders) | Mock data, artistic |
| Central icosahedron | Rhythm — guild core AI persona | Visual anchor only, no functionality |
| Hover popup + button | Gateway to elder persona interaction | Button stub, dialog shows "连接中" |

---

## Section 1: Visual Layout

- **Background:** White (`#ffffff`), matching the rest of the site
- **Canvas:** Embedded directly in the page (no dark container box), height `70vh`
- **HUD removed:** No "System Online", "Active Personas", or "Drag to rotate" overlays
- **Camera:** Position `[0, 6, 20]`, FOV `50`, slight top-down angle
- **Lighting:** Soft ambient + directional, black-on-white contrast palette

---

## Section 2: 3D Components

### Central Icosahedron (Rhythm Anchor)
- Geometry: `icosahedronGeometry`, radius `1.8`, detail `0` (sharp edges)
- Material: Matte black `#111111`, `roughness: 0.3, metalness: 0.6`
- Wireframe overlay: `#333333`, opacity `0.4`
- Animation: Y-axis rotation `delta * 0.4` + X-axis drift `delta * 0.1` (floating feel)
- Hover: show `"RHYTHM · CORE"` label (grey mono text, no functionality)

### Stone Slabs (Guild Elders)
- Geometry: `boxGeometry(1.2, 3.5, 0.08)` — thin rectangular tablet
- Material: Black `#0a0a0a`, `roughness: 0.5, metalness: 0.3`
- Count: **13 slabs** (fixed, does not change with data)
- Orbit radius: `6`
- Spacing: evenly distributed (360° / 13 ≈ 27.7° per slab)
- Default orientation: tangent to orbit (slab faces outward from center)
- Float animation: `sin(time + index * phaseOffset) * 0.25`, unique phase per slab

---

## Section 3: Hover Interaction

### State
```ts
const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
const [connectingIndex, setConnectingIndex] = useState<number | null>(null);
const isSystemPaused = hoveredIndex !== null;
```

### Flow
```
Mouse enter slab[i]
  → hoveredIndex = i
  → Group stops rotating (isSystemPaused = true)
  → Slab smoothly rotates 180° on local Y-axis to face camera (~0.3s lerp)
  → HTML popup appears: codename + VCP + "与 TA 交流" button

Mouse leave slab[i]
  → hoveredIndex = null
  → Slab smoothly returns to orbit orientation
  → Popup disappears
  → Group resumes rotation
```

### Popup Layout
```
┌──────────────────────────┐
│  ARBITER-∆7              │  ← codename, mono bold white
│  ──────────────────────  │
│  12,480 VCP              │  ← vcp, mono grey
│                          │
│  [ 与 TA 交流 ]          │  ← button, opens connecting dialog
└──────────────────────────┘
```

- Style: `bg-black/90 text-white font-mono`, no border, compact
- Button click: opens a modal showing spinner + "连接中..."
- Modal has a close button (×)
- Code comment on button: `// TODO: connect to elder persona agent`

---

## Section 4: Data Structure

### Interface
```ts
interface GuildElder {
  id: string;
  codename: string;  // Artistic codename, e.g. "ARBITER-∆7"
  vcp: number;       // VCP amount displayed
}
```

### Mock Data (13 entries)
Artistic codenames in `∆N` format. VCP values are representative but not real.

### Future Integration Stub
```ts
// TODO: Replace with real query
// Query: profiles WHERE vcp_cache >= (totalVCPSupply * 0.01)
// OR: user_medals WHERE token_id IN [specific NFT IDs]
async function fetchGuildElders(): Promise<GuildElder[]> {
  return MOCK_ELDERS;
}
```

---

## Out of Scope (Future Phases)

- Elder persona agent chat (clicking "与 TA 交流" connects to real agent)
- Rhythm chat interface (clicking icosahedron opens Rhythm dialog)
- Real on-chain member data integration
- GLB model replacement for icosahedron
