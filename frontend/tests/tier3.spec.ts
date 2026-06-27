import { test, expect } from "@playwright/test";

test.describe("Tier 3: Cross-Feature Combinations (6 Tests)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("T3.COMB.1: Navbar Navigation to Workflows smooth scroll", async ({ page }) => {
    // Verify "Platform" click scrolls to workflows (#platform)
    const platformLink = page.locator("header nav a").filter({ hasText: /^Platform$/ });
    await expect(platformLink).toBeVisible();
    
    // Get initial scroll position
    const initialScrollY = await page.evaluate(() => window.scrollY);
    expect(initialScrollY).toBe(0);
    
    // Click Platform link and wait for scroll
    await platformLink.click();
    await page.waitForTimeout(1000); // Allow Lenis smooth scroll to finish
    
    const scrolledScrollY = await page.evaluate(() => window.scrollY);
    expect(scrolledScrollY).toBeGreaterThan(0);
    
    // Check if the #platform element is now closer to the top of the viewport
    const platformSection = page.locator("#platform");
    const platformRect = await platformSection.boundingBox();
    expect(platformRect).not.toBeNull();
    expect(platformRect!.y).toBeLessThan(200); // Should scroll it close to header (header is sticky, ~60-80px height)

    // Verify "Launch Terminal" click scrolls to #launch-terminal
    const terminalLink = page.locator("header nav a").filter({ hasText: /^Launch Terminal$/ });
    await terminalLink.click();
    await page.waitForTimeout(1000);
    
    const terminalSection = page.locator("#launch-terminal");
    const terminalRect = await terminalSection.boundingBox();
    expect(terminalRect).not.toBeNull();
    expect(terminalRect!.y).toBeLessThan(200);
  });

  test("T3.COMB.2: Theme Consistency inside Mockup charts", async ({ page }) => {
    // Switch to Technical indicators workflow to display the candlestick chart
    await page.locator("button", { hasText: /^Technical indicators$/ }).click();
    
    // Check SVG exists and has the expected grid text stroke/fill conforming to dark luxury theme
    const chartTitle = page.locator("h2", { hasText: "Dynamic Candlestick Chart & Overlays" });
    await expect(chartTitle).toBeVisible();
    
    const svg = page.locator("svg").first();
    await expect(svg).toBeVisible();
    
    // Verify SVG grid line text adapt to dark theme (rgba(255,255,255,0.4) text fill)
    const textElement = svg.locator("text").first();
    await expect(textElement).toHaveAttribute("fill", /rgba\(255, ?255, ?255, ?0\.\4\)/);
    
    // Verify accent colors inside SVG (EMA (20) line has stroke="#f97316")
    const emaLine = svg.locator("path[stroke='#f97316']");
    await expect(emaLine).toBeVisible();
    
    // Check background of the chart container (dark luxury theme #0a0a0a)
    const container = svg.locator("..");
    const bgColor = await container.evaluate((el) => window.getComputedStyle(el).backgroundColor);
    expect(bgColor).toBe("rgb(10, 10, 10)");
  });

  test("T3.COMB.3: Marquee & Hero Section layout co-existence", async ({ page }) => {
    // Set mobile viewport 375x667
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Locate Hero and Marquee
    const hero = page.locator("h2", { hasText: "Institutional Quantitative Intelligence" }).locator("..");
    const marquee = page.locator(".animate-marquee").locator(".."); // Parent of marquee, rounded-[24px]
    
    await expect(hero).toBeVisible();
    await expect(marquee).toBeVisible();
    
    // Get bounding boxes
    const heroBox = await hero.boundingBox();
    const marqueeBox = await marquee.boundingBox();
    
    expect(heroBox).not.toBeNull();
    expect(marqueeBox).not.toBeNull();
    
    // Verify they are displayed simultaneously in vertical sequence without overlapping
    // Hero should be fully above the marquee container
    expect(heroBox!.y + heroBox!.height).toBeLessThanOrEqual(marqueeBox!.y);
    
    // Verify they fit within width
    expect(heroBox!.x + heroBox!.width).toBeLessThanOrEqual(375);
    expect(marqueeBox!.x + marqueeBox!.width).toBeLessThanOrEqual(375);
  });

  test("T3.COMB.4: Navbar CTA and Workspace Activation modal", async ({ page }) => {
    // Clicking "Launch Terminal" displays the interactive workspace/terminal section
    const terminalLink = page.locator("header nav a").filter({ hasText: /^Launch Terminal$/ });
    await terminalLink.click();
    
    // Verify terminal section is displayed (visible in viewport)
    const workspace = page.locator("#launch-terminal");
    await expect(workspace).toBeVisible();
    
    // Verify that corresponding active control panels are highlighted/rendered properly
    // Status panel (Compute Online / Syncing Network)
    const statusIndicator = workspace.locator("div.animate-pulse");
    await expect(statusIndicator).toBeVisible();
    
    // Verify Custom Select components are present
    const globalNodeSelect = workspace.locator("span", { hasText: "Global Node" }).locator("..");
    await expect(globalNodeSelect).toBeVisible();
  });

  test("T3.COMB.5: Responsive Mockups and Layout Re-flow correlation", async ({ page }) => {
    // Start at desktop viewport
    await page.setViewportSize({ width: 1280, height: 800 });
    
    // Select a workflow tab
    const riskTab = page.locator("button", { hasText: /^Risk analytics$/ });
    await riskTab.click();
    
    const activeTab = page.locator("button.bg-white.text-black");
    const mockupContainer = page.locator("h3", { hasText: "Cross-Asset Correlation Matrix" }).locator("ancestor::div.ventriloc-card").first();
    
    await expect(activeTab).toBeVisible();
    await expect(mockupContainer).toBeVisible();
    
    // Bounding boxes in desktop
    const desktopTabBox = await activeTab.boundingBox();
    const desktopMockupBox = await mockupContainer.boundingBox();
    
    expect(desktopTabBox).not.toBeNull();
    expect(desktopMockupBox).not.toBeNull();
    
    // Resize viewport to mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500); // Allow browser reflow
    
    // Bounding boxes in mobile
    const mobileTabBox = await activeTab.boundingBox();
    const mobileMockupBox = await mockupContainer.boundingBox();
    
    expect(mobileTabBox).not.toBeNull();
    expect(mobileMockupBox).not.toBeNull();
    
    // Verify widths adapted dynamically
    expect(mobileTabBox!.width).toBeLessThan(desktopTabBox!.width);
    expect(mobileMockupBox!.width).toBeLessThan(desktopMockupBox!.width);
  });

  test("T3.COMB.6: Interactive Workflow & Mockup Sync display state", async ({ page }) => {
    // Toggle to Risk analytics and verify correlation matrix and heatmap render
    await page.locator("button", { hasText: /^Risk analytics$/ }).click();
    const matrixHeader = page.locator("h3", { hasText: "Cross-Asset Correlation Matrix" });
    const heatmapHeader = page.locator("h3", { hasText: "Sector Exposure Heatmap" });
    await expect(matrixHeader).toBeVisible();
    await expect(heatmapHeader).toBeVisible();
    
    // Toggle to Portfolio optimization and verify efficient frontier model render
    await page.locator("button", { hasText: /^Portfolio optimization$/ }).click();
    const frontierHeader = page.locator("h2", { hasText: "Efficient Frontier Frontier Model" });
    await expect(frontierHeader).toBeVisible();
    
    // Heatmap and correlation matrix should be hidden
    await expect(matrixHeader).not.toBeVisible();
    await expect(heatmapHeader).not.toBeVisible();
  });
});
