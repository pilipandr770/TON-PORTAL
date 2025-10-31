import asyncio
import websockets
import sys

async def test_bridge(url):
    """Test WebSocket connection to TON bridge"""
    print(f"\n🔌 Testing: {url}")
    try:
        async with websockets.connect(url, timeout=5) as ws:
            print(f"✅ Connected to {url}")
            print(f"   State: {ws.state}")
            return True
    except asyncio.TimeoutError:
        print(f"⏱️ Timeout connecting to {url}")
        return False
    except Exception as e:
        print(f"❌ Error: {type(e).__name__}: {e}")
        return False

async def main():
    print("=" * 60)
    print("TON Bridge WebSocket Connectivity Test")
    print("=" * 60)
    
    bridges = [
        "wss://bridge.tonapi.io/bridge",
        "wss://connect.tonhubapi.com/bridge",
        "wss://bridge.tonkeeper.com/bridge",
        "wss://tonconnectbridge.mytonwallet.org/bridge",
    ]
    
    results = []
    for bridge_url in bridges:
        result = await test_bridge(bridge_url)
        results.append((bridge_url, result))
    
    print("\n" + "=" * 60)
    print("SUMMARY:")
    print("=" * 60)
    
    working = [url for url, ok in results if ok]
    broken = [url for url, ok in results if not ok]
    
    if working:
        print(f"✅ Working bridges ({len(working)}):")
        for url in working:
            print(f"   - {url}")
    
    if broken:
        print(f"\n❌ Unreachable bridges ({len(broken)}):")
        for url in broken:
            print(f"   - {url}")
    
    if not working:
        print("\n⚠️ WARNING: No TON bridges are reachable from your network!")
        print("   Possible causes:")
        print("   - Firewall blocking WebSocket connections")
        print("   - Corporate/ISP network restrictions")
        print("   - All bridges are temporarily down (unlikely)")
    
    print("\n" + "=" * 60)

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n\n❌ Test interrupted by user")
        sys.exit(1)
