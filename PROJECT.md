# Project: Nexus Quant

## Architecture
Nexus Quant is an institutional-grade quantitative research platform built as a Next.js (TypeScript, Tailwind CSS) React application. The platform provides interactive visualization of quant workflows, integration logos, real-time charting, correlation heatmaps, portfolio metrics, and backtesting execution.

Data flow is primarily client-side React rendering driven by:
- `frontend/src/lib/api.ts` for market data, tickers, historical stock prices, and model prediction fetching.
- `frontend/src/app/page.tsx` as the main landing page and dashboard hub.
- Components in `frontend/src/components/features/` and `frontend/src/components/ui/` for specific quant workflows and mockups.

## Code Layout
- `frontend/src/app/globals.css`: Global stylesheet defining colors, custom variables, and glassmorphism utility classes.
- `frontend/src/app/layout.tsx`: Root HTML shell with smooth scrolling.
- `frontend/src/app/page.tsx`: Single-page hub that coordinates navbar, hero, marquee, control panels, active dashboards, and footer.
- `frontend/src/components/features/`: Contains specific quantitative feature views (AnalystDashboard, BacktestingEngine, DeepTechnicalSuite, MacroRiskEngine, NewsDrivenMarket, SotaBenchmarking, TradingDesk).
- `frontend/src/components/ui/`: Contains modular UI elements (candlesticks/LightweightChart, custom selectors, risk meters, headers, etc.).
- `frontend/tests/`: Integration and E2E Playwright test specifications.

## Milestones

### Track 1: Implementation Track
| # | Name | Scope | Dependencies | Status |
|---|---|---|---|---|
| M1.1 | Design System & Glassmorphism Theme | Setup globals.css and tailwind.config.ts with black luxury and glassmorphism utilities | None | PLANNED |
| M1.2 | Navbar & Layout Structure | Implement sticky blurred header with all 6 required links: Platform, Research, Technology, Documentation, GitHub, Launch Terminal | M1.1 | PLANNED |
| M1.3 | Hero & Integration Marquee | Implement Hero section with "Institutional Quantitative Intelligence" and the infinite scrolling integration logo marquee (Yahoo Finance, Polygon, Finnhub, Alpha Vantage, NASDAQ, NSE, TradingView) | M1.2 | PLANNED |
| M1.4 | Quant Finance Workflows | Implement the 6 quantitative workflow sections (Market data ingestion, Technical indicators, ML prediction, Portfolio optimization, Risk analytics, Backtesting) replacing old AI agent content | M1.3 | PLANNED |
| M1.5 | Interactive Mockups & Dashboard Integration | Integrate high-fidelity mockups (candlestick chart, portfolio dashboard, correlation matrix, risk heatmap) into the workflow sections | M1.4 | PLANNED |
| M1.6 | E2E Test Suite Pass (Phase 1) | Ensure implementation passes 100% of Playwright E2E tests from E2E Testing Track | M1.5, M2.4 | PLANNED |
| M1.7 | Adversarial Hardening (Phase 2) | Implement adversarial test coverage (Tier 5) and resolve all uncovered edge cases / gap reports | M1.6 | PLANNED |

### Track 2: E2E Testing Track
| # | Name | Scope | Dependencies | Status |
|---|---|---|---|---|
| M2.1 | Test Infrastructure | Setup Playwright E2E test suite configurations and directories, define TEST_INFRA.md | None | PLANNED |
| M2.2 | Tier 1 & 2 Tests | Implement Tier 1 (Feature Coverage) and Tier 2 (Boundary & Corner Cases) Playwright assertions | M2.1 | PLANNED |
| M2.3 | Tier 3 & 4 Tests | Implement Tier 3 (Cross-Feature Combinations) and Tier 4 (Real-World Application Scenarios) assertions | M2.2 | PLANNED |
| M2.4 | Publish TEST_READY.md | Create and verify TEST_READY.md containing all E2E test definitions and metrics | M2.3 | PLANNED |

## Interface Contracts
- **Global Theme Contract**: Classes `bg-luxury-black`, `backdrop-blur-md`, `border-luxury-glass` must exist in globals.css.
- **Navbar Links**: Render exact text anchors: `Platform`, `Research`, `Technology`, `Documentation`, `GitHub`, `Launch Terminal`.
- **Hero Text**: Must contain exact string `Institutional Quantitative Intelligence`.
- **Marquee Logos**: Must contain exact strings: `Yahoo Finance`, `Polygon`, `Finnhub`, `Alpha Vantage`, `NASDAQ`, `NSE`, `TradingView`.
- **Workflow Sections**: Must contain headings for the 6 workflows: `Market data ingestion`, `Technical indicators`, `ML prediction`, `Portfolio optimization`, `Risk analytics`, `Backtesting`.
