"""Optional real-browser release gate. Never bypass browser/administrator policy.

python -m pip install -r requirements-browser.txt
python -m playwright install chromium
python tests/mov_browser_smoke.py

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
                    page.goto(base + "/mov/", wait_until="networkidle")
                    expect(page.locator("#mov-catalog .viewport-card")).to_have_count(4)
                    expect(page.locator("#mov-prepare")).to_be_disabled()
                    assert page.evaluate("document.documentElement.scrollWidth <= innerWidth"), "Horizontal overflow"
                    page.locator("#mov-reflection").fill("PRIVATE_SYNTHETIC_SENTINEL")
                    page.locator("#view-garden").check()
                    page.locator("#view-learning").check()
                    page.get_by_role("button", name="Inspect source").first.click()
                    expect(page.locator("#mov-details")).to_contain_text("https://example.invalid/molt/garden")
                    page.locator("#mov-prepare").click()
                    expect(page.locator("#mov-status")).to_contain_text("Public composition prepared")
                    output = page.locator("#mov-review").inner_text()
                    assert "PRIVATE_SYNTHETIC_SENTINEL" not in output
                    record = json.loads(output)
                    assert record["effects"] == [] and record["authority"]["grant"] is None
                    assert record["execution"]["dispatch"] is False
                    page.locator("#mov-name").fill("Changed title")
                    expect(page.locator("#mov-review")).to_have_text("No public composition prepared.")
                    page.locator("#mov-clear").click()
                    expect(page.locator("#mov-reflection")).to_have_value("")
                    expect(page.locator("#mov-prepare")).to_be_disabled()
                    assert not errors, errors
                    assert all(url.startswith(base + "/") for url in requests), requests
                    print(f"PASS MoV selection/privacy/source/no-network/layout {width}x{height}")
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
