import { Product } from '../config/storage';
export declare class WalmartService {
    private readonly apiKey;
    constructor();
    searchProducts(query: string, limit?: number): Promise<Product[]>;
}
export default WalmartService;
//# sourceMappingURL=walmartService.d.ts.map