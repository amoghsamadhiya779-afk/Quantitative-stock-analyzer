# Playwright E2E Test Infrastructure Plan

This document outlines the Playwright End-to-End (E2E) testing strategy for **Nexus Quant**. The testing architecture is organized into four distinct tiers covering basic functionality, boundary/corner cases, cross-feature integrations, and real-world user scenarios across our 6 core features.

---

## 1. Core Features Under Test

The E2E test suite validates the following 6 core features of the Nexus Quant platform:

1. **Aesthetic & Branding**: Verification of the dark luxury theme (`bg-luxury-black`), frosted glass elements (`backdrop-blur-md`, `border-luxury-glass`), rounded container cards, and the sticky blurred navigation bar.
2. **Navigation Links**: Verification of the 6 required links in the navbar: `Platform`, `Research`, `Technology`, `Documentation`, `GitHub`, and `Launch Terminal`.
3. **Hero Section**: Verification of the hero layout and presence of the exact string: `"Institutional Quantitative Intelligence"`.
4. **Quantitative Workflows**: Verification of the 6 workflows with their respective headings/containers:
   - `Market data ingestion`
   - `Technical indicators`
   - `ML prediction`
   - `Portfolio optimization`
   - `Risk analytics`
   - `Backtesting`
5. **Interactive Mockups**: Verification of client-side interactive visual components:
   - `candlestick chart`
   - `portfolio dashboard`
   - `correlation matrix`
   - `risk heatmap`
6. **Infinite Logo Marquee**: Verification of the infinite scrolling integration partners marquee containing the following exact logos/names:
   - `Yahoo Finance`
   - `Polygon`
   - `Finnhub`
   - `Alpha Vantage`
   - `NASDAQ`
   - `NSE`
   - `TradingView`

---

## 2. E2E Testing Architecture (71 Tests Total)

To ensure high-fidelity verification and prevent regressions, our test plan defines a 4-tier model.

```
┌────────────────────────────────────────────────────────┐
│             Tier 4: Real-World Scenarios               │  (5 Tests)
├────────────────────────────────────────────────────────┤
│           Tier 3: Cross-Feature Combinations           │  (6 Tests)
├────────────────────────────────────────────────────────┤
│          Tier 2: Boundary & Corner Case Coverage       │  (30 Tests - 5 per Feature)
├────────────────────────────────────────────────────────┤
│          Tier 1: Feature Presence & Base Assertions    │  (30 Tests - 5 per Feature)
└────────────────────────────────────────────────────────┘
```

---

### Tier 1: Feature Coverage (30 Tests, 5 per Feature)
Ensures that all key DOM elements, specific class bindings, text values, and structures are present and loaded successfully.

#### Feature 1: Aesthetic & Branding
- **T1.F1.1**: Verify that the main container or body element has the luxury black theme background color.
- **T1.F1.2**: Verify that dashboard cards utilize frosted glass utility classes (`backdrop-blur` or equivalent glass styling).
- **T1.F1.3**: Verify that major container cards have rounded corners applied (e.g. `rounded-xl`, `rounded-2xl` or equivalent border-radius computed style).
- **T1.F1.4**: Verify that the main navigation bar has a sticky or fixed position at the top of the viewport.
- **T1.F1.5**: Verify that the sticky navigation bar has the blurred background styling class applied.

#### Feature 2: Navigation Links
- **T1.F2.1**: Verify that the navigation bar renders the `Platform` link with correct text and visibility.
- **T1.F2.2**: Verify that the navigation bar renders the `Research`, `Technology`, and `Documentation` links.
- **T1.F2.3**: Verify that the navigation bar renders the `GitHub` link.
- **T1.F2.4**: Verify that the navigation bar renders the `Launch Terminal` CTA link.
- **T1.F2.5**: Verify that all 6 required navigation anchors exist in the navbar container DOM node.

#### Feature 3: Hero Section
- **T1.F3.1**: Verify that the Hero header contains the exact text `"Institutional Quantitative Intelligence"`.
- **T1.F3.2**: Verify that the Hero header is rendered in a high-priority heading tag (`h1` or `h2`).
- **T1.F3.3**: Verify that a supporting subtitle or description text is present under the Hero header.
- **T1.F3.4**: Verify that the Hero section is visible on load without scrolling.
- **T1.F3.5**: Verify that the Hero elements conform to contrast guidelines against the dark luxury theme.

#### Feature 4: Quantitative Workflows
- **T1.F4.1**: Verify that the workflow section renders the `Market data ingestion` header.
- **T1.F4.2**: Verify that the workflow section renders the `Technical indicators` and `ML prediction` headers.
- **T1.F4.3**: Verify that the workflow section renders the `Portfolio optimization` header.
- **T1.F4.4**: Verify that the workflow section renders the `Risk analytics` header.
- **T1.F4.5**: Verify that the workflow section renders the `Backtesting` header.

