interface EmailOptions {
    to: string;
    subject: string;
    html: string;
}
declare class EmailService {
    private transporter;
    constructor();
    private getEmailHeader;
    private getEmailFooter;
    private getPlatformClass;
    sendEmail(options: EmailOptions): Promise<boolean>;
    sendPriceDropAlert(userEmail: string, productTitle: string, currentPrice: number, previousPrice: number, productUrl: string, platform: 'amazon' | 'aliexpress' | 'ebay' | 'walmart' | 'shein' | 'bestbuy' | 'target'): Promise<boolean>;
    sendConsolidatedPriceDropAlert(userEmail: string, priceDrops: Array<{
        productTitle: string;
        currentPrice: number;
        previousPrice: number;
        productUrl: string;
        platform: 'amazon' | 'aliexpress' | 'ebay' | 'walmart' | 'shein' | 'bestbuy' | 'target';
    }>): Promise<boolean>;
    sendWelcomeEmail(userEmail: string, username: string): Promise<boolean>;
    sendRestockAlert(userEmail: string, productTitle: string, productUrl: string, platform: 'amazon' | 'aliexpress' | 'ebay' | 'walmart' | 'shein' | 'bestbuy' | 'target'): Promise<boolean>;
}
export default EmailService;
//# sourceMappingURL=emailService.d.ts.map