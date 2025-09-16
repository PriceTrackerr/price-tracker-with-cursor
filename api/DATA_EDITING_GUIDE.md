# Data Editing Guide

## 🎯 Quick Price Drop Testing

For rapid testing and development, you can directly edit `data.json` instead of using scripts.

## 📊 How to Add Price Drops

### 1. **Update Product Price**
Find the product in the `products` array and change the `price` field:

```json
{
  "id": "1753818913655bu169",
  "title": "ZNH 750W Peak Electric Bike...",
  "price": 250,  // ← Change this from 301 to 250
  "currency": "$",
  "userId": "1753818521609lw3h2"
}
```

### 2. **Add Price History Entry**
Add entries to the `priceHistory` array at the end of the file:

```json
{
  "id": "manual_old_1753818913655bu169",
  "productId": "1753818913655bu169",
  "price": 301,  // ← Original price
  "currency": "$",
  "timestamp": "2025-08-05T10:00:00.000Z"
},
{
  "id": "manual_new_1753818913655bu169", 
  "productId": "1753818913655bu169",
  "price": 250,  // ← New lower price
  "currency": "$",
  "timestamp": "2025-08-05T16:00:00.000Z"
}
```

## 🚀 Quick Steps

1. **Find your product** in the `products` array
2. **Update the price** to the new lower price
3. **Add two entries** to `priceHistory` array:
   - Old price entry (earlier timestamp)
   - New price entry (current timestamp)
4. **Save the file**
5. **Refresh dashboard** to see the price drop

## 📝 Example: Create a 20% Price Drop

**Before:**
```json
"price": 100
```

**After:**
```json
"price": 80
```

**Add to priceHistory:**
```json
{
  "id": "drop_old_123",
  "productId": "your-product-id",
  "price": 100,
  "currency": "$", 
  "timestamp": "2025-08-05T10:00:00.000Z"
},
{
  "id": "drop_new_123",
  "productId": "your-product-id", 
  "price": 80,
  "currency": "$",
  "timestamp": "2025-08-05T16:00:00.000Z"
}
```

## ✅ Benefits of Direct Editing

- **Faster** than writing scripts
- **Visual** - you can see exactly what you're changing
- **Simple** - no need to run commands
- **Immediate** - changes take effect instantly
- **Learning** - helps understand the data structure

## ⚠️ Best Practices

- **Backup** the file before major changes
- **Use unique IDs** for price history entries
- **Keep timestamps** in chronological order
- **Test** the dashboard after changes
- **Use scripts** for production/automation

## 🎯 When to Use Scripts vs Direct Editing

| Use Direct Editing When: | Use Scripts When: |
|--------------------------|-------------------|
| Quick testing | Repetitive tasks |
| Learning data structure | Production environments |
| One-time changes | Team collaboration |
| Rapid iteration | Complex transformations |
| Development phase | Automation needed | 