#### Feature 5: Interactive Mockups
- **T1.F5.1**: Verify that the `candlestick chart` mockup is loaded in the DOM.
- **T1.F5.2**: Verify that the `portfolio dashboard` mockup is rendered with basic KPI widgets.
- **T1.F5.3**: Verify that the `correlation matrix` mockup table/grid is visible.
- **T1.F5.4**: Verify that the `risk heatmap` mockup grid is visible.
- **T1.F5.5**: Verify that at least one mockup element contains dynamic canvas or SVG chart nodes.

#### Feature 6: Infinite Logo Marquee
- **T1.F6.1**: Verify that the logo marquee container is visible and displayed on the viewport.
- **T1.F6.2**: Verify that the marquee contains Yahoo Finance, Polygon, and Finnhub logos.
- **T1.F6.3**: Verify that the marquee contains Alpha Vantage, NASDAQ, and NSE logos.
- **T1.F6.4**: Verify that the marquee contains the TradingView logo.
- **T1.F6.5**: Verify that the logo track is duplicated in the DOM structure for infinite seamless looping.

---

### Tier 2: Boundary & Corner Cases (30 Tests, 5 per Feature)
Validates system behavior under different viewports, interaction constraints, speed/movement adjustments, and edge inputs.

#### Feature 1: Aesthetic & Branding
- **T2.F1.1**: Verify that the dark luxury theme maintains high text contrast (at least 4.5:1 ratio) on high-DPI displays.
- **T2.F1.2**: Verify that background styles scale gracefully when moving to mobile viewports (e.g. 375px width).
- **T2.F1.3**: Verify that scrolling down the page preserves the navbar's backdrop-filter and transparency styles.
- **T2.F1.4**: Verify that rounded containers clipping prevents inner contents from overflowing their corners.
- **T2.F1.5**: Verify that global theme variables are defined in the computed styles of the `:root` element.

#### Feature 2: Navigation Links
- **T2.F2.1**: Verify that the navbar responds to mobile viewport layout constraints (collapsing links or showing a responsive menu).
- **T2.F2.2**: Verify that rapid navigation double-clicks do not cause page crash or state duplication.
- **T2.F2.3**: Verify that clicking a navigation link marks that link as visually active/highlighted.
- **T2.F2.4**: Verify navbar keyboard navigation by focusing and tab-cycling through all 6 links.
- **T2.F2.5**: Verify that navigation href targets are not null or empty strings.

#### Feature 3: Hero Section
- **T2.F3.1**: Verify that the Hero text wrap does not overflow the container on extremely narrow screens (320px).
- **T2.F3.2**: Verify Hero spacing and positioning on ultra-wide viewports (2560px+).
- **T2.F3.3**: Verify entrance animations on the Hero section run correctly by querying motion transition attributes.
- **T2.F3.4**: Verify text selection on the Hero title matches brand accent highlight colors.
- **T2.F3.5**: Verify Hero rendering respects user settings for reduced motion (no transitions/animations).

#### Feature 4: Quantitative Workflows
- **T2.F4.1**: Verify vertical stacking of the 6 workflows when scaled down to mobile viewports.
- **T2.F4.2**: Verify that hovering over a workflow card triggers highlight classes and scale animations.
- **T2.F4.3**: Verify that clicking workflow reference nodes scrolls the viewport with proper offset to avoid navbar occlusion.
- **T2.F4.4**: Verify that workflow card text adapts gracefully without breaking the layout when using long mock text descriptions.
- **T2.F4.5**: Verify that the system renders fallback contents correctly if individual workflow sub-configurations fail.

#### Feature 5: Interactive Mockups
- **T2.F5.1**: Verify responsive resizing of the candlestick chart mockup when the viewport is resized dynamically.
- **T2.F5.2**: Verify that hovering over a correlation matrix cell renders an interactive tooltip at the correct coordinates.
- **T2.F5.3**: Verify that interacting with portfolio weights recalculates performance stats correctly.
- **T2.F5.4**: Verify risk heatmap changes colors/states in response to risk metric toggles.
- **T2.F5.5**: Verify that charts load a clean empty/loading state if data arrays are empty.

#### Feature 6: Infinite Logo Marquee
- **T2.F6.1**: Verify that hovering over the logo marquee pauses or slows down the infinite scroll animation.
- **T2.F6.2**: Verify marquee animation duration in CSS satisfies speed limits (preventing fast, disorienting spin).
- **T2.F6.3**: Verify marquee behavior on small screens (keeps horizontal layout and does not wrap to vertical lines).
- **T2.F6.4**: Verify logo image load fallback (displays textual alternative if logo path fails).
- **T2.F6.5**: Verify that the infinite scrolling animation is infinite (infinite keyframes or looping wrapper).

