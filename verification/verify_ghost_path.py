
import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        await page.goto("http://localhost:8000")
        await page.wait_for_timeout(2000)

        # 1. Play until Cairo
        print("Moving to Cairo...")
        slider = page.locator("#timeline-slider-container")
        rect = await slider.bounding_box()
        # Click 20%
        await slider.click(position={"x": rect["width"] * 0.22, "y": rect["height"] / 2})
        await page.wait_for_timeout(1000)

        # 2. Trigger Decision
        print("Triggering decision...")
        await page.evaluate("""
            const event = new CustomEvent('decision-made', {
                detail: { targetId: 'ohio-river' }
            });
            document.dispatchEvent(event);
        """)

        await page.wait_for_timeout(1000)

        # 3. Take screenshot of ghost path
        print("Taking screenshot...")
        await page.screenshot(path="verification/screenshot_ghost_path.png")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(run())
