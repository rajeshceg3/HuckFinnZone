
import { test, expect } from '@playwright/test';

test.describe('The Rivers Verse - E2E', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await page.waitForSelector('.leaflet-container');
    });

    test('Loads application and core UI elements', async ({ page }) => {
        await expect(page).toHaveTitle('The River\'s Verse: Tactical Narrative Interface');
        await expect(page.locator('#hud-overlay')).toBeVisible();
        await expect(page.locator('#map')).toBeVisible();
        await expect(page.locator('#timeline-control')).toBeVisible();
        await expect(page.locator('#terminal-toggle')).toBeVisible();
    });

    test('HUD displays initial status', async ({ page }) => {
        await expect(page.locator('#hud-phase')).not.toBeEmpty();
        await expect(page.locator('#hud-status-text')).not.toBeEmpty();
        await expect(page.locator('#hud-distance')).toHaveText('0');
    });

    test('Terminal toggle works', async ({ page }) => {
        const terminalContainer = page.locator('#terminal-container');
        await page.click('#terminal-toggle');
        await expect(terminalContainer).toHaveClass(/active/);
        await page.click('#terminal-toggle');
        await expect(terminalContainer).not.toHaveClass(/active/);
    });

    test('Playback button toggles state', async ({ page }) => {
        const playBtn = page.locator('#play-pause-btn');
        const hudStatus = page.locator('#hud-status-text');

        await expect(hudStatus).toBeVisible();

        // Check initial state (should be paused icon: play triangle)
        await expect(playBtn.locator('svg path')).toBeVisible();

        // Click play
        await playBtn.click();

        // Icon should change to pause (rectangles)
        // Note: The pause icon has two rects, locator('svg rect') matches both.
        // We can check count or just use .first() or .nth(0) to verify at least one is visible.
        await expect(playBtn.locator('svg rect').first()).toBeVisible();

        // Wait a bit
        await page.waitForTimeout(1000);

        // Click pause
        await playBtn.click();

        // Icon should change back to play
        await expect(playBtn.locator('svg path')).toBeVisible();
    });

    test('Timeline slider updates mission progress', async ({ page }) => {
        const slider = page.locator('#timeline-slider');
        const distanceDisplay = page.locator('#hud-distance');

        await page.evaluate(() => {
            const slider = document.querySelector('#timeline-slider');
            slider.value = 50;
            slider.dispatchEvent(new Event('input'));
            slider.dispatchEvent(new Event('change'));
        });

        await expect(distanceDisplay).not.toHaveText('0');
        const distText = await distanceDisplay.textContent();
        expect(parseFloat(distText)).toBeGreaterThan(0);
    });

    test('Map interaction (Pan/Zoom)', async ({ page }) => {
        const map = page.locator('#map');
        const box = await map.boundingBox();

        if (box) {
             await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
             await page.mouse.down();
             await page.mouse.move(box.x + box.width / 2 + 100, box.y + box.height / 2 + 100);
             await page.mouse.up();
        }
    });
});
