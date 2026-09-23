# NEXAWIS Global Design System

> **Status:** Finalized Baseline (Do not update unless explicitly approved after major structural redesigns).

This document serves as the source of truth for the NEXAWIS frontend visual identity, component architecture, and theme tokens. NEXAWIS is a premium enterprise AI SaaS product focused on workforce intelligence, sustainable team formation, and explainable AI.

---

## 1. Core Principles
1. **Premium & Data-Driven:** The UI must feel sophisticated, trustworthy, and intelligent.
2. **Show, Don't Tell:** Use data visualizations (scores, bars, gauges, networks) instead of generic text paragraphs.
3. **Restrained Aesthetics:** Avoid excessive neon, rainbow gradients, huge generic AI illustrations, or heavy shadows.
4. **Purposeful Motion:** Animations should communicate hierarchy, data flow, and system activity without causing layout thrashing.

---

## 2. Design Tokens (CSS Variables)

The application uses a strict dual-theme architecture. **Do not hardcode hex colors in components**; always use these semantic tokens.

### Light Theme (Default)
A sophisticated, premium enterprise financial/SaaS feel.
- **`--color-page-bg`**: `#e2e8f0` (Soft cool blue-gray outer background)
- **`--color-bg-base`**: `#e8f0f2` (Soft teal-tinted off-white main background)
- **`--color-surface-1`**: `#ffffff` (Pure white for primary cards/surfaces)
- **`--color-surface-2`**: `#f1f5f9` (Subtle cool-gray for secondary/elevated surfaces)
- **`--color-text-primary`**: `#061c24` (Deep teal, near-black for high contrast headings)
- **`--color-text-secondary`**: `#475569` (Muted slate/blue-gray for body copy)
- **`--color-text-muted`**: `#94a3b8` (Low emphasis text)
- **`--color-accent-lime`**: `#16a34a` (Darker green for legibility)
- **`--color-accent-cyan`**: `#0284c7` (Darker cyan for legibility)

### Dark Theme (`html[data-theme="dark"]`)
A deep, immersive, and technical intelligence feel.
- **`--color-page-bg`**: `#0d1a20` (Deep navy/teal)
- **`--color-bg-base`**: `#0d1a20`
- **`--color-surface-1`**: `#0a141a` (Darker structural cards)
- **`--color-surface-2`**: `#172d38` (Elevated interactive surfaces)
- **`--color-text-primary`**: `#ffffff` (Pure white)
- **`--color-text-secondary`**: `#8db3bd` (Soft muted teal)
- **`--color-text-muted`**: `#4a6b73` (Low emphasis)
- **`--color-accent-lime`**: `#e8f39a` (Vibrant NEXAWIS lime/yellow)
- **`--color-accent-cyan`**: `#22d3ee` (Bright cyan)

---

## 3. Typography
- **Display (`--font-display`)**: `Space Grotesk` - Used for headings, scores, and major data points. Tight tracking (`tracking-tight`).
- **Body (`--font-body`)**: `Inter` - Used for all paragraphs, labels, and UI text.
- **Classes**: 
  - `.text-display`: Heavy, tight layout for heroes.
  - `.text-h1` / `.text-h2`: Standard section headings.
  - `.text-body`: Standard readable paragraph styling.
  - `.text-data`: Tabular numbers with medium weight for metrics.
  - `.text-label`: Small, uppercase, widely tracked utility text.

---

## 4. Component Standards
- **Cards**: Use `.card-base` (flat, subtle border) or `.card-elevated` (subtle shadow, hover lift). All cards use heavy rounding (`rounded-xl` or `rounded-2xl`).
- **Borders**: Thin and low-contrast (`border-[--color-border-subtle]`).
- **Icons**: `lucide-react`. Must force stroke-width to `1.5` for a sharper, premium look.
- **Custom Cursor**: A smooth, physics-based (`framer-motion` spring) dot and ring that adapts to interactive targets (`data-cursor="link|button|card"`).
- **Navigation**: Premium glassmorphism (`backdrop-blur`) that adapts opacity on scroll.
- **Empty Space**: Generous paddings (`py-24`, `py-32`) but tightly composed logical groupings. No massive empty vertical gaps.

---

## 5. Implementation Rules for Developers
1. **Never use `text-white` or `bg-white`** globally unless strictly required for a component that must remain dark/light regardless of the active theme (e.g., the Hero section). Use `--color-text-primary` and `--color-surface-1`.
2. **Reuse layout patterns**: If building a grid of features, reference `AwisGrid.tsx`. If building a timeline or process, reference `Workflow.tsx`.
3. **Motion**: Use `framer-motion`. Animations should be purposeful (e.g., `AnimatePresence` for data swapping). Do not animate every single element on screen continuously.
4. **Responsiveness**: Do not just shrink desktop layouts. Use `flex-col` on mobile and `flex-row` on desktop. Ensure mobile padding is comfortable.
