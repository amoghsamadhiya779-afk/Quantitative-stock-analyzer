import { test, expect } from "@playwright/test";

test.describe("Ventriloc Design System Verification", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the dashboard page
    await page.goto("/");
  });

  test("should verify canvas/background color is Mist (#efefef)", async ({ page }) => {
    // Canvas/background color is Mist (#efefef, i.e., rgb(239, 239, 239)) on the body/main container element
    const body = page.locator("body");
    const bgColor = await body.evaluate((el) => window.getComputedStyle(el).backgroundColor);
    expect(bgColor).toBe("rgb(239, 239, 239)");
  });

  test("should verify cards are white (#ffffff) with 8px border-radius", async ({ page }) => {
    // Cards are white (#ffffff, i.e., rgb(255, 255, 255)) with an 8px border-radius.
    // Querying cards using glass-card and surface background-based classes
    const cards = page.locator(".glass-card, [class*='bg-surface'], [class*='bg-card']");
    
    // Ensure at least one card is present for verification
    await expect(cards.first()).toBeVisible();
    const count = await cards.count();
    
    for (let i = 0; i < count; i++) {
      const card = cards.nth(i);
      const bgColor = await card.evaluate((el) => window.getComputedStyle(el).backgroundColor);
      const borderRadius = await card.evaluate((el) => window.getComputedStyle(el).borderRadius);
      
      expect(bgColor).toBe("rgb(255, 255, 255)");
      expect(borderRadius).toBe("8px");
    }
  });

  test("should verify buttons have a 20px border-radius", async ({ page }) => {
    // Buttons have a 20px border-radius (non-navigation buttons have 20px, navigation buttons are pill-shaped)
    const buttons = page.locator("button");
    
    // Ensure at least one button is present for verification
    await expect(buttons.first()).toBeVisible();
    const count = await buttons.count();
    
    for (let i = 0; i < count; i++) {
      const button = buttons.nth(i);
      const className = await button.getAttribute("class") || "";
      const borderRadius = await button.evaluate((el) => window.getComputedStyle(el).borderRadius);
      
      if (className.includes("rounded-[200px]") || className.includes("rounded-full")) {
        // Navigation buttons are pill-shaped (200px border-radius)
        expect(borderRadius).toBe("200px");
      } else {
        // Non-navigation buttons have a 20px border-radius
        expect(borderRadius).toBe("20px");
      }
    }
  });

  test("should verify centered 1200px layout of the main page container", async ({ page }) => {
    // Centered 1200px layout (max-width of the main page container is 1200px and it's centered)
    // We target the main layout container which is the child of the main element and has max-width max-w-[1200px]
    const mainContainer = page.locator("main > div.max-w-\\[1200px\\]").first();
    await expect(mainContainer).toBeVisible();

    const maxWidth = await mainContainer.evaluate((el) => window.getComputedStyle(el).maxWidth);
    expect(maxWidth).toBe("1200px");

    // Margins should be equal to verify centering
    const marginLeft = await mainContainer.evaluate((el) => window.getComputedStyle(el).marginLeft);
    const marginRight = await mainContainer.evaluate((el) => window.getComputedStyle(el).marginRight);
    expect(marginLeft).toBe(marginRight);
  });

  test("should verify floating capsule navigation has a 200px border-radius", async ({ page }) => {
    // Floating capsule navigation has a 200px border-radius
    // We locate the container of the navigation pills by filtering divs containing the "Analyst Dashboard" button
    const navContainer = page.locator("div").filter({
      has: page.locator("button", { hasText: "Analyst Dashboard" })
    }).first();
    
    await expect(navContainer).toBeVisible();
    
    const className = await navContainer.getAttribute("class") || "";
    const hasNavClass = className.includes("rounded-[200px]") || className.includes("rounded-nav");
    expect(hasNavClass).toBe(true);

    const borderRadius = await navContainer.evaluate((el) => window.getComputedStyle(el).borderRadius);
    expect(borderRadius).toBe("200px");
  });
});
