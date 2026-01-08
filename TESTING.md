# Testing Strategy

This repository employs a comprehensive testing strategy designed to ensure the reliability, functionality, and maintainability of the **The River's Verse** tactical interface.

## 1. Test Pyramid Overview

We follow a layered testing approach:

*   **Unit Tests (Jest):** Focus on pure logic and individual components.
    *   *Coverage:* `PredictiveEngine`, `TacticalAnalytics`, `IntelSystem`.
    *   *Goal:* Verify mathematical models, state transitions, and data processing in isolation.
*   **Integration Tests (Jest + DOM):** Verify interactions between the main controller and its dependencies.
    *   *Coverage:* `MissionControl` interacting with Map, HUD, and data services.
    *   *Goal:* Ensure the core loop and event handling work as expected.
*   **End-to-End Tests (Playwright):** Verify the full user journey in a real browser environment.
    *   *Coverage:* Critical user flows (Navigation, Playback, Map Interaction, Terminal).
    *   *Goal:* Catch regression in visual rendering, DOM manipulation, and browser compatibility.

## 2. Unit & Integration Testing

We use **Jest** as the test runner.

### Running Tests
```bash
npm test
```

### Key Configurations
*   **Environment:** `jsdom` is used to simulate the browser environment for logic that touches the DOM or window objects.
*   **ES Modules:** Babel is configured to transpile ES6 modules for Jest compatibility.
*   **Mocking:** External dependencies (Leaflet, etc.) and internal modules are mocked in integration tests to isolate the system under test.

## 3. End-to-End Testing

We use **Playwright** for browser-based testing.

### Running Tests
```bash
npx playwright test
```
To run with UI mode:
```bash
npx playwright test --ui
```

### Key Scenarios
*   Application Load & Integrity
*   HUD Status Updates
*   Timeline Control (Play/Pause/Seek)
*   Terminal Interaction
*   Map Interactivity

## 4. Continuous Integration (CI)

Tests are automatically executed via **GitHub Actions** on every Push and Pull Request to `main`.

*   **Workflow:** `.github/workflows/test.yml`
*   **Steps:**
    1.  Install Dependencies
    2.  Lint (Future)
    3.  Run Unit/Integration Tests
    4.  Run E2E Tests
    5.  Upload Coverage & Reports

## 5. Coverage & Quality Gates

Code coverage is collected by Jest. We enforce high coverage standards for critical logic modules:

*   `engine.js`: >90%
*   `intel.js`: >90%
*   `analytics.js`: >80%

Coverage reports are generated in the `coverage/` directory.

## 6. Directory Structure

```
tests/
├── unit/           # Logic tests
├── integration/    # Component interaction tests
├── e2e/            # Browser-based user flow tests
```
