import { test, expect } from "@playwright/test";

test.describe("Tier 4: Real-World Application Scenarios (5 Tests)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("T4.SCEN.1: Full Visitor Onboarding & Discovery flow", async ({ page }) => {
    // User lands on page and reads Hero
    const heroHeading = page.locator("h2", { hasText: "Institutional Quantitative Intelligence" });
    await expect(heroHeading).toBeVisible();
    
    // User notices the supporting subtitle
    const subtitle = page.locator("p", { hasText: /Nexus Quant synthesizes/ });
    await expect(subtitle).toBeVisible();
    
    // User verifies the integration partner/source marquee is present
    const marquee = page.locator(".animate-marquee");
    await expect(marquee).toBeVisible();
    await expect(marquee.locator("span", { hasText: "Yahoo Finance" }).first()).toBeVisible();
    
    // User scrolls down to Platform/Workflow section
    const platformLink = page.locator("header nav a").filter({ hasText: /^Platform$/ });
    await platformLink.click();
    await page.waitForTimeout(800);
    
    // User reads and interacts with workflow buttons
    const initialTab = page.locator("button", { hasText: /^Market data ingestion$/ });
    await expect(initialTab).toBeVisible();
    
    const indicatorsTab = page.locator("button", { hasText: /^Technical indicators$/ });
    await indicatorsTab.click();
    await expect(page.locator("h2", { hasText: "Dynamic Candlestick Chart & Overlays" })).toBeVisible();
    
    // User decides to launch the workspace terminal
    const launchCta = page.locator("header nav a").filter({ hasText: /^Launch Terminal$/ });
    await launchCta.click();
    await page.waitForTimeout(800);
    
    // Verify the active workspace control bar is visible
    const controlBar = page.locator("#launch-terminal");
    await expect(controlBar).toBeVisible();
  });

  test("T4.SCEN.2: Quant Analyst Research & Analysis workspace", async ({ page }) => {
    // Analyst clicks Technical indicators
    const indicatorsTab = page.locator("button", { hasText: /^Technical indicators$/ });
    await indicatorsTab.click();
    
    // Verifies candlestick chart is present
    const chart = page.locator("h2", { hasText: "Dynamic Candlestick Chart & Overlays" });
    await expect(chart).toBeVisible();
    
    // Hovers over a candle element on the chart
    const candle = page.locator("svg line").first();
    await expect(candle).toBeVisible();
    await candle.hover();
    
    // Clicks ML prediction tab
    const mlTab = page.locator("button", { hasText: /^ML prediction$/ });
    await mlTab.click();
    
    // Verifies ML model selectors are visible
    const modelBtn = page.locator("button", { hasText: "Temporal Transformer" });
    await expect(modelBtn).toBeVisible();
    
    // Clicks Temporal Transformer model to see updated predictions
    await modelBtn.click();
    
    // Check that predictions details are shown (Inference Latency updates to 28ms)
    const latencyBlock = page.locator("span", { hasText: "inference latency" }).locator("..");
    await expect(latencyBlock).toContainText("28ms");
  });

  test("T4.SCEN.3: Risk Manager Portfolio Simulation & Heatmap interactions", async ({ page }) => {
    // Risk Manager clicks Portfolio optimization tab
    const portfolioTab = page.locator("button", { hasText: /^Portfolio optimization$/ });
    await portfolioTab.click();
    
    // Slides/updates expected asset allocation values (e.g. AAPL weight slider)
    const aaplSlider = page.locator("input[type='range']").first();
    await expect(aaplSlider).toBeVisible();
    await aaplSlider.fill("60");
    
    // Verify percentage label or metrics updated
    const aaplPercentage = page.locator("span", { hasText: "60%" });
    await expect(aaplPercentage).toBeVisible();
    
    // Navigates to Risk analytics workflow to inspect correlation matrix
    const riskTab = page.locator("button", { hasText: /^Risk analytics$/ });
    await riskTab.click();
    
    // Inspects correlation matrix
    const matrixHeader = page.locator("h3", { hasText: "Cross-Asset Correlation Matrix" });
    await expect(matrixHeader).toBeVisible();
    
    // Hovers cells for tooltips
    const cell = page.locator(".cursor-crosshair").first();
    await cell.hover();
    
    const tooltip = page.locator(".px-4.py-2.rounded-xl.bg-black");
    await expect(tooltip).toBeVisible();
    await expect(tooltip).toContainText(/AAPL/);
    
    // Clicks sector buttons on the risk heatmap
    const sectorBtn = page.locator("button", { hasText: /^Technology$/ });
    await sectorBtn.click();
    
    // Verify constituent table displays AAPL or other details
    const constituentHeader = page.locator("span", { hasText: "Constituent" });
    await expect(constituentHeader).toBeVisible();
    const aaplWeight = page.locator("span", { hasText: "AAPL" }).locator("..");
    await expect(aaplWeight).toContainText("35%");
  });

  test("T4.SCEN.4: Interactive Terminal Launch & Navbar Return session", async ({ page }) => {
    // User clicks Launch Terminal
    const launchCta = page.locator("header nav a").filter({ hasText: /^Launch Terminal$/ });
    await launchCta.click();
    await page.waitForTimeout(1000); // Wait for smooth scroll
    
    // Interacts with workspace: Change global node or select another asset
    const workspace = page.locator("#launch-terminal");
    await expect(workspace).toBeVisible();
    
    const targetAssetSelect = workspace.locator("span", { hasText: "Target Asset" }).locator("..");
    await expect(targetAssetSelect).toBeVisible();
    
    // Click "Research" navbar link to return
    const researchLink = page.locator("header nav a").filter({ hasText: /^Research$/ });
    await researchLink.click();
    await page.waitForTimeout(1000); // Wait for scroll
    
    // Checks that viewport is scrolled back to research/landing sections
    const heroSection = page.locator("#research");
    const heroRect = await heroSection.boundingBox();
    expect(heroRect).not.toBeNull();
    expect(heroRect!.y).toBeLessThan(200); // Hero section is back at the top area
  });

  test("T4.SCEN.5: Mobile User Navigation, Swipe, & Interaction verification", async ({ page }) => {
    // Sets mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Tab-cycles navbar links (Press tab 4 times)
    for (let i = 0; i < 4; i++) {
      await page.keyboard.press("Tab");
    }
    
    // Verify active focused element is present
    const activeElement = await page.evaluate(() => document.activeElement?.tagName.toLowerCase());
    expect(activeElement).toBeDefined();
    
    // Checks horizontal marquee overflow wrap properties
    const marqueeContainer = page.locator(".animate-marquee");
    const flexWrap = await marqueeContainer.evaluate((el) => window.getComputedStyle(el).flexWrap);
    expect(flexWrap).not.toBe("wrap");
    
    // Clicks/swipes mockups (toggles workflow tabs)
    const initialTab = page.locator("button", { hasText: /^Market data ingestion$/ });
    const analyticsTab = page.locator("button", { hasText: /^Risk analytics$/ });
    
    await expect(initialTab).toBeVisible();
    await expect(analyticsTab).toBeVisible();
    
    // Click risk analytics
    await analyticsTab.click();
    await expect(page.locator("h3", { hasText: "Cross-Asset Correlation Matrix" })).toBeVisible();
    
    // Verify no layout shift/clipping (checking main viewport width doesn't cause overflow-x scroll)
    const overflowX = await page.evaluate(() => {
      return window.innerWidth < document.documentElement.scrollWidth;
    });
    expect(overflowX).toBe(false); // No horizontal scroll/clipping
  });
});
