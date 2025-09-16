import https from 'https';
import { Product } from '../config/storage';

export class AliExpressService {
  private readonly apiKey: string | undefined;
  private readonly host = 'free-aliexpress-api.p.rapidapi.com';

  constructor() {
    this.apiKey = process.env.RAPIDAPI_KEY;
  }

  private request(path: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const req = https.request({
        method: 'GET',
        hostname: this.host,
        path,
        headers: {
          'x-rapidapi-key': this.apiKey || '',
          'x-rapidapi-host': this.host
        }
      }, res => {
        const chunks: Buffer[] = [];
        res.on('data', c => chunks.push(c));
        res.on('end', () => {
          try { resolve(JSON.parse(Buffer.concat(chunks).toString())); }
          catch (e) { reject(e); }
        });
      });
      req.on('error', reject);
      req.end();
    });
  }

  public async searchProducts(query: string, page: number = 1, limit: number = 10): Promise<Product[]> {
    if (!this.apiKey) return [];
    try {
      const q = encodeURIComponent(query);
      const data = await this.request(`/search?query=${q}&target_currency=USD&target_language=EN&page=${page}`);
      const items = Array.isArray(data?.data) ? data.data.slice(0, limit) : [];
      const now = new Date().toISOString();
      return items.map((i: any) => ({
        id: String(i.product_id || i.id),
        url: i.product_detail_url || i.url,
        title: i.product_title || i.title || '',
        price: Number(i.product_price || i.price || 0),
        currency: 'USD',
        platform: 'aliexpress',
        imageUrl: i.product_main_image_url || i.image || '',
        createdAt: now,
        updatedAt: now,
        userId: 'system'
      } as Product));
    } catch (e) {
      return [];
    }
  }
}

export default AliExpressService;


