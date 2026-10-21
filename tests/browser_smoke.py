"""Optional real-browser release gate. Never bypass browser/administrator policy.

python -m pip install -r requirements-browser.txt
python -m playwright install chromium
python tests/browser_smoke.py

BROWSER_EXECUTABLE may select an already installed Chromium executable.
This test is separate from the Node DOM harness and is not part of npm run check.
"""
from __future__ import annotations
import json
import os
from pathlib import Path
import socket
import subprocess
import time
from urllib.request import urlopen
from playwright.sync_api import sync_playwright, expect

ROOT = Path(__file__).resolve().parents[1]

def main() -> None:
    with socket.socket() as sock:
        sock.bind(("127.0.0.1", 0))
        port = sock.getsockname()[1]
    base = f"http://127.0.0.1:{port}"
    proc = subprocess.Popen(["node", "scripts/serve.mjs"], cwd=ROOT,
                            env={**os.environ, "PORT": str(port)},
                            stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)
    try:
        for attempt in range(60):
            if proc.poll() is not None:
                raise RuntimeError("Preview server stopped before browser test")
            try:
                with urlopen(base, timeout=1) as response:
                    if response.status == 200:
                        break
            except OSError:
                time.sleep(0.05)
        else:
            raise RuntimeError("Preview server not ready")
        with sync_playwright() as pw:
            executable = os.environ.get("BROWSER_EXECUTABLE")
            browser = pw.chromium.launch(headless=True, **({"executable_path": executable} if executable else {}))
            try:
                for width, height in [(390, 844), (1440, 1000), (320, 568), (844, 390)]:
                    context = browser.new_context(viewport={"width": width, "height": height}, accept_downloads=True)
                    page = context.new_page()
                    errors, requests = [], []
                    page.on("pageerror", lambda error: errors.append(str(error)))
                    page.on("request", lambda request: requests.append(request.url))
                    page.goto(base, wait_until="networkidle")
                    expect(page.locator("#prepare")).to_be_enabled()
                    assert page.evaluate("document.documentElement.scrollWidth <= innerWidth"), "Horizontal overflow"
                    page.locator("#intention").fill("PRIVATE_SYNTHETIC_SENTINEL")
                    page.locator("#prepare").click()
                    expect(page.locator("#consent")).to_be_enabled()
                    assert "PRIVATE_SYNTHETIC_SENTINEL" not in page.locator("#preview").inner_text()
                    page.locator("#consent").check()
                    page.locator("#name").fill("Changed agency")
                    expect(page.locator("#download")).to_be_disabled()
                    page.locator("#prepare").click()
                    expect(page.locator("#consent")).to_be_enabled()
                    page.locator("#consent").check()
                    with page.expect_download() as download:
                        page.locator("#download").click()
                    payload = Path(download.value.path()).read_text()
                    assert "PRIVATE_SYNTHETIC_SENTINEL" not in payload
                    record = json.loads(payload)
                    assert record["receipt"]["deployed"] is False
                    assert record["receipt"]["externalSuccess"] is False
                    expect(page.locator("#download")).to_be_disabled()
                    assert not errors, errors
                    assert all(url.startswith(base + "/") for url in requests), requests
                    print(f"PASS browser export/privacy/review/layout {width}x{height}")
                    context.close()
            finally:
                browser.close()
    finally:
        proc.terminate()
        try:
            proc.wait(timeout=5)
        except subprocess.TimeoutExpired:
            proc.kill()
            proc.wait(timeout=5)

if __name__ == "__main__":
    main()
