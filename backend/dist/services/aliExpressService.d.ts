import { Product } from '../config/storage';
export declare class AliExpressService {
    private readonly apiKey;
    private readonly host;
    constructor();
    private request;
    searchProducts(query: string, page?: number, limit?: number): Promise<Product[]>;
}
export default AliExpressService;
//# sourceMappingURL=aliExpressService.d.ts.map