// api/src/services/realProductSearch.ts
import axios from "axios";

const SERPER_API_KEY = process.env.SERPER_API_KEY;

if (!SERPER_API_KEY) {
  console.error("❌ Missing SERPER_API_KEY in environment variables");
}

/**
 * realProductSearch — fetches live product listings from Serper (Google Shopping)
 * Used by ProductMatchScraper to find cross-platform matches
 */
export const realProductSearch = {
  /**
   * Search for real products using Serper Google Shopping API
   * @param query product name or keywords
   * @param limit number of results to return (default 10)
   */
  async searchProducts(query: string, limit: number = 10) {
    try {
      console.log(`🔎 Searching Serper Shopping for: "${query}"`);

      // Heuristic: shorten query to core tokens (brand + 2-3 keywords)
      const core = extractCoreQuery(query);

      // Primary: Shopping endpoint (cleanest product data)
      const response = await axios.post(
        "https://google.serper.dev/shopping",
        { q: core, gl: 'us', hl: 'en' },
        {
          headers: {
            "X-API-KEY": SERPER_API_KEY,
            "Content-Type": "application/json",
          },
          timeout: 30000,
        }
      );

      let results = response.data?.shopping ?? [];

      // Fallback to generic web search if Shopping returns nothing
      if (!results.length) {
        console.warn("⚠️ No shopping results, falling back to organic search...");
        const fallback = await axios.post(
          "https://google.serper.dev/search",
          { q: core, gl: 'us', hl: 'en' },
          {
            headers: {
              "X-API-KEY": SERPER_API_KEY,
              "Content-Type": "application/json",
            },
          }
        );
        results = fallback.data?.organic ?? [];
      }

      if (!results.length) {
        console.log("⚠️ No Serper results found for:", query);
        return [];
      }

      const parsed = results.slice(0, limit).map((r: any, i: number) => ({
        id: `serper_${Date.now()}_${i}`,
        title: r.title || r.name || query,
        price: extractPrice(r.price || r.extracted_price || ""),
        currency: detectCurrency(r.price || ""),
        url: r.link || "",
        imageUrl: r.image || r.thumbnail || "",
        platform: detectPlatform(r.link || "").toLowerCase(),
      }));

      console.log(`✅ Found ${parsed.length} Serper products for "${query}"`);
      return parsed;
    } catch (err: any) {
      const msg = err.response?.data || err.message;
      console.error("❌ Serper API failed:", msg);
      return [];
    }
  },
};

// ---------- Helpers ----------
function extractCoreQuery(q: string): string {
  const s = (q || '').toLowerCase();
  const tokens = s.replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
  const brandList = ['apple','samsung','sony','xiaomi','oneplus','huawei','google','lenovo','dell','hp','asus','acer','msi','bose','jbl','beats'];
  const brand = tokens.find(t => brandList.includes(t));
  const keywords = tokens.filter(t => t.length > 2 && !['with','and','for','the','new','pro','max','gen','generation','edition'].includes(t));
  const core = [brand, ...keywords].filter(Boolean).slice(0, 4).join(' ');
  return core || q;
}
function extractPrice(raw: string): number {
  if (!raw) return 0;
  const cleaned = raw.replace(/[^\d.,]/g, "").replace(",", ".");
  const val = parseFloat(cleaned);
  return isNaN(val) ? 0 : val;
}

function detectCurrency(price: string): string {
  if (!price) return "USD";
  if (price.includes("$")) return "USD";
  if (price.includes("€")) return "EUR";
  if (price.includes("£")) return "GBP";
  if (price.includes("₹")) return "INR";
  if (price.includes("¥")) return "JPY";
  return "USD";
}

function detectPlatform(url: string): string {
  if (!url) return "Unknown";
  const u = url.toLowerCase();
  if (u.includes("amazon")) return "Amazon";
  if (u.includes("ebay")) return "eBay";
  if (u.includes("aliexpress")) return "AliExpress";
  if (u.includes("temu")) return "Temu";
  if (u.includes("walmart")) return "Walmart";
  if (u.includes("bestbuy")) return "BestBuy";
  if (u.includes("target")) return "Target";
  return "Other";
}
