
import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        await page.goto("http://localhost:8000")
        await page.wait_for_timeout(2000)

        slider = page.locator("#timeline-slider-container")
        rect = await slider.bounding_box()
        await slider.click(position={"x": rect["width"] * 0.5, "y": rect["height"] / 2})

        await page.wait_for_timeout(1000)

        # Pause playback to verify stable state
        await page.click("#play-pause-btn")

        dist_text = await page.locator("#hud-distance").text_content()
        print(f"Distance before switch: {dist_text}")

        # Trigger decision
        print("Triggering decision...")
        await page.evaluate("""
            const event = new CustomEvent('decision-made', {
                detail: { targetId: 'ohio-river' }
            });
            document.dispatchEvent(event);
        """)

        # Immediately pause again because handleDecision resumes playback
        # We need to be fast or just accept a small delta.
        # Ideally we'd modify the code to NOT auto-resume for testing, but that's intrusive.
        # Instead, let's just check quickly.

        await page.wait_for_timeout(100) # Short wait for update

        # Pause again
        await page.click("#play-pause-btn")

        new_dist_text = await page.locator("#hud-distance").text_content()
        print(f"Distance after switch: {new_dist_text}")

        dist_val = float(dist_text)
        new_dist_val = float(new_dist_text)

        # We expect it to be CLOSE to dist_val (250).
        # Tolerance +/- 20 miles?
        if abs(new_dist_val - dist_val) < 30:
            print("SUCCESS: Distance preserved.")
        else:
            print(f"FAILURE: Distance changed significantly. Delta: {new_dist_val - dist_val}")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(run())
