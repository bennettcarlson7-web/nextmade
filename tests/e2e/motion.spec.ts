import { expect, test } from "@playwright/test";

// The rest of the suite runs with reduced motion (see playwright.config.ts); this file checks the animation itself.
test.describe("homepage motion", () => {
  test.skip(({ isMobile }) => isMobile, "desktop only");

  test("the hero agent works through each product in turn", async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: "no-preference", viewport: { width: 1280, height: 900 } });
    const page = await context.newPage();
    await page.goto("/");
    const agent = page.locator("figure").filter({ hasText: "Illustration of how our AI products are designed to work" });
    await expect(agent.getByText("ClientFlow AI", { exact: true })).toBeVisible();
    await expect(agent.getByText("CommercePilot AI", { exact: true })).toBeVisible({ timeout: 20_000 });
    await context.close();
  });

  test("with reduced motion, the hero agent shows one finished example and stays still", async ({ page }) => {
    await page.goto("/");
    const agent = page.locator("figure").filter({ hasText: "Illustration of how our AI products are designed to work" });
    await expect(agent.getByText("Added to pipeline")).toBeVisible();
    await page.waitForTimeout(6000);
    await expect(agent.getByText("ClientFlow AI", { exact: true })).toBeVisible();
    await expect(agent.getByText("CommercePilot AI", { exact: true })).toHaveCount(0);
  });
});
