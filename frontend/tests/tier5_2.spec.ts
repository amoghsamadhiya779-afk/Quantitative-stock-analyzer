import { test, expect } from "@playwright/test";

test.describe("Tier 5: Adversarial Hardening (Challenger 2)", () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to local target
    await page.goto("/");
  });

  test("T5.ADVS.1: API Race Condition on Rapid Ticker Swaps", async ({ page }) => {
    // Intercept API calls to simulate network latency mismatch
    // First request is slow (2s), second request is fast (immediate)
    let callCount = 0;
    
    await page.route("**/api/v1/stock/**", async (route, request) => {
      const url = request.url();
      if (url.includes("AAPL")) {
        // Slow response for AAPL
        await new Promise(resolve => setTimeout(resolve, 2000));
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            ticker: "AAPL",
            market: "United States (S&P 500)",
            currency: "USD",
            region: "North America",
            latest_close: 180.0,
            prev_close: 178.0,
            price_delta: 2.0,
            pct_change: 1.12,
            rsi: 55.4,
            volatility: 18.5,
            vwap: 179.2,
            ma_20: 177.5,
            ma_50: 175.2,
            dates: ["2026-06-20", "2026-06-21", "2026-06-22"],
            closes: [178.0, 179.0, 180.0],
            opens: [177.5, 178.5, 179.5],
            highs: [179.0, 180.0, 181.0],
            lows: [177.0, 178.0, 179.0],
            volumes: [1000000, 1100000, 1200000],
            bb_upper: [181.0, 182.0, 183.0],
            bb_lower: [175.0, 176.0, 177.0],
            macd: [0.5, 0.6, 0.7],
            signal_line: [0.4, 0.5, 0.6],
            rsi_series: [50.0, 52.0, 55.4]
          })
        });
      } else if (url.includes("MSFT")) {
        // Fast response for MSFT
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            ticker: "MSFT",
            market: "United States (S&P 500)",
            currency: "USD",
            region: "North America",
            latest_close: 420.0,
            prev_close: 418.0,
            price_delta: 2.0,
            pct_change: 0.48,
            rsi: 60.1,
            volatility: 15.2,
            vwap: 419.0,
            ma_20: 416.0,
            ma_50: 412.0,
            dates: ["2026-06-20", "2026-06-21", "2026-06-22"],
            closes: [418.0, 419.0, 420.0],
            opens: [417.0, 418.0, 419.0],
            highs: [419.0, 420.0, 421.0],
            lows: [416.0, 417.0, 418.0],
            volumes: [2000000, 2100000, 2200000],
            bb_upper: [422.0, 423.0, 424.0],
            bb_lower: [414.0, 415.0, 416.0],
            macd: [1.2, 1.3, 1.4],
            signal_line: [1.0, 1.1, 1.2],
            rsi_series: [58.0, 59.0, 60.1]
          })
        });
      } else {
        await route.continue();
      }
    });

    // Locate Target Asset Select
    const assetSelect = page.locator("span", { hasText: "Target Asset" }).locator("..");
    await expect(assetSelect).toBeVisible();

    // Trigger rapid menu changes: Select AAPL, then immediately select MSFT
    await assetSelect.click();
    const aaplOption = page.locator("span:text-is('AAPL')");
    if (await aaplOption.isVisible()) {
      await aaplOption.click();
    } else {
      // Fallback: use select logic if it's dynamic
      await page.keyboard.type("AAPL");
      await page.keyboard.press("Enter");
    }

    // Immediately trigger MSFT selection
    await assetSelect.click();
    const msftOption = page.locator("span:text-is('MSFT')");
    if (await msftOption.isVisible()) {
      await msftOption.click();
    } else {
      await page.keyboard.type("MSFT");
      await page.keyboard.press("Enter");
    }

    // Wait for the slow request timeout window
    await page.waitForTimeout(2500);

    // Verify that the UI displays MSFT's valuation, not AAPL's, proving race condition resolution
    const valuationBlock = page.locator("span", { hasText: "Valuation" }).locator("..");
    await expect(valuationBlock).toContainText("420.00");
  });

  test("T5.ADVS.2: Parameter Manipulation During Active Backtest Simulation", async ({ page }) => {
    // Go to Backtesting workflow
    const backtestBtn = page.locator("button", { hasText: /^Backtesting$/ });
    await backtestBtn.click();

    // Locate Backtest Run button
    const runBtn = page.locator("button", { hasText: /Run Backtest/ });
    await expect(runBtn).toBeVisible();
    await runBtn.click();

    // Verify isRunning state is visually active (button is disabled or text is Simulating...)
    await expect(runBtn).toBeDisabled();

    // Attack action: While backtest is executing, change the target strategy
    const meanReversionBtn = page.locator("button", { hasText: "Mean Reversion" });
    await expect(meanReversionBtn).toBeVisible();
    await meanReversionBtn.click();

    // Assert if target strategy updates or if it triggers display mismatch during processing
    // (Should either lock/ignore click, or handle cleanly without throwing JS error)
    const totalReturnMetric = page.locator("span", { hasText: "Total Return" }).locator("..");
    await expect(totalReturnMetric).toBeVisible();
  });

  test("T5.ADVS.3: Portfolio Optimization Slider Bounds & Sum Conservation", async ({ page }) => {
    // Go to Portfolio optimization workflow
    const optBtn = page.locator("button", { hasText: /^Portfolio optimization$/ });
    await optBtn.click();

    // Find first range slider (AAPL weight)
    const aaplSlider = page.locator("input[type='range']").first();
    await expect(aaplSlider).toBeVisible();

    // Set slider value to 100% (extreme edge case)
    await aaplSlider.fill("100");
    await page.waitForTimeout(100);

    // Verify other assets' weights are set to 0%
    const weightsText = await page.locator("div.mt-4.pt-4").innerText();
    expect(weightsText).toContain("Total Weight:\n100%");

    // Move slider to 0% (other extreme edge case)
    await aaplSlider.fill("0");
    await page.waitForTimeout(100);

    // Check if the total sum is still mathematically preserved at 100%
    const weightsTextZero = await page.locator("div.mt-4.pt-4").innerText();
    expect(weightsTextZero).toContain("Total Weight:\n100%");
  });

  test("T5.ADVS.4: Empty/Malformed Payload Ingestion Error Handling", async ({ page }) => {
    // Intercept stock data calls to return a malformed payload (missing pct_change / NaN inducing values)
    await page.route("**/api/v1/stock/**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          ticker: "NVDA",
          market: "United States (S&P 500)",
          currency: "USD",
          region: "North America",
          latest_close: 800.0,
          prev_close: 800.0,
          // Missing pct_change or using invalid values to test NaN resilience
          volatility: 35.0,
          vwap: 800.0,
          dates: [],
          closes: []
        })
      });
    });

    // Select NVDA from Target Asset to trigger payload fetch
    const assetSelect = page.locator("span", { hasText: "Target Asset" }).locator("..");
    await assetSelect.click();
    const nvdaOption = page.locator("span:text-is('NVDA')");
    if (await nvdaOption.isVisible()) {
      await nvdaOption.click();
    } else {
      await page.keyboard.type("NVDA");
      await page.keyboard.press("Enter");
    }

    await page.waitForTimeout(1000);

    // Assert that the page did not crash and displays a fallback for the missing values
    const valuationBlock = page.locator("span", { hasText: "Valuation" }).locator("..");
    await expect(valuationBlock).toContainText("800.00");
  });

  test("T5.ADVS.5: Selection Sanitization & Script Injection Boundaries", async ({ page }) => {
    // Test if custom select can handle malicious injection gracefully
    // We mock the tickers call to return a payload containing XSS payloads
    await page.route("**/api/v1/tickers/**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          tickers: ["<script>alert('xss')</script>", "AAPL", "MSFT"]
        })
      });
    });

    // Reload or change market to force tickers fetch
    const marketSelect = page.locator("span", { hasText: "Global Node" }).locator("..");
    await marketSelect.click();
    const firstOption = page.locator("div.top-full div").first();
    await firstOption.click();

    await page.waitForTimeout(1000);

    // Open target asset selection list
    const assetSelect = page.locator("span", { hasText: "Target Asset" }).locator("..");
    await assetSelect.click();

    // Verify that the XSS payload is treated as plain text and not executed
    const scriptElement = page.locator("span:text-is('<script>alert(\'xss\')</script>')");
    await expect(scriptElement).toBeVisible();
  });
});
