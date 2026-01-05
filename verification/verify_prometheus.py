import sys
import os
import threading
import http.server
import socketserver
from playwright.sync_api import sync_playwright

# Ensure verification directory exists
os.makedirs("verification", exist_ok=True)

PORT = 8000

def start_server():
    handler = http.server.SimpleHTTPRequestHandler
    with socketserver.TCPServer(("", PORT), handler) as httpd:
        print(f"Serving at port {PORT}")
        httpd.serve_forever()

def verify_prometheus():
    # Start server in background
    server_thread = threading.Thread(target=start_server, daemon=True)
    server_thread.start()

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        print("Loading application...")
        page.goto(f"http://localhost:{PORT}/index.html")

        # 1. Fast forward to Cairo (Decision Point)
        # We can cheat by invoking MissionControl methods via console, but let's try to seek.
        # It's safer to just set the state directly via JS.
        print("Navigating to Decision Point...")
        page.evaluate("""() => {
            // Find the global mission instance (it's not exposed globally, but we can access it if we attached it)
            // Wait, mission.js doesn't attach to window.
            // Let's modify the time slider.

            // Actually, we can just trigger the decision manually for testing UI
            const pt = {
                title: 'TEST DECISION',
                content: 'Test content',
                choices: [
                    { label: 'Option A', description: 'Desc A', consequence: 'Risk increases', targetId: 'a' },
                    { label: 'Option B', description: 'Desc B', consequence: 'Safe', targetId: 'b' }
                ],
                lat: 37, lng: -89
            };

            // We need to access the HUD instance.
            // Since we can't easily access the closed module scope,
            // we will simulate the user flow of clicking markers if possible,
            // OR we just dispatch the event if the listener is on document.

            // Looking at mission.js, it listens for 'decision-made', but triggering the decision UI is internal.
            // However, HUD listens for nothing, it's driven by Mission.

            // Let's just reload the page and wait? No, too slow.
            // Let's rely on the fact that I attached `mission` to `window`? No I didn't.

            // I'll try to find the 'Cairo' marker and click it?
            // Marker clicks just show story.

            // OK, I'll use the slider to seek to Cairo (Mile 120 / Total 600 = 0.2)
            // But seeking doesn't trigger decision automatically in the code unless playing.

            // Let's try to Simulate a dispatch? No, Mission triggers HUD.

            // I will use Playwright to drag the slider.
        }""")

        # Let's drag the slider to ~20%
        print("Seeking to Cairo...")
        slider = page.locator("#timeline-slider-container")
        box = slider.bounding_box()
        if box:
            page.mouse.move(box["x"], box["y"] + box["height"] / 2)
            page.mouse.down()
            page.mouse.move(box["x"] + box["width"] * 0.22, box["y"] + box["height"] / 2)
            page.mouse.up()

        # Now we need to PLAY to trigger the decision logic in `updateMissionData`.
        print("Starting playback...")
        page.click("#play-pause-btn")

        # Wait for decision modal
        print("Waiting for Decision Modal...")
        try:
            page.wait_for_selector("#decision-modal.active", timeout=10000)
            print("Decision Modal appeared.")
        except:
            print("Timeout waiting for decision modal. Trying to seek closer.")
            # Maybe we overshot or undershot.
            return False

        # 2. Verify Simulation UI
        print("Verifying Simulation UI...")

        # Check for "RUN PREDICTION" button
        sim_trigger = page.locator(".sim-btn-trigger").first
        if sim_trigger.is_visible():
            print("Simulation Trigger found.")
            sim_trigger.click()

            # Check for sliders
            if page.locator("#sim-speed").is_visible():
                print("Simulation Controls visible.")

                # Run Simulation
                page.click("button:has-text('EXECUTE SIMULATION')")

                # Check for output
                page.wait_for_selector("#sim-output:has-text('SUCCESS PROBABILITY')", timeout=5000)
                print("Simulation Output confirmed.")

                # Capture screenshot
                page.screenshot(path="verification/prometheus_verified.png")
                print("Verification Screenshot saved.")
                return True
            else:
                print("Simulation Controls NOT found.")
                return False
        else:
            print("Simulation Trigger NOT found.")
            return False

if __name__ == "__main__":
    if verify_prometheus():
        print("SUCCESS: Project PROMETHEUS Verified.")
        sys.exit(0)
    else:
        print("FAILURE: Verification failed.")
        sys.exit(1)
