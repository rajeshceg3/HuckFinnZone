
import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        # Capture console logs
        page.on("console", lambda msg: print(f"CONSOLE: {msg.text}"))

        # Navigate to the page
        await page.goto("http://localhost:8000")

        # Wait for map to initialize
        await page.wait_for_timeout(2000)

        # Click Play
        await page.click("#play-pause-btn")

        # Wait a bit
        await page.wait_for_timeout(2000)

        # Take screenshot
        await page.screenshot(path="verification/screenshot_initial.png")

        # Check title
        title = await page.title()
        print(f"Title: {title}")

        # Interact with slider
        slider = page.locator("#timeline-slider")

        # Debug: check visibility
        is_visible = await slider.is_visible()
        print(f"Slider visible: {is_visible}")
        box = await slider.bounding_box()
        print(f"Slider box: {box}")

        if is_visible:
            await slider.click(force=True)
            # Take verification screenshot
            await page.screenshot(path="verification/verification_final.png")
        else:
            print("Slider not visible, taking debug screenshot")
            await page.screenshot(path="verification/debug_slider_invisible.png")

        await page.wait_for_timeout(1000)

        await browser.close()

if __name__ == "__main__":
    asyncio.run(run())
