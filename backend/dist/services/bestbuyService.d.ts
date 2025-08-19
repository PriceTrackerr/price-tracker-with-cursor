import { Product } from '../config/storage';
export declare class BestBuyService {
    private readonly apiKey;
    constructor();
    searchProducts(query: string, limit?: number): Promise<Product[]>;
}
export default BestBuyService;
//# sourceMappingURL=bestbuyService.d.ts.map