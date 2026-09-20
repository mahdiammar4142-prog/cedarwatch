"""
CedarWatch internet monitoring agent.

Checks connectivity, latency, DNS, and packet loss, then reports
results to the Python API. If several nearby agents fail together,
CedarWatch can create a regional internet outage automatically.

Usage (PowerShell):
  $env:AGENT_ID="beirut-home"
  $env:AGENT_API_KEY="cedarwatch-dev-agent-key"
  $env:CEDARWATCH_API_URL="http://localhost:8000"
  python main.py
"""

from __future__ import annotations

import json
import os
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone

AGENT_ID = os.getenv("AGENT_ID", "demo-agent")
API_KEY = os.getenv("AGENT_API_KEY", "cedarwatch-dev-agent-key")
API_URL = os.getenv("CEDARWATCH_API_URL", "http://localhost:8000").rstrip("/")
LATITUDE = float(os.getenv("AGENT_LAT", "33.8938"))
LONGITUDE = float(os.getenv("AGENT_LNG", "35.5018"))
AREA = os.getenv("AGENT_AREA", "Beirut")
INTERVAL_SECONDS = int(os.getenv("CHECK_INTERVAL_SECONDS", "60"))

PING_TARGETS = [
    "https://1.1.1.1",
    "https://dns.google",
    "https://www.cloudflare.com",
]


def measure_latency(url: str) -> float | None:
    start = time.perf_counter()
    try:
        request = urllib.request.Request(url, method="HEAD")
        with urllib.request.urlopen(request, timeout=5):
            return round((time.perf_counter() - start) * 1000)
    except (urllib.error.URLError, TimeoutError, OSError):
        return None


def check_dns() -> bool:
    try:
        with urllib.request.urlopen(
            "https://dns.google/resolve?name=example.com&type=A", timeout=5
        ) as response:
            return 200 <= response.status < 300
    except (urllib.error.URLError, TimeoutError, OSError):
        return False


def run_check() -> dict:
    results = [measure_latency(url) for url in PING_TARGETS]
    successful = [value for value in results if value is not None]
    packet_loss = ((len(PING_TARGETS) - len(successful)) / len(PING_TARGETS)) * 100
    return {
        "isConnected": bool(successful),
        "latencyMs": round(sum(successful) / len(successful)) if successful else None,
        "dnsOk": check_dns(),
        "packetLoss": round(packet_loss),
    }


def report_check(result: dict) -> None:
    payload = {
        "agentId": AGENT_ID,
        "latitude": LATITUDE,
        "longitude": LONGITUDE,
        "area": AREA,
        **result,
    }
    request = urllib.request.Request(
        f"{API_URL}/api/agent/check",
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "x-agent-key": API_KEY,
        },
        method="POST",
    )
    with urllib.request.urlopen(request, timeout=10) as response:
        data = json.loads(response.read().decode("utf-8"))

    status = "OK" if result["isConnected"] else "FAIL"
    stamp = datetime.now(timezone.utc).isoformat()
    print(
        f"[{stamp}] {status} | latency={result['latencyMs'] or 'N/A'}ms "
        f"dns={result['dnsOk']} loss={result['packetLoss']}%"
    )
    if data.get("incident"):
        print(f"  -> Possible regional outage detected: {data['incident']['id']}")


def main() -> None:
    print(f'CedarWatch agent "{AGENT_ID}" starting')
    print(f"  Location: {AREA} ({LATITUDE}, {LONGITUDE})")
    print(f"  API: {API_URL}")
    print(f"  Interval: {INTERVAL_SECONDS}s")

    while True:
        try:
            report_check(run_check())
        except Exception as error:  # noqa: BLE001
            print(f"Check failed: {error}")
        time.sleep(INTERVAL_SECONDS)


if __name__ == "__main__":
    main()
