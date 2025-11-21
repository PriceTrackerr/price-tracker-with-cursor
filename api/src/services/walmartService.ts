import axios from 'axios';
import { Product } from '../config/storage';

export class WalmartService {
  private readonly apiKey: string | undefined;

  constructor() {
    this.apiKey = process.env.WALMART_API_KEY;
  }

  public async searchProducts(query: string, limit: number = 10): Promise<Product[]> {
    if (!this.apiKey) return [];

    try {
      const url = `https://api.walmartlabs.com/v1/search?query=${encodeURIComponent(query)}&apiKey=${this.apiKey}&numItems=${limit}`;
      const { data } = await axios.get(url, { timeout: 12000 });
      const items = Array.isArray(data?.items) ? data.items : [];
      const now = new Date().toISOString();

      return items.map((i: any) => ({
        id: String(i.itemId),
        url: i.productUrl,
        title: i.name,
        price: Number(i.salePrice ?? i.msrp ?? 0),
        currency: 'USD',
        platform: 'walmart',
        imageUrl: i.mediumImage || i.thumbnailImage || '',
        createdAt: now,
        updatedAt: now,
        userId: 'system'
      } as Product));
    } catch (error) {
      return [];
    }
  }
}

export default WalmartService;