---

### Tier 3: Cross-Feature Combinations (6 Tests)
Validates interactions that cross multiple feature boundaries (e.g. navbar and workflows, mockups and theme).

- **T3.COMB.1**: **Navbar Navigation to Workflows** - Click "Platform" or "Launch Terminal" in the navbar, and verify that the viewport scrolls to the respective Workflow section and focuses the element.
- **T3.COMB.2**: **Theme Consistency inside Mockups** - Verify that interactive mockups (candlestick chart, risk heatmap) inherit the theme color styling from the `bg-luxury-black` variables.
- **T3.COMB.3**: **Marquee & Hero Section Co-existence** - Verify that on mobile viewports, the Hero text section does not overlap the infinite marquee, maintaining correct vertical spacing.
- **T3.COMB.4**: **Navbar CTA and Workspace Activation** - Click "Launch Terminal" in the navbar, which activates the terminal view/modal, showing the corresponding mockup dashboard updated.
- **T3.COMB.5**: **Responsive Mockups and Layout Re-flow** - Dynamically change the viewport size from desktop to mobile and verify both the active Workflow card and its nested mockup (candlestick chart) resize concurrently.
- **T3.COMB.6**: **Interactive Workflow & Mockup Sync** - Toggle a workflow tab (e.g. "Risk analytics") and verify that the active mockup displays the correct mockup type (e.g., risk heatmap) styled inside the dark luxury container.

---

### Tier 4: Real-World Application Scenarios (5 Tests)
Validates end-to-end, multi-step user workflows that mimic actual institutional quant analyst behavior.

- **T4.SCEN.1**: **Full Visitor Onboarding & Discovery**
  1. User lands on page, verifies Hero text "Institutional Quantitative Intelligence".
  2. User scrolls to the infinite marquee and hovers to inspect partner logos.
  3. User scrolls to the "Market data ingestion" and "Technical indicators" workflows to read details.
  4. User clicks "Launch Terminal" in the navbar to open the application workspace.
- **T4.SCEN.2**: **Quant Analyst Research & Analysis**
  1. User navigates to the "Technical indicators" workflow section.
  2. User interacts with the candlestick chart mockup to view price bars.
  3. User toggles the "ML prediction" workflow card, loading the prediction matrix.
  4. User verifies the updated status indicators.
- **T4.SCEN.3**: **Risk Manager Portfolio Simulation**
  1. User navigates to the "Portfolio optimization" workflow section.
  2. User inputs or slides values in the portfolio mockup to adjust asset allocations.
  3. User moves to "Risk analytics" workflow to inspect the correlation matrix and risk heatmap.
  4. User verifies that the risk metrics are consistent.
- **T4.SCEN.4**: **Interactive Terminal Launch & Return**
  1. User clicks "Launch Terminal" on the sticky navbar.
  2. User runs a mock simulation in the terminal.
  3. User clicks "Research" in the navbar to return to the landing content.
  4. User verifies that the landing page has scroll-positioned to the Research section.
- **T4.SCEN.5**: **Mobile User Navigation & Interaction**
  1. Mobile browser accesses the site.
  2. Verifies that the navigation links are responsive.
  3. Scrolls down to the marquee and validates smooth horizontal layout.
  4. Swipes/taps through the interactive mockups.
  5. Verifies zero layout shifts or clipping.

---

## 3. Directory Layout & Setup

The E2E tests are located in the `frontend/tests` directory:

```
frontend/
├── playwright.config.ts        # Playwright global configuration
└── tests/
    ├── verify_design.spec.ts   # Existing design systems tests
    ├── tier1.spec.ts           # [Planned] Tier 1: Feature Coverage tests
    ├── tier2.spec.ts           # [Planned] Tier 2: Boundary & Corner tests
    ├── tier3.spec.ts           # [Planned] Tier 3: Cross-Feature Combination tests
    └── tier4.spec.ts           # [Planned] Tier 4: Real-World Scenario tests
```

### Verification of Configuration
- The `playwright.config.ts` has been verified and includes:
  - Base URL: `http://localhost:3000`
  - Targets: Chromium, Firefox, WebKit
  - Web Server configuration (`npm run dev`)
  - Integration target directory: `./tests`

---

## 4. How to Run E2E Tests

Navigate to the `frontend/` directory and execute the following commands:

```bash
# Run all E2E tests
npm run test:e2e

# Run tests in UI mode
npm run test:e2e:ui

# Run specific tier test file
npx playwright test tests/tier1.spec.ts
```
