import { test, expect } from "@playwright/test";

test.describe("Tier 5: Adversarial E2E Tests - Challenger 1", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("T5.CH1.1: Verify Backtesting state race condition (Strategy swap during active simulation)", async ({ page }) => {
    // Switch to Backtesting workflow
    await page.locator("button", { hasText: /^Backtesting$/ }).click();

    // Click "Run Backtest"
    const runBtn = page.locator("button", { hasText: /Run Backtest/ });
    await runBtn.click();

    // Verify the loader is visible
    const loader = page.locator("text=Processing backtest simulation...");
    await expect(loader).toBeVisible();

    // While simulating, click another strategy button (e.g., Mean Reversion)
    const meanReversionBtn = page.locator("button", { hasText: /Mean Reversion/ });
    
    // Verify that the strategy button is disabled during active simulation
    await expect(meanReversionBtn).toBeDisabled();

    // Wait for the simulation timeout (800ms + margin)
    await page.waitForTimeout(1000);
    await expect(loader).not.toBeVisible();
  });

  test("T5.CH1.2: Verify Portfolio Weight Recalculation rounding mismatch (>100%)", async ({ page }) => {
    // Switch to Portfolio optimization workflow
    await page.locator("button", { hasText: /^Portfolio optimization$/ }).click();

    // Locate the sliders for AAPL, MSFT, and NVDA
    const aaplSlider = page.locator("div").filter({ has: page.locator("span", { hasText: /^AAPL$/ }) }).locator("input[type='range']");
    const msftSlider = page.locator("div").filter({ has: page.locator("span", { hasText: /^MSFT$/ }) }).locator("input[type='range']");
    const nvdaSlider = page.locator("div").filter({ has: page.locator("span", { hasText: /^NVDA$/ }) }).locator("input[type='range']");

    await expect(aaplSlider).toBeVisible();

    // Set weights of AAPL to 100, which forces MSFT and NVDA to 0
    await aaplSlider.fill("100");
    await page.waitForTimeout(200);

    // Now set AAPL to 66.7
    await aaplSlider.fill("66.7");
    await page.waitForTimeout(200);

    // Locate the percentage labels for AAPL, MSFT, and NVDA
    const aaplLabel = page.locator("div").filter({ has: page.locator("span", { hasText: /^AAPL$/ }) }).locator("span").nth(1);
    const msftLabel = page.locator("div").filter({ has: page.locator("span", { hasText: /^MSFT$/ }) }).locator("span").nth(1);
    const nvdaLabel = page.locator("div").filter({ has: page.locator("span", { hasText: /^NVDA$/ }) }).locator("span").nth(1);

    const aaplText = await aaplLabel.textContent();
    const msftText = await msftLabel.textContent();
    const nvdaText = await nvdaLabel.textContent();

    const wAAPL = parseFloat(aaplText?.replace("%", "") || "0");
    const wMSFT = parseFloat(msftText?.replace("%", "") || "0");
    const wNVDA = parseFloat(nvdaText?.replace("%", "") || "0");

    const total = wAAPL + wMSFT + wNVDA;

    // Verify the total weight sums up to exactly 100
    expect(total).toBe(100);
  });

  test("T5.CH1.3: Verify Risk Analytics HTML semantics (g tags inside div grid)", async ({ page }) => {
    // Switch to Risk analytics workflow
    await page.locator("button", { hasText: /^Risk analytics$/ }).click();

    // Check that there is a grid div
    const gridContainer = page.locator("div.grid-cols-6");
    await expect(gridContainer).toBeVisible();

    // Verify that <g> tags are replaced and there are exactly 0 <g> tags inside the grid div container
    const gTags = gridContainer.locator("g");
    const count = await gTags.count();
    expect(count).toBe(0);
  });

  test("T5.CH1.4: Verify Market Data Ingestion console pause and clear state behavior", async ({ page }) => {
    // Switch to Market data ingestion workflow
    await page.locator("button", { hasText: /^Market data ingestion$/ }).click();

    // Ensure logs are active
    const logConsole = page.locator("div.overflow-y-auto");
    await expect(logConsole).toBeVisible();

    // Locate play/pause button and trash/clear button
    const pauseBtn = page.locator("div.flex.items-center.gap-2 button").first();
    const clearBtn = page.locator("div.flex.items-center.gap-2 button").nth(1);

    // Pause the feed
    await pauseBtn.click();
    await page.waitForTimeout(100);

    // Clear the logs
    await clearBtn.click();

    // Verify it displays the waiting fallback message
    const fallbackMessage = page.locator("text=Waiting for data streams...");
    await expect(fallbackMessage).toBeVisible();

    // Wait 1 second to ensure no new logs arrive (since we are paused)
    await page.waitForTimeout(1000);
    await expect(fallbackMessage).toBeVisible();

    // Resume streaming
    await pauseBtn.click();

    // Verify logs resume and the fallback message disappears
    await expect(fallbackMessage).not.toBeVisible();
    
    // Verify there is at least one log row now
    const logRow = logConsole.locator("div").first();
    await expect(logRow).toBeVisible();
  });

  test("T5.CH1.5: Verify Technical Indicators SVG path coordinates robustness", async ({ page }) => {
    // Switch to Technical indicators workflow
    await page.locator("button", { hasText: /^Technical indicators$/ }).click();

    // Locate the EMA path in the SVG (EMA path has stroke="#f97316")
    const emaPath = page.locator("svg path[stroke='#f97316']");
    await expect(emaPath).toBeVisible();
    const dAttribute = await emaPath.getAttribute("d");
    
    expect(dAttribute).not.toBeNull();
    expect(dAttribute).not.toContain("NaN");
    expect(dAttribute).not.toContain("Infinity");
  });
});
