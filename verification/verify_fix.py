
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

        # Click Play to start
        await page.click("#play-pause-btn")

        # Click slider to seek
        slider = page.locator("#timeline-slider-container")
        await slider.click()

        # Wait for potential decision modal
        await page.wait_for_timeout(2000)

        # Check if decision modal is active
        modal = page.locator("#decision-modal")
        if await modal.is_visible():
            print("Decision Modal is Visible (Expected if at decision point)")

            # Interact with the map (click somewhere safely away from modal if possible, but modal covers all)
            # Actually, we want to test that we can SEEK even if modal is open.

            # Click slider again (simulating seek)
            # This requires the slider to be clickable (z-index fix)

            # We need to click specifically on the slider.
            # Since the modal backdrop is pointer-events: auto (or caught), but slider is z-index 3001
            # it should receive the click.

            # Get slider box
            box = await slider.bounding_box()
            if box:
                # Click at 10%
                await page.mouse.click(box['x'] + box['width'] * 0.1, box['y'] + box['height'] / 2)
                print("Clicked Slider at 10%")

                await page.wait_for_timeout(1000)

                # Modal should be gone or hidden?
                # Our logic: if seeking away, cancel decision?
                # "Decision context aborted by manual override."

                # Check if modal is hidden
                is_visible = await modal.is_visible()
                print(f"Modal Visible after Seek: {is_visible}")

        # Take screenshot
        await page.screenshot(path="verification/screenshot_fixed.png")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(run())
