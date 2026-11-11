#!/usr/bin/env python3
"""Verification runner for HuckFinnZone. See SKILL.md."""
import json, os, re, subprocess, sys, time
from pathlib import Path
REPO = Path(__file__).resolve().parents[3]
failures = []
def check(name, ok, detail=''):
    print(('PASS' if ok else 'FAIL'), name, (':: ' + str(detail))[:400] if detail else '')
    if not ok: failures.append(name)
def run(cmd, **kw):
    return subprocess.run(cmd, cwd=REPO, capture_output=True, text=True, timeout=900, **kw)
def main():
    if not (REPO / 'node_modules').is_dir():
        check('npm install', run(['npm', 'install', '--no-audit', '--no-fund']).returncode == 0)
    proc = run(['npx', 'jest'])
    tail = re.sub(r'\x1b\[[0-9;]*m', '', proc.stdout + proc.stderr)
    check('jest unit suites (31 tests)', proc.returncode == 0 and 'Tests:' in tail and ' 0 failed' not in tail, tail[-300:])
    proc = run(['npx', 'playwright', 'test'])
    tail = re.sub(r'\x1b\[[0-9;]*m', '', proc.stdout + proc.stderr)
    check('playwright e2e suite', proc.returncode == 0 and ' failed' not in tail and 'passed' in tail, tail[-300:])
    print('FAILURES=%d' % len(failures))
    with open(REPO / '.cursor/skills/verify-huck-finn-zone/evidence.json', 'w') as f:
        json.dump({'repo': 'HuckFinnZone', 'ts': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()), 'failures': failures}, f, indent=2)
    return 1 if failures else 0
if __name__ == '__main__':
    sys.exit(main())
