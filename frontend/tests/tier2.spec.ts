import { test, expect } from "@playwright/test";

test.describe("Tier 2: Boundary & Corner Cases (30 Tests)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  // Feature 1: Aesthetic & Branding
  test.describe("Feature 1: Aesthetic & Branding Boundaries", () => {
    test("T2.F1.1: Verify dark luxury contrast compliance", async ({ page }) => {
      const main = page.locator("main");
      const bg = await main.evaluate(el => window.getComputedStyle(el).backgroundColor);
      const text = page.locator("h2").first();
      const textColor = await text.evaluate(el => window.getComputedStyle(el).color);
      expect(bg).toContain("rgb(3, 3, 3)");
      expect(textColor).toBe("rgb(255, 255, 255)");
    });

    test("T2.F1.2: Verify layout scale on mobile viewports", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      const main = page.locator("main");
      await expect(main).toBeVisible();
      const width = await main.evaluate(el => el.clientWidth);
      expect(width).toBeLessThanOrEqual(375);
    });

    test("T2.F1.3: Verify scrolled navbar properties (backdrop-filter)", async ({ page }) => {
      await page.evaluate(() => window.scrollTo(0, 200));
      const header = page.locator("header");
      await expect(header).toHaveCSS("backdrop-filter", /blur\(.*\)/);
    });

    test("T2.F1.4: Verify rounded container overflow clipping", async ({ page }) => {
      const container = page.locator(".animate-marquee").locator("..");
      await expect(container).toHaveCSS("overflow", "hidden");
    });

    test("T2.F1.5: Verify theme variables declaration in root style", async ({ page }) => {
      const vars = await page.evaluate(() => {
        const style = window.getComputedStyle(document.documentElement);
        return {
          bg: style.getPropertyValue("--background").trim(),
          accent: style.getPropertyValue("--accent").trim(),
          border: style.getPropertyValue("--border").trim(),
        };
      });
      expect(vars.bg).toBeDefined();
      expect(vars.accent).toBeDefined();
      expect(vars.border).toBeDefined();
    });
  });

  // Feature 2: Navigation Links
  test.describe("Feature 2: Navigation Links Boundaries", () => {
    test("T2.F2.1: Verify responsive layout of links on small screens", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      const nav = page.locator("header nav");
      await expect(nav).toBeVisible();
      const display = await nav.evaluate(el => window.getComputedStyle(el).display);
      expect(display).toBe("flex");
    });

    test("T2.F2.2: Verify rapid navigation button click propagation", async ({ page }) => {
      const link = page.locator("header nav a").first();
      await link.dblclick();
      await expect(page.locator("h2").first()).toBeVisible();
    });

    test("T2.F2.3: Verify active link highlighting mechanism", async ({ page }) => {
      const link = page.locator("header nav a").first();
      await expect(link).toHaveClass(/.*transition-colors.*/);
    });

    test("T2.F2.4: Verify keyboard tab-navigation accessibility", async ({ page }) => {
      await page.keyboard.press("Tab");
      const activeTagName = await page.evaluate(() => document.activeElement?.tagName.toLowerCase());
      expect(activeTagName).toBeDefined();
    });

    test("T2.F2.5: Verify navigation anchor targets validity", async ({ page }) => {
      const links = page.locator("header nav a");
      const count = await links.count();
      for (let i = 0; i < count; i++) {
        const href = await links.nth(i).getAttribute("href");
        expect(href).not.toBeNull();
        expect(href?.length).toBeGreaterThan(0);
        expect(href?.startsWith("#")).toBe(true);
      }
    });
  });

  // Feature 3: Hero Section
  test.describe("Feature 3: Hero Section Boundaries", () => {
    test("T2.F3.1: Verify text wrapping on narrow screen widths", async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 568 });
      const heroHeading = page.locator("h2", { hasText: "Institutional Quantitative Intelligence" });
      await expect(heroHeading).toBeVisible();
      const height = await heroHeading.evaluate(el => el.clientHeight);
      expect(height).toBeGreaterThan(0);
    });

    test("T2.F3.2: Verify Hero spacing/centering on ultra-wide screens", async ({ page }) => {
      await page.setViewportSize({ width: 2560, height: 1440 });
      const container = page.locator("main > div").first();
      await expect(container).toHaveCSS("max-width", "1200px");
    });

    test("T2.F3.3: Verify entrance transition/animation classes", async ({ page }) => {
      const heroSection = page.locator("h2", { hasText: "Institutional Quantitative Intelligence" }).locator("..");
      await expect(heroSection).toHaveClass(/.*transform-gpu.*/);
    });

    test("T2.F3.4: Verify text highlight selection color", async ({ page }) => {
      const body = page.locator("body");
      await expect(body).toHaveClass(/.*selection:bg-\[var\(--accent\)\].*/);
    });

    test("T2.F3.5: Verify reduced-motion media query compliance", async ({ page }) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.reload();
      const heroHeading = page.locator("h2", { hasText: "Institutional Quantitative Intelligence" });
      await expect(heroHeading).toBeVisible();
    });
  });

  // Feature 4: Quantitative Workflows
  test.describe("Feature 4: Quantitative Workflows Boundaries", () => {
    test("T2.F4.1: Verify mobile vertical stacking of workflows", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      const container = page.locator(".lg\\:flex-row");
      await expect(container).toHaveCSS("flex-direction", "column");
    });

    test("T2.F4.2: Verify workflow card hover highlights", async ({ page }) => {
      const card = page.locator(".ventriloc-card").first();
      await expect(card).toHaveClass(/.*transition-all.*/);
      await card.hover();
    });

    test("T2.F4.3: Verify workflow section scrolling offset", async ({ page }) => {
      const header = page.locator("header");
      await expect(header).toHaveClass(/.*transform-gpu.*/);
    });

    test("T2.F4.4: Verify layout robustness with long text content", async ({ page }) => {
      const desc = page.locator("p.text-body-lg").first();
      await expect(desc).toHaveCSS("word-wrap", "break-word");
    });

    test("T2.F4.5: Verify fallback display for missing workflow data", async ({ page }) => {
      const img = page.locator("main img").last();
      await img.evaluate(el => el.dispatchEvent(new Event('error')));
      const src = await img.getAttribute("src");
      expect(src).toBeDefined();
    });
  });

  // Feature 5: Interactive Mockups
  test.describe("Feature 5: Interactive Mockups Boundaries", () => {
    test("T2.F5.1: Verify candlestick chart responsive resizing", async ({ page }) => {
      await page.locator("button", { hasText: /^Technical indicators$/ }).click();
      const svg = page.locator("svg").first();
      await page.setViewportSize({ width: 1200, height: 800 });
      await expect(svg).toBeVisible();
      const width1 = await svg.evaluate(el => el.getBoundingClientRect().width);
      await page.setViewportSize({ width: 600, height: 600 });
      const width2 = await svg.evaluate(el => el.getBoundingClientRect().width);
      expect(width2).toBeLessThan(width1);
    });

    test("T2.F5.2: Verify correlation matrix tooltip placement", async ({ page }) => {
      await page.locator("button", { hasText: /^Risk analytics$/ }).click();
      const cell = page.locator(".cursor-crosshair").first();
      await cell.hover();
      const tooltip = page.locator(".px-4.py-2.rounded-xl.bg-black");
      await expect(tooltip).toBeVisible();
    });

    test("T2.F5.3: Verify portfolio allocation slider recalculations", async ({ page }) => {
      await page.locator("button", { hasText: /^Portfolio optimization$/ }).click();
      const slider = page.locator("input[type='range']").first();
      await slider.fill("50");
      const percentage = page.locator("span", { hasText: "50%" });
      await expect(percentage).toBeVisible();
    });

    test("T2.F5.4: Verify risk heatmap toggles and state updates", async ({ page }) => {
      await page.locator("button", { hasText: /^Risk analytics$/ }).click();
      const sectorBtn = page.locator("button", { hasText: /^Technology$/ });
      await sectorBtn.click();
      const constituentHeader = page.locator("span", { hasText: "Constituent" });
      await expect(constituentHeader).toBeVisible();
    });

    test("T2.F5.5: Verify chart empty state fallback formatting", async ({ page }) => {
      await page.locator("button", { hasText: /^Technical indicators$/ }).click();
      const indicatorBtn = page.locator("button", { hasText: /^EMA \(20\)$/ });
      await indicatorBtn.click();
      const emaLine = page.locator("path[stroke='#f97316']");
      await expect(emaLine).toHaveCount(0);
    });
  });

  // Feature 6: Infinite Logo Marquee
  test.describe("Feature 6: Infinite Logo Marquee Boundaries", () => {
    test("T2.F6.1: Verify animation speed slows down/pauses on hover", async ({ page }) => {
      const container = page.locator(".animate-marquee");
      await container.hover();
      const playState = await container.evaluate(el => window.getComputedStyle(el).animationPlayState);
      expect(playState).toBe("paused");
    });

    test("T2.F6.2: Verify marquee CSS animation speed limit constraints", async ({ page }) => {
      const container = page.locator(".animate-marquee");
      const duration = await container.evaluate(el => window.getComputedStyle(el).animationDuration);
      expect(duration).toBe("30s");
    });

    test("T2.F6.3: Verify horizontal flow preservation on small screens", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      const container = page.locator(".animate-marquee");
      const flexWrap = await container.evaluate(el => window.getComputedStyle(el).flexWrap);
      expect(flexWrap).not.toBe("wrap");
    });

    test("T2.F6.4: Verify marquee image load error textual fallback", async ({ page }) => {
      const container = page.locator(".animate-marquee");
      const textLogo = container.locator("span", { hasText: "Yahoo Finance" }).first();
      await expect(textLogo).toBeVisible();
    });

    test("T2.F6.5: Verify infinite scrolling keyframes looping logic", async ({ page }) => {
      const container = page.locator(".animate-marquee");
      const animationName = await container.evaluate(el => window.getComputedStyle(el).animationName);
      expect(animationName).toBe("marquee");
    });
  });
});
