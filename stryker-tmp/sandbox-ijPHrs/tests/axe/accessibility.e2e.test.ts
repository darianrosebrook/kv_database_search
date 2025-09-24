// @ts-nocheck
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { chromium, Browser, Page } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import path from "path";

describe("Accessibility (Axe-core) E2E Tests", () => {
  let browser: Browser;
  let page: Page;

  beforeAll(async () => {
    browser = await chromium.launch();
  });

  afterAll(async () => {
    await browser.close();
  });

  beforeEach(async () => {
    page = await browser.newPage();

    // Set up the test environment
    const testAppPath = path.join(__dirname, "../../apps/rag_web_search_tool/index.html");
    await page.goto(`file://${testAppPath}`);

    // Wait for the app to load
    await page.waitForSelector('[data-testid="search-input"], input[type="text"]', {
      timeout: 10000,
    });
  });

  afterEach(async () => {
    await page.close();
  });

  describe("Search Interface Accessibility", () => {
    it("should pass axe-core accessibility audit for search page", async () => {
      const axe = new AxeBuilder({ page });

      // Run accessibility audit
      const results = await axe.analyze();

      // Log violations for debugging
      if (results.violations.length > 0) {
        console.log("Accessibility violations found:");
        results.violations.forEach((violation, index) => {
          console.log(`${index + 1}. ${violation.id}: ${violation.description}`);
          console.log(`   Impact: ${violation.impact}`);
          console.log(`   Help: ${violation.help}`);
          console.log(`   Help URL: ${violation.helpUrl}`);
          console.log(`   Nodes: ${violation.nodes.length}`);
        });
      }

      // Assert no critical violations (WCAG AA compliance)
      const criticalViolations = results.violations.filter(
        (v) => v.impact === "critical" || v.impact === "serious"
      );

      expect(criticalViolations).toHaveLength(0);

      // Allow moderate violations for now, but log them
      const moderateViolations = results.violations.filter(
        (v) => v.impact === "moderate"
      );

      if (moderateViolations.length > 0) {
        console.warn(`Found ${moderateViolations.length} moderate accessibility violations`);
      }

      // Total violations should be minimal
      expect(results.violations.length).toBeLessThanOrEqual(5);
    });

    it("should have proper heading structure", async () => {
      const headings = await page.$$eval("h1, h2, h3, h4, h5, h6", (elements) =>
        elements.map((el) => ({
          tag: el.tagName.toLowerCase(),
          text: el.textContent?.trim(),
        }))
      );

      // Should have at least one h1
      const h1Headings = headings.filter((h) => h.tag === "h1");
      expect(h1Headings.length).toBeGreaterThan(0);

      // Headings should have meaningful text
      headings.forEach((heading) => {
        expect(heading.text).toBeTruthy();
        expect(heading.text?.length).toBeGreaterThan(0);
      });
    });

    it("should have accessible form controls", async () => {
      // Check search input
      const searchInput = await page.$('[data-testid="search-input"], input[type="text"]');
      expect(searchInput).toBeTruthy();

      if (searchInput) {
        const label = await searchInput.getAttribute("aria-label");
        const placeholder = await searchInput.getAttribute("placeholder");
        const hasLabel = label || placeholder;

        expect(hasLabel).toBeTruthy();
      }

      // Check for buttons with accessible names
      const buttons = await page.$$("button");
      for (const button of buttons) {
        const accessibleName = await button.getAttribute("aria-label") ||
                              await button.getAttribute("title") ||
                              await button.textContent();

        expect(accessibleName?.trim()).toBeTruthy();
      }
    });

    it("should support keyboard navigation", async () => {
      // Tab through focusable elements
      await page.keyboard.press("Tab");

      const activeElement = await page.evaluate(() => {
        const el = document.activeElement;
        return el ? {
          tagName: el.tagName.toLowerCase(),
          type: el.getAttribute("type"),
          role: el.getAttribute("role"),
        } : null;
      });

      // First focusable element should be the search input
      expect(activeElement?.tagName).toBe("input");
      expect(activeElement?.type).toBe("text");
    });

    it("should have sufficient color contrast", async () => {
      const axe = new AxeBuilder({ page })
        .withRules(["color-contrast"]);

      const results = await axe.analyze();

      // Should pass color contrast checks
      const contrastViolations = results.violations.filter(
        (v) => v.id === "color-contrast"
      );

      expect(contrastViolations).toHaveLength(0);
    });

    it("should have proper image alt text", async () => {
      const images = await page.$$("img");

      for (const img of images) {
        const alt = await img.getAttribute("alt");
        const ariaLabel = await img.getAttribute("aria-label");
        const hasAlt = alt || ariaLabel;

        // Images should have alt text (unless decorative)
        const isDecorative = await img.getAttribute("aria-hidden") === "true" ||
                            await img.getAttribute("role") === "presentation";

        if (!isDecorative) {
          expect(hasAlt).toBeTruthy();
        }
      }
    });

    it("should have proper ARIA landmarks", async () => {
      const landmarks = await page.$$eval(
        '[role="main"], [role="navigation"], [role="search"], [role="complementary"], header, nav, main, aside',
        (elements) => elements.length
      );

      // Should have at least some semantic structure
      expect(landmarks).toBeGreaterThan(0);
    });

    it("should handle focus management properly", async () => {
      // Test that focus is visible
      await page.keyboard.press("Tab");

      const hasVisibleFocus = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement;
        if (!el) return false;

        const style = window.getComputedStyle(el);
        const hasFocusRing = style.outline !== "none" && style.outline !== "";
        const hasBoxShadow = style.boxShadow !== "none" && style.boxShadow !== "";

        return hasFocusRing || hasBoxShadow;
      });

      // Focus should be visible (this is a basic check)
      // Note: This might not catch all focus styles
      expect(hasVisibleFocus).toBe(true);
    });

    it("should be usable at different viewport sizes", async () => {
      const viewports = [
        { width: 320, height: 568 }, // Mobile
        { width: 768, height: 1024 }, // Tablet
        { width: 1920, height: 1080 }, // Desktop
      ];

      for (const viewport of viewports) {
        await page.setViewportSize(viewport);

        // Check that main content is visible and accessible
        const mainContent = await page.$('[role="main"], main, [data-testid="main-content"]');
        if (mainContent) {
          const isVisible = await mainContent.isVisible();
          expect(isVisible).toBe(true);
        }

        // Check that search input is accessible
        const searchInput = await page.$('[data-testid="search-input"], input[type="text"]');
        if (searchInput) {
          const isVisible = await searchInput.isVisible();
          expect(isVisible).toBe(true);
        }
      }
    });
  });

  describe("Search Results Accessibility", () => {
    beforeEach(async () => {
      // Perform a search to get results
      const searchInput = await page.$('[data-testid="search-input"], input[type="text"]');
      if (searchInput) {
        await searchInput.fill("test query");
        await searchInput.press("Enter");

        // Wait for results to load
        await page.waitForSelector('[data-testid="search-result"], .result-item, [role="listitem"]', {
          timeout: 5000,
        });
      }
    });

    it("should have accessible search results", async () => {
      const axe = new AxeBuilder({ page })
        .include('[data-testid="search-results"], .results-container, [role="list"]');

      const results = await axe.analyze();

      const criticalViolations = results.violations.filter(
        (v) => v.impact === "critical" || v.impact === "serious"
      );

      expect(criticalViolations).toHaveLength(0);
    });

    it("should have proper list structure for results", async () => {
      const listElements = await page.$$('[role="list"], ul, ol');
      const listItems = await page.$$('[role="listitem"], li');

      // Should have some form of list structure
      expect(listElements.length + listItems.length).toBeGreaterThan(0);
    });

    it("should support keyboard navigation through results", async () => {
      // Tab to results area
      await page.keyboard.press("Tab");
      await page.keyboard.press("Tab"); // Should reach results

      // Try arrow key navigation if it's a list
      await page.keyboard.press("ArrowDown");

      // Should maintain focus within results
      const activeElement = await page.evaluate(() => {
        const el = document.activeElement;
        return el ? el.tagName.toLowerCase() : null;
      });

      // Focus should be on a result element or button
      expect(["div", "article", "button", "a", "li"].includes(activeElement || "")).toBe(true);
    });
  });

  describe("Error States Accessibility", () => {
    it("should have accessible error messages", async () => {
      // Trigger an error state (if possible)
      const searchInput = await page.$('[data-testid="search-input"], input[type="text"]');
      if (searchInput) {
        // Try to trigger an error by submitting empty search
        await searchInput.fill("");
        await searchInput.press("Enter");

        // Wait a bit for any error messages
        await page.waitForTimeout(1000);

        // Check for error messages
        const errorMessages = await page.$$('[role="alert"], .error, .error-message, [aria-live]');

        if (errorMessages.length > 0) {
          for (const error of errorMessages) {
            const isVisible = await error.isVisible();
            if (isVisible) {
              const text = await error.textContent();
              expect(text?.trim()).toBeTruthy();
            }
          }
        }
      }
    });
  });
});
