import { test, expect } from "@playwright/test";

test.describe("Tier 1: Feature Coverage (30 Tests)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  // Feature 1: Aesthetic & Branding
  test.describe("Feature 1: Aesthetic & Branding", () => {
    test("T1.F1.1: Verify dark luxury theme background class", async ({ page }) => {
      const main = page.locator("main");
      await expect(main).toHaveClass(/.*bg-luxury-black.*/);
    });

    test("T1.F1.2: Verify frosted glass utility classes", async ({ page }) => {
      const header = page.locator("header");
      await expect(header).toHaveClass(/.*backdrop-blur-md.*/);
    });

    test("T1.F1.3: Verify container cards rounded corners", async ({ page }) => {
      const marqueeContainer = page.locator(".animate-marquee").locator("..");
      await expect(marqueeContainer).toHaveClass(/.*rounded-\[24px\].*/);
    });

    test("T1.F1.4: Verify sticky/fixed navbar position", async ({ page }) => {
      const header = page.locator("header");
      await expect(header).toHaveCSS("position", "sticky");
    });

    test("T1.F1.5: Verify navbar backdrop-blur styling", async ({ page }) => {
      const header = page.locator("header");
      await expect(header).toHaveCSS("backdrop-filter", /blur\(.*\)/);
    });
  });

  // Feature 2: Navigation Links
  test.describe("Feature 2: Navigation Links", () => {
    test("T1.F2.1: Verify Platform link text and visibility", async ({ page }) => {
      const link = page.locator("header nav a").filter({ hasText: /^Platform$/ });
      await expect(link).toBeVisible();
    });

    test("T1.F2.2: Verify Research, Technology, and Documentation links", async ({ page }) => {
      const links = ["Research", "Technology", "Documentation"];
      for (const text of links) {
        const link = page.locator("header nav a").filter({ hasText: new RegExp(`^${text}$`) });
        await expect(link).toBeVisible();
      }
    });

    test("T1.F2.3: Verify GitHub link", async ({ page }) => {
      const link = page.locator("header nav a").filter({ hasText: /^GitHub$/ });
      await expect(link).toBeVisible();
    });

    test("T1.F2.4: Verify Launch Terminal CTA link", async ({ page }) => {
      const link = page.locator("header nav a").filter({ hasText: /^Launch Terminal$/ });
      await expect(link).toBeVisible();
    });

    test("T1.F2.5: Verify existence of all 6 required anchors", async ({ page }) => {
      const required = ["Platform", "Research", "Technology", "Documentation", "GitHub", "Launch Terminal"];
      for (const text of required) {
        const link = page.locator("header nav a").filter({ hasText: new RegExp(`^${text}$`) });
        await expect(link).toHaveCount(1);
      }
    });
  });

  // Feature 3: Hero Section
  test.describe("Feature 3: Hero Section", () => {
    test("T1.F3.1: Verify Hero text containing exact string", async ({ page }) => {
      const heroHeading = page.locator("h2", { hasText: "Institutional Quantitative Intelligence" });
      await expect(heroHeading).toBeVisible();
    });

    test("T1.F3.2: Verify Hero heading semantic tags", async ({ page }) => {
      const headings = page.locator("h1, h2");
      const heroHeading = headings.filter({ hasText: "Institutional Quantitative Intelligence" });
      await expect(heroHeading).toHaveCount(1);
      const tagName = await heroHeading.evaluate(el => el.tagName.toLowerCase());
      expect(["h1", "h2"]).toContain(tagName);
    });

    test("T1.F3.3: Verify supporting subtitle is present", async ({ page }) => {
      const subtitle = page.locator("p", { hasText: /Nexus Quant synthesizes/ });
      await expect(subtitle).toBeVisible();
    });

    test("T1.F3.4: Verify Hero section visibility on page load", async ({ page }) => {
      const heroSection = page.locator("h2", { hasText: "Institutional Quantitative Intelligence" }).locator("..");
      await expect(heroSection).toBeVisible();
    });

    test("T1.F3.5: Verify text contrast ratio alignment", async ({ page }) => {
      const heroHeading = page.locator("h2", { hasText: "Institutional Quantitative Intelligence" });
      const color = await heroHeading.evaluate(el => window.getComputedStyle(el).color);
      expect(color).toBe("rgb(255, 255, 255)");
    });
  });

  // Feature 4: Quantitative Workflows
  test.describe("Feature 4: Quantitative Workflows", () => {
    test("T1.F4.1: Verify Market data ingestion workflow header", async ({ page }) => {
      const btn = page.locator("button", { hasText: /^Market data ingestion$/ });
      await expect(btn).toBeVisible();
    });

    test("T1.F4.2: Verify Technical indicators and ML prediction workflow headers", async ({ page }) => {
      const btn1 = page.locator("button", { hasText: /^Technical indicators$/ });
      const btn2 = page.locator("button", { hasText: /^ML prediction$/ });
      await expect(btn1).toBeVisible();
      await expect(btn2).toBeVisible();
    });

    test("T1.F4.3: Verify Portfolio optimization workflow header", async ({ page }) => {
      const btn = page.locator("button", { hasText: /^Portfolio optimization$/ });
      await expect(btn).toBeVisible();
    });

    test("T1.F4.4: Verify Risk analytics workflow header", async ({ page }) => {
      const btn = page.locator("button", { hasText: /^Risk analytics$/ });
      await expect(btn).toBeVisible();
    });

    test("T1.F4.5: Verify Backtesting workflow header", async ({ page }) => {
      const btn = page.locator("button", { hasText: /^Backtesting$/ });
      await expect(btn).toBeVisible();
    });
  });

  // Feature 5: Interactive Mockups
  test.describe("Feature 5: Interactive Mockups", () => {
    test("T1.F5.1: Verify candlestick chart mockup presence", async ({ page }) => {
      await page.locator("button", { hasText: /^Technical indicators$/ }).click();
      const chartHeader = page.locator("h2", { hasText: "Dynamic Candlestick Chart & Overlays" });
      await expect(chartHeader).toBeVisible();
    });

    test("T1.F5.2: Verify portfolio dashboard mockup presence", async ({ page }) => {
      await page.locator("button", { hasText: /^Portfolio optimization$/ }).click();
      const dashboardHeader = page.locator("h2", { hasText: "Efficient Frontier Frontier Model" });
      await expect(dashboardHeader).toBeVisible();
    });

    test("T1.F5.3: Verify correlation matrix mockup presence", async ({ page }) => {
      await page.locator("button", { hasText: /^Risk analytics$/ }).click();
      const matrixHeader = page.locator("h3", { hasText: "Cross-Asset Correlation Matrix" });
      await expect(matrixHeader).toBeVisible();
    });

    test("T1.F5.4: Verify risk heatmap mockup presence", async ({ page }) => {
      await page.locator("button", { hasText: /^Risk analytics$/ }).click();
      const heatmapHeader = page.locator("h3", { hasText: "Sector Exposure Heatmap" });
      await expect(heatmapHeader).toBeVisible();
    });

    test("T1.F5.5: Verify mockup chart data elements (canvas/svg)", async ({ page }) => {
      await page.locator("button", { hasText: /^Technical indicators$/ }).click();
      const svg = page.locator("svg").first();
      await expect(svg).toBeVisible();
      const wicks = svg.locator("line");
      const bodies = svg.locator("rect");
      await expect(wicks.first()).toBeVisible();
      await expect(bodies.first()).toBeVisible();
    });
  });

  // Feature 6: Infinite Logo Marquee
  test.describe("Feature 6: Infinite Logo Marquee", () => {
    test("T1.F6.1: Verify marquee container visibility", async ({ page }) => {
      const container = page.locator(".animate-marquee");
      await expect(container).toBeVisible();
    });

    test("T1.F6.2: Verify presence of Yahoo Finance, Polygon, Finnhub logos", async ({ page }) => {
      const container = page.locator(".animate-marquee");
      await expect(container.locator("span", { hasText: "Yahoo Finance" }).first()).toBeVisible();
      await expect(container.locator("span", { hasText: "Polygon" }).first()).toBeVisible();
      await expect(container.locator("span", { hasText: "Finnhub" }).first()).toBeVisible();
    });

    test("T1.F6.3: Verify presence of Alpha Vantage, NASDAQ, NSE logos", async ({ page }) => {
      const container = page.locator(".animate-marquee");
      await expect(container.locator("span", { hasText: "Alpha Vantage" }).first()).toBeVisible();
      await expect(container.locator("span", { hasText: "NASDAQ" }).first()).toBeVisible();
      await expect(container.locator("span", { hasText: "NSE" }).first()).toBeVisible();
    });

    test("T1.F6.4: Verify presence of TradingView logo", async ({ page }) => {
      const container = page.locator(".animate-marquee");
      await expect(container.locator("span", { hasText: "TradingView" }).first()).toBeVisible();
    });

    test("T1.F6.5: Verify logo track duplication for loop behavior", async ({ page }) => {
      const container = page.locator(".animate-marquee");
      const tracks = container.locator("div.flex");
      await expect(tracks).toHaveCount(2);
    });
  });
});
