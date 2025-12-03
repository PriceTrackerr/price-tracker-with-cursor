this file is dedicated to logs that are long to paste in chat


here is vercel log
2025-12-03 14:37:45.416 [info] [CRON] 🚀 Starting automated price update...
2025-12-03 14:37:45.794 [info] [CRON] 📦 Found 20 products to update
2025-12-03 14:37:45.794 [info] [CRON] 🔍 Checking: For Original AirPods Pro5 pro 5C-type Wireless Hea...
2025-12-03 14:37:45.794 [info] 🔎 Attempting provider: brightdata for "For Original AirPods Pro5 pro 5C-type Wireless Headphone Bluetooth Earphone e In Ear Tws GamingSports Headphones Air Smartphones"
2025-12-03 14:37:46.823 [error] ❌ Bright Data request failed: Request failed with status code 407
2025-12-03 14:37:46.823 [warning] ⚠️ brightdata provider returned no supported matches for "For Original AirPods Pro5 pro 5C-type Wireless Headphone Bluetooth Earphone e In Ear Tws GamingSports Headphones Air Smartphones"
2025-12-03 14:37:47.852 [info] 🔎 Attempting provider: apify for "For Original AirPods Pro5 pro 5C-type Wireless Headphone Bluetooth Earphone e In Ear Tws GamingSports Headphones Air Smartphones"
2025-12-03 14:37:47.879 [warning] ⚠️ Apify actor lukaskrivka~google-shopping-scraper failed: Request failed with status code 404
2025-12-03 14:37:48.263 [warning] ⚠️ Apify actor apify~google-search-results-scraper failed: Request failed with status code 404
2025-12-03 14:37:48.708 [warning] ⚠️ All Apify actors returned empty results
2025-12-03 14:37:48.708 [warning] ⚠️ apify provider returned no supported matches for "For Original AirPods Pro5 pro 5C-type Wireless Headphone Bluetooth Earphone e In Ear Tws GamingSports Headphones Air Smartphones"
2025-12-03 14:37:51.551 [info] 🔎 Attempting provider: scrapedo for "For Original AirPods Pro5 pro 5C-type Wireless Headphone Bluetooth Earphone e In Ear Tws GamingSports Headphones Air Smartphones"
2025-12-03 14:37:51.871 [error] ❌ ScrapeDo request failed: Request failed with status code 400
2025-12-03 14:37:51.871 [warning] ⚠️ scrapedo provider returned no supported matches for "For Original AirPods Pro5 pro 5C-type Wireless Headphone Bluetooth Earphone e In Ear Tws GamingSports Headphones Air Smartphones"
2025-12-03 14:37:52.894 [info] 🔎 Attempting provider: scrapingbee for "For Original AirPods Pro5 pro 5C-type Wireless Headphone Bluetooth Earphone e In Ear Tws GamingSports Headphones Air Smartphones"
2025-12-03 14:37:53.167 [error] ❌ ScrapingBee request failed: Request failed with status code 400
2025-12-03 14:37:53.167 [warning] ⚠️ scrapingbee provider returned no supported matches for "For Original AirPods Pro5 pro 5C-type Wireless Headphone Bluetooth Earphone e In Ear Tws GamingSports Headphones Air Smartphones"
2025-12-03 14:37:55.284 [info] 🔎 Attempting provider: serper for "For Original AirPods Pro5 pro 5C-type Wireless Headphone Bluetooth Earphone e In Ear Tws GamingSports Headphones Air Smartphones"
2025-12-03 14:37:56.137 [warning] ⚠️ serper provider returned no supported matches for "For Original AirPods Pro5 pro 5C-type Wireless Headphone Bluetooth Earphone e In Ear Tws GamingSports Headphones Air Smartphones"
2025-12-03 14:37:56.137 [error] ❌ All providers failed for "For Original AirPods Pro5 pro 5C-type Wireless Headphone Bluetooth Earphone e In Ear Tws GamingSports Headphones Air Smartphones"
2025-12-03 14:37:56.300 [info] [CRON] ⚠️ No price found for f3b2e784-cc9d-447a-b42c-85f28cef74f9
2025-12-03 14:37:56.300 [info] [CRON] ⏱️ Approaching timeout, stopping early
2025-12-03 14:37:56.315 [info] [CRON] 🎉 Complete: {
  checked: 1,
  updated: 0,
  errors: 0,
  skipped: [ 'f3b2e784-cc9d-447a-b42c-85f28cef74f9' ],
  duration: 10883
}
2025-12-03 14:37:56.315 [info] 196.191.61.43 - - [03/Dec/2025:14:37:56 +0000] "GET /api/cron/update-prices HTTP/1.1" 200 163 "-" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36"


and here is browser print after i run cronjob
{"success":true,"message":"Price update complete","stats":{"checked":1,"updated":0,"errors":0,"skipped":["f3b2e784-cc9d-447a-b42c-85f28cef74f9"],"duration":11294}}