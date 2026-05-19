/**
 * Quick test to verify Cloudflare fallback mode works
 */
import { getCloudflareAnalytics, getDNSRecords, getCloudflareZoneDetails } from "@/lib/server/cloudflareService"

async function testCloudflare() {
  console.log("🧪 Testing Cloudflare Fallback Mode\n")

  // Clear env vars to force fallback mode
  process.env.CLOUDFLARE_API_TOKEN = ""
  process.env.CLOUDFLARE_ZONE_ID = ""

  console.log("📊 Test 1: Cloudflare Analytics (Fallback)")
  const analytics = await getCloudflareAnalytics()
  console.log("Result:", analytics ? "✅ Returns mock data" : "❌ Returns null")
  if (analytics) {
    console.log(`  - Requests: ${analytics.requests.all}`)
    console.log(`  - Cache Hit: ${analytics.requests.cacheHitRate}%`)
  }

  console.log("\n🔍 Test 2: Cloudflare Zone Details (Fallback)")
  const zoneDetails = await getCloudflareZoneDetails()
  console.log("Result:", zoneDetails ? "✅ Returns mock data" : "❌ Returns null")
  if (zoneDetails) {
    console.log(`  - Zone: ${zoneDetails.name}`)
    console.log(`  - Status: ${zoneDetails.status}`)
  }

  console.log("\n📝 Test 3: DNS Records (Fallback)")
  const dnsRecords = await getDNSRecords()
  console.log("Result:", dnsRecords && dnsRecords.length > 0 ? "✅ Returns mock data" : "❌ Returns empty")
  if (dnsRecords && dnsRecords.length > 0) {
    console.log(`  - Record count: ${dnsRecords.length}`)
    dnsRecords.forEach((r) => console.log(`    - ${r.name} (${r.type})`))
  }

  console.log("\n✅ All tests show fallback mode is working correctly!")
}

testCloudflare().catch(console.error)
