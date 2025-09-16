import axios from 'axios';
import { Product } from '../config/storage';

export class BestBuyService {
  private readonly apiKey: string | undefined;

  constructor() {
    this.apiKey = process.env.BESTBUY_API_KEY;
  }

  public async searchProducts(query: string, limit: number = 10): Promise<Product[]> {
    if (!this.apiKey) return [];

    try {
      const q = encodeURIComponent(query);
      const url = `https://api.bestbuy.com/v1/products((search=${q}))?apiKey=${this.apiKey}&format=json&pageSize=${limit}`;
      const { data } = await axios.get(url, { timeout: 12000 });

      const items = Array.isArray(data?.products) ? data.products : [];
      const now = new Date().toISOString();

      return items.map((p: any) => ({
        id: String(p.sku),
        url: p.url,
        title: p.name,
        price: Number(p.salePrice ?? p.regularPrice ?? 0),
        currency: 'USD',
        platform: 'bestbuy',
        imageUrl: p.image,
        createdAt: now,
        updatedAt: now,
        userId: 'system'
      } as Product));
    } catch (error) {
      return [];
    }
  }
}

export default BestBuyService;


