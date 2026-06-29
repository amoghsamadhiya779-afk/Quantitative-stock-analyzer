# Nexus Quant - Lovable Project Context

## Overview
Nexus Quant is an institutional-grade quantitative intelligence platform designed for high-frequency market analysis, algorithmic predictions, and backtesting. The frontend provides a microsecond-synchronized interactive terminal to visualize complex quantitative data streams from the backend.

## Architecture
- **Frontend**: Next.js 14+ (App Router), React, TypeScript.
- **Styling**: Tailwind CSS with custom design system variables.
- **Animations**: Framer Motion for lifecycle component states and micro-interactions. GSAP for scroll-based triggers on the landing page.
- **Backend**: Python (FastAPI/Pandas) for providing machine learning inferences and algorithmic data endpoints.

## Design System (Stitch UI)
The platform utilizes a sophisticated "Apple-like" glassmorphism aesthetic combined with an institutional dark mode theme (Stitch UI).

### Core Tailwind Tokens & Utilities:
- **Backgrounds**: `bg-background` (base layout layer), `bg-surface-container` (card and component layers), `bg-surface-container-highest` (hover/active states).
- **Typography**: `font-display-md` (Headlines), `font-body-md` (Base text), `font-label-sm` (Overlines, labels). Fonts used are *Inter* and *Playfair Display*.
- **Text Colors**: `text-on-surface` (Primary text), `text-on-surface-variant` (Secondary text), `text-outline` (Muted/tertiary text).
- **Accents**: `primary` and `secondary` colors (derived from CSS variables).
- **Borders**: `border-outline-variant/30` applied to cards and containers.
- **Glassmorphism**: Use `backdrop-blur-xl bg-surface-container/50 border border-outline-variant/30` for floating panels, headers, and modal overlays.
- **Spacing**: `gap-stack-md`, `p-stack-md`, `px-margin-desktop`, etc., mapping to custom spacing variables.

### Animation Directives
- **Framer Motion**: Maintain `AnimatePresence` and staggered `motion.div` reveals for data ingress (e.g., lists rendering sequentially).
- **Functionality**: Do not alter underlying `useState`, `useEffect`, or API polling logic inside the workspace components. The platform is real-time and heavily state-dependent.
- **Visuals**: Utilize the `<ParticlePhysicsBackground />` component for any root-level layouts to maintain a cohesive visual identity.
