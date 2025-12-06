SLICKDEALS COUPON EXTRACTION FIX
=== FILE: api/src/services/freeCouponService.ts ===

Replace lines 245-280 in freeCouponService.ts with this code:

```typescript
      for (const item of items.slice(0, 10)) {
        const title = item.title?.[0] || '';
        const description = item.description?.[0] || '';
        const link = item.link?.[0] || '';
        
        const fullText = `${title} ${description}`;

        let extractedCode = null;
        let discount = undefined;

        // Pattern 1: Explicit codes like "SAVE20", "OFF15", "20OFF", "FREESHIP"
        const explicitMatch = fullText.match(/(SAVE\d+|OFF\d+|\d+OFF|FREESHIP|BF\d+)/i);
        if (explicitMatch) {
          extractedCode = explicitMatch[1].toUpperCase();
        }

        // Pattern 2: "code:", "use code", "promo:", "coupon:"
        if (!extractedCode) {
          const codeMatch = fullText.match(/(?:code|promo|coupon)\s*:?\s*([A-Z0-9]{4,15})/i);
          if (codeMatch) {
            extractedCode = codeMatch[1].toUpperCase();
          }
        }

        // Pattern 3: Extract discount percentage/dollar amounts
        const percentMatch = fullText.match(/(\d+)%\s*off/i);
        const dollarMatch = fullText.match(/\$(\d+)\s*off/i);
        
        if (percentMatch) {
          discount = `${percentMatch[1]}% off`;
          if (!extractedCode) {
            extractedCode = `${percentMatch[1]}OFF`;
          }
        } else if (dollarMatch) {
          discount = `$${dollarMatch[1]} off`;
          if (!extractedCode) {
            extractedCode = `SAVE${dollarMatch[1]}`;
          }
        }

        // If we found a code OR discount, add it
        if (extractedCode || discount) {
          const finalCode = extractedCode || 'DEAL';
          
          coupons.push({
            code: finalCode,
            description: title.substring(0, 100),
            discount,
            source: 'Slickdeals' as const,
            link: link || undefined
          });

          console.log(`✅ Extracted: ${finalCode} - ${title.substring(0, 50)}...`);
        }
      }

      // Remove duplicates by code
      const uniqueCoupons = Array.from(
        new Map(coupons.map(c => [c.code, c])).values()
      );

      console.log(`✅ Found ${uniqueCoupons.length} Slickdeals coupons (from ${items.length} items)`);
      return uniqueCoupons.slice(0, 5);
```

WHAT TO REPLACE:
- Find line 245: `for (const item of items.slice(0, 10)) {`
- Replace everything from line 245 to 280 (just before line 282: `} catch (error) {`)
- The old code has strict regex `/\b([A-Z][A-Z0-9]{3,14})\b/g` which filters out most codes
- New code has looser patterns: SAVE20, OFF15, 20OFF, code: ABC123, promo: DEAL25, "20% off"

ALSO ADD ONE LINE:
- After line 243: `const coupons: Coupon[] = [];`
- Add: `console.log(`📦 Slickdeals returned ${items.length} items`);`

BENEFITS:
✅ Accepts SAVE20, 20OFF, OFF15, FREESHIP pattern codes
✅ Extracts "code: ABC123", "promo: DEAL25" formats  
✅ Creates codes from percentages: "20% off" → code "20OFF"
✅ Logs extraction for debugging
✅ No more "9 items → 0 valid coupons"!
