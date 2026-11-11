# Verify HuckFinnZone
Huck Finn Zone - literary river journey.
## Launch
`npm install`; the playwright config serves the app itself.
## Doctor
`python3 .cursor/skills/verify-huck-finn-zone/verify.py`
## Drive
Runs the jest suites (31 tests), then the playwright e2e suite (6 tests) in real Chromium.
## Evidence
`.cursor/skills/verify-huck-finn-zone/evidence.json`
## Cleanup
Playwright manages its server.
## Known boundaries
Chromium coverage as configured in the repo.
