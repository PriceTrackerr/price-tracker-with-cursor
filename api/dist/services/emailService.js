"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const nodemailer_1 = __importDefault(require("nodemailer"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
function addAffiliateTag(url, platform) {
    if (platform === 'amazon') {
        const affiliateTag = '?tag=pricetrack0f8-20';
        return url.includes('?') ? `${url}&tag=pricetrack0f8-20` : `${url}${affiliateTag}`;
    }
    else if (platform === 'aliexpress') {
        const hasQuery = url.includes('?');
        const sep = hasQuery ? '&' : '?';
        return `${url}${sep}aff_platform=api&aff_short_key=pricetrack0f8-20`;
    }
    else if (platform === 'ebay') {
        const affiliateTag = '?campid=your-ebay-campaign-id';
        return url.includes('?') ? `${url}&campid=your-ebay-campaign-id` : `${url}${affiliateTag}`;
    }
    else if (platform === 'walmart') {
        const affiliateTag = '?affiliate=your-walmart-affiliate-id';
        return url.includes('?') ? `${url}&affiliate=your-walmart-affiliate-id` : `${url}${affiliateTag}`;
    }
    else if (platform === 'shein') {
        const affiliateTag = '?ref=your-shein-referral-code';
        return url.includes('?') ? `${url}&ref=your-shein-referral-code` : `${url}${affiliateTag}`;
    }
    else if (platform === 'bestbuy') {
        const affiliateTag = '?campid=your-bestbuy-campaign-id';
        return url.includes('?') ? `${url}&campid=your-bestbuy-campaign-id` : `${url}${affiliateTag}`;
    }
    else if (platform === 'target') {
        const affiliateTag = '?affiliate=your-target-affiliate-id';
        return url.includes('?') ? `${url}&affiliate=your-target-affiliate-id` : `${url}${affiliateTag}`;
    }
    return url;
}
const getEmailStyles = () => `
<style>
  body {
    margin: 0;
    padding: 0;
    font-family: Arial, Helvetica, sans-serif;
    background-color: #f9fafb;
    line-height: 1.6;
    -webkit-text-size-adjust: 100%;
    -ms-text-size-adjust: 100%;
  }
  
  .email-container {
    background-color: #f9fafb;
    min-height: 100vh;
    width: 100%;
  }
  
  /* Email-safe animations */
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.8; }
  }
  
  /* Force table layout for email clients */
  table {
    border-collapse: collapse;
    mso-table-lspace: 0pt;
    mso-table-rspace: 0pt;
  }
  
  /* Reset for email clients */
  img {
    border: 0;
    height: auto;
    line-height: 100%;
    outline: none;
    text-decoration: none;
    -ms-interpolation-mode: bicubic;
  }
  
  /* Force Outlook to provide a "view in browser" message */
  #outlook a {
    padding: 0;
  }
  
  /* Force Outlook.com to display emails at full width */
  .ReadMsgBody {
    width: 100%;
  }
  
  /* Force iOS devices to display emails at full width */
  .ExternalClass {
    width: 100%;
  }
  
  .ExternalClass,
  .ExternalClass p,
  .ExternalClass span,
  .ExternalClass font,
  .ExternalClass td,
  .ExternalClass div {
    line-height: 100%;
  }
  
  /* Email-safe gradients and colors */
  .header-gradient {
    background: linear-gradient(135deg, #ef4444 0%, #f97316 50%, #ef4444 100%);
  }
  
  .savings-gradient {
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  }
  
  .cta-gradient {
    background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  }
  
  .urgency-gradient {
    background: linear-gradient(135deg, #fef3e2 0%, #fed7aa 100%);
  }
  
  .welcome-gradient {
    background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #2563eb 100%);
  }
  
  .consolidated-gradient {
    background: linear-gradient(135deg, #10b981 0%, #059669 50%, #06b6d4 100%);
  }
</style>
`;
class EmailService {
    constructor() {
        this.transporter = nodemailer_1.default.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.GMAIL_USER,
                pass: process.env.GMAIL_APP_PASSWORD,
            },
            tls: {
                rejectUnauthorized: false
            }
        });
    }
    getEmailHeader() {
        return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>PriceTracker</title>
        ${getEmailStyles()}
      </head>
      <body>
    `;
    }
    getEmailFooter() {
        return `
        </body>
      </html>
    `;
    }
    getPlatformClass(platform) {
        const platformClasses = {
            amazon: 'amazon',
            aliexpress: 'aliexpress',
            ebay: 'ebay',
            walmart: 'walmart',
            shein: 'shein',
        };
        return platformClasses[platform.toLowerCase()] || 'default';
    }
    async sendEmail(options) {
        try {
            const mailOptions = {
                from: process.env.GMAIL_USER,
                to: options.to,
                subject: options.subject,
                html: options.html,
            };
            await this.transporter.sendMail(mailOptions);
            console.log(`✅ Email sent successfully to ${options.to}`);
            return true;
        }
        catch (error) {
            console.error('❌ Error sending email:', error);
            return false;
        }
    }
    async sendPriceDropAlert(userEmail, productTitle, currentPrice, previousPrice, productUrl, platform) {
        const priceDrop = previousPrice - currentPrice;
        const priceDropPercent = Math.round((priceDrop / previousPrice) * 100);
        const urlWithAffiliate = addAffiliateTag(productUrl, platform);
        const html = `
      ${this.getEmailHeader()}
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; font-family: Arial, Helvetica, sans-serif;">
        <tr>
          <td align="center" style="padding: 20px 0;">
            <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #ef4444 0%, #f97316 50%, #ef4444 100%); padding: 32px 24px; text-align: center;">
                  <h1 style="font-size: 24px; font-weight: bold; color: white; margin: 0 0 8px 0; font-family: Arial, Helvetica, sans-serif;">🔥 PRICE DROP ALERT 🔥</h1>
                  <p style="font-size: 16px; color: rgba(255, 255, 255, 0.9); margin: 0; font-family: Arial, Helvetica, sans-serif;">Your target price has been reached!</p>
                </td>
              </tr>
              
              <!-- Product Card -->
              <tr>
                <td style="background: white; padding: 24px;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <!-- Savings Banner -->
                    <tr>
                      <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; text-align: center; padding: 12px; border-radius: 8px 8px 0 0;">
                        <span style="font-size: 14px; font-weight: bold;">💰 You're saving $${priceDrop.toFixed(2)} (${priceDropPercent}% off)!</span>
                      </td>
                    </tr>
                    
                    <!-- Product Content -->
                    <tr>
                      <td style="background: white; padding: 24px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; border-top: none;">
                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <!-- Product Image -->
                            <td width="120" style="vertical-align: top; padding-right: 24px;">
                              <div style="width: 120px; height: 120px; background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); border-radius: 8px; text-align: center; padding: 20px; box-sizing: border-box;">
                                <span style="font-size: 48px;">🎧</span>
                              </div>
                            </td>
                            
                            <!-- Product Details -->
                            <td style="vertical-align: top;">
                              <table width="100%" cellpadding="0" cellspacing="0">
                                <!-- Platform Badges -->
                                <tr>
                                  <td style="padding-bottom: 12px;">
                                    <span style="display: inline-block; background: #fef3e2; color: #ea580c; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; margin-right: 8px;">
                                      ${platform.charAt(0).toUpperCase() + platform.slice(1)}
                                    </span>
                                    <span style="display: inline-block; background: #dcfce7; color: #166534; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold;">
                                      -${priceDropPercent}%
                                    </span>
                                  </td>
                                </tr>
                                
                                <!-- Product Title -->
                                <tr>
                                  <td style="padding-bottom: 16px;">
                                    <h2 style="font-size: 18px; font-weight: bold; color: #111827; margin: 0; line-height: 1.4; font-family: Arial, Helvetica, sans-serif;">${productTitle}</h2>
                                  </td>
                                </tr>
                                
                                <!-- Price Section -->
                                <tr>
                                  <td style="padding-bottom: 16px;">
                                    <div style="margin-bottom: 8px;">
                                      <span style="font-size: 28px; font-weight: bold; color: #10b981;">$${currentPrice.toFixed(2)}</span>
                                      <span style="font-size: 16px; color: #6b7280; text-decoration: line-through; margin-left: 8px;">$${previousPrice.toFixed(2)}</span>
                                    </div>
                                    <div style="display: inline-block; background: #dc2626; color: white; padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: bold;">Save $${priceDrop.toFixed(2)}</div>
                                  </td>
                                </tr>
                                
                                <!-- Action Button -->
                                <tr>
                                  <td>
                                    <a href="${urlWithAffiliate}" style="display: inline-block; background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold; font-size: 16px; text-align: center; font-family: Arial, Helvetica, sans-serif;">
                                      View Deal Now →
                                    </a>
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              
              <!-- Urgency Section -->
              <tr>
                <td style="padding: 0 24px 24px 24px;">
                  <div style="background: linear-gradient(135deg, #fef3e2 0%, #fed7aa 100%); border: 1px solid #fbbf24; border-radius: 8px; padding: 24px;">
                    <h3 style="color: #92400e; margin: 0 0 8px 0; font-size: 18px; font-family: Arial, Helvetica, sans-serif;">⚡ Act Fast!</h3>
                    <p style="color: #92400e; font-size: 14px; margin: 0; font-family: Arial, Helvetica, sans-serif;">Price drops like this don't last long. This item is popular and the price could go back up at any time.</p>
                  </div>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background: #f3f4f6; padding: 24px; text-align: center;">
                  <p style="color: #6b7280; font-size: 14px; margin: 0 0 16px 0; font-family: Arial, Helvetica, sans-serif;">You're receiving this because you have an active price alert for this product.</p>
                  <p style="color: #6b7280; font-size: 12px; margin: 0; font-family: Arial, Helvetica, sans-serif;">Price Tracker</p>
                </td>
              </tr>
              
            </table>
          </td>
        </tr>
      </table>
      ${this.getEmailFooter()}
    `;
        return this.sendEmail({
            to: userEmail,
            subject: `🔥 Price Drop Alert: ${productTitle}`,
            html,
        });
    }
    async sendConsolidatedPriceDropAlert(userEmail, priceDrops) {
        const totalSavings = priceDrops.reduce((sum, drop) => sum + (drop.previousPrice - drop.currentPrice), 0);
        const isSingleDrop = priceDrops.length === 1;
        const headerText = isSingleDrop ? "🎁 Price Drop Alert!" : "🎁 Multiple Price Drops!";
        const subtitleText = isSingleDrop ? "You have 1 product with a price drop" : `You have ${priceDrops.length} products with price drops`;
        let productsHTML = '';
        priceDrops.forEach((drop, index) => {
            const priceDrop = drop.previousPrice - drop.currentPrice;
            const priceDropPercent = Math.round((priceDrop / drop.previousPrice) * 100);
            const urlWithAffiliate = addAffiliateTag(drop.productUrl, drop.platform);
            productsHTML += `
        <tr>
          <td style="background: white; padding: 16px; border-radius: 8px; margin-bottom: 16px; border: 1px solid #e5e7eb;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td width="80" style="vertical-align: top; padding-right: 16px;">
                  <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); border-radius: 6px; text-align: center; padding: 12px; box-sizing: border-box;">
                    <span style="font-size: 32px;">🎧</span>
                  </div>
                </td>
                <td style="vertical-align: top;">
                  <h3 style="font-size: 16px; font-weight: bold; color: #111827; margin: 0 0 8px 0; font-family: Arial, Helvetica, sans-serif;">${drop.productTitle}</h3>
                  <p style="margin: 0 0 8px 0;">
                    <span style="display: inline-block; background: #fef3e2; color: #ea580c; padding: 3px 6px; border-radius: 3px; font-size: 11px; font-weight: bold; margin-right: 6px;">
                      ${drop.platform.charAt(0).toUpperCase() + drop.platform.slice(1)}
                    </span>
                    <span style="display: inline-block; background: #dcfce7; color: #166534; padding: 3px 6px; border-radius: 3px; font-size: 11px; font-weight: bold;">
                      -${priceDropPercent}%
                    </span>
                  </p>
                  <p style="margin: 0 0 8px 0;">
                    <span style="font-size: 20px; font-weight: bold; color: #10b981;">$${drop.currentPrice.toFixed(2)}</span>
                    <span style="font-size: 14px; color: #6b7280; text-decoration: line-through; margin-left: 6px;">$${drop.previousPrice.toFixed(2)}</span>
                  </p>
                  <a href="${urlWithAffiliate}" style="display: inline-block; background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: white; text-decoration: none; padding: 8px 16px; border-radius: 6px; font-weight: bold; font-size: 14px; font-family: Arial, Helvetica, sans-serif;">
                    View Deal →
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      `;
        });
        const html = `
      ${this.getEmailHeader()}
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; font-family: Arial, Helvetica, sans-serif;">
        <tr>
          <td align="center" style="padding: 20px 0;">
            <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #10b981 0%, #059669 50%, #06b6d4 100%); padding: 32px 24px; text-align: center;">
                  <h1 style="font-size: 24px; font-weight: bold; color: white; margin: 0 0 8px 0; font-family: Arial, Helvetica, sans-serif;">${headerText}</h1>
                  <p style="font-size: 16px; color: rgba(255, 255, 255, 0.9); margin: 0; font-family: Arial, Helvetica, sans-serif;">${subtitleText}</p>
                </td>
              </tr>
              
              <!-- Total Savings Banner -->
              <tr>
                <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; text-align: center; padding: 16px 24px;">
                  <span style="font-size: 18px; font-weight: bold;">💰 Total Savings: $${totalSavings.toFixed(2)}</span>
                </td>
              </tr>
              
              <!-- Products List -->
              <tr>
                <td style="padding: 24px;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    ${productsHTML}
                  </table>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background: #f3f4f6; padding: 24px; text-align: center;">
                  <p style="color: #6b7280; font-size: 14px; margin: 0 0 16px 0; font-family: Arial, Helvetica, sans-serif;">You're receiving this because you have an active price alert for this product.</p>
                  <p style="color: #6b7280; font-size: 12px; margin: 0; font-family: Arial, Helvetica, sans-serif;">Price Tracker</p>
                </td>
              </tr>
              
            </table>
          </td>
        </tr>
      </table>
      ${this.getEmailFooter()}
    `;
        return this.sendEmail({
            to: userEmail,
            subject: `🎁 ${priceDrops.length === 1 ? 'Price Drop Alert' : `${priceDrops.length} Price Drops Alert`}`,
            html,
        });
    }
    async sendWelcomeEmail(userEmail, username) {
        const html = `
      ${this.getEmailHeader()}
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; font-family: Arial, Helvetica, sans-serif;">
        <tr>
          <td align="center" style="padding: 20px 0;">
            <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #2563eb 100%); padding: 32px 24px; text-align: center;">
                  <h1 style="font-size: 24px; font-weight: bold; color: white; margin: 0 0 8px 0; font-family: Arial, Helvetica, sans-serif;">🎉 Welcome to PriceTracker!</h1>
                  <p style="font-size: 16px; color: rgba(255, 255, 255, 0.9); margin: 0; font-family: Arial, Helvetica, sans-serif;">Start tracking prices and never miss a deal</p>
                </td>
              </tr>
              
              <!-- Welcome Message -->
              <tr>
                <td style="padding: 32px 24px;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="text-align: center; padding-bottom: 24px;">
                        <h2 style="font-size: 20px; font-weight: bold; color: #111827; margin: 0 0 12px 0; font-family: Arial, Helvetica, sans-serif;">Hi ${username}! 👋</h2>
                        <p style="font-size: 16px; color: #6b7280; margin: 0; font-family: Arial, Helvetica, sans-serif;">Welcome to PriceTracker! We're excited to help you find the best deals and never miss a price drop.</p>
                      </td>
                    </tr>
                    
                    <!-- Getting Started -->
                    <tr>
                      <td style="padding-top: 24px;">
                        <h3 style="font-size: 18px; font-weight: bold; color: #111827; margin: 0 0 16px 0; font-family: Arial, Helvetica, sans-serif;">🚀 Getting Started</h3>
                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                              <span style="display: inline-block; width: 24px; height: 24px; background: #2563eb; color: white; border-radius: 50%; text-align: center; line-height: 24px; font-size: 12px; font-weight: bold; margin-right: 12px;">1</span>
                              <span style="font-size: 16px; color: #111827; font-family: Arial, Helvetica, sans-serif;">Install our browser extension</span>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                              <span style="display: inline-block; width: 24px; height: 24px; background: #2563eb; color: white; border-radius: 50%; text-align: center; line-height: 24px; font-size: 12px; font-weight: bold; margin-right: 12px;">2</span>
                              <span style="font-size: 16px; color: #111827; font-family: Arial, Helvetica, sans-serif;">Browse your favorite stores</span>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                              <span style="display: inline-block; width: 24px; height: 24px; background: #2563eb; color: white; border-radius: 50%; text-align: center; line-height: 24px; font-size: 12px; font-weight: bold; margin-right: 12px;">3</span>
                              <span style="font-size: 16px; color: #111827; font-family: Arial, Helvetica, sans-serif;">Click "Track Product" when you find something you like</span>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 12px 0;">
                              <span style="display: inline-block; width: 24px; height: 24px; background: #2563eb; color: white; border-radius: 50%; text-align: center; line-height: 24px; font-size: 12px; font-weight: bold; margin-right: 12px;">4</span>
                              <span style="font-size: 16px; color: #111827; font-family: Arial, Helvetica, sans-serif;">Get notified when prices drop!</span>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    
                    <!-- CTA -->
                    <tr>
                      <td style="text-align: center; padding-top: 32px;">
                        <a href="${process.env.FRONTEND_URL || 'https://price-tracker-with-cursor-web-app.vercel.app'}" style="display: inline-block; background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: white; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: bold; font-size: 18px; font-family: Arial, Helvetica, sans-serif;">
                          Start Tracking Now →
                        </a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background: #f3f4f6; padding: 24px; text-align: center;">
                  <p style="color: #6b7280; font-size: 14px; margin: 0 0 16px 0; font-family: Arial, Helvetica, sans-serif;">Happy shopping! 🛍️</p>
                  <p style="color: #6b7280; font-size: 12px; margin: 0; font-family: Arial, Helvetica, sans-serif;">Price Tracker</p>
                </td>
              </tr>
              
            </table>
          </td>
        </tr>
      </table>
      ${this.getEmailFooter()}
    `;
        return this.sendEmail({
            to: userEmail,
            subject: '🎉 Welcome to PriceTracker!',
            html,
        });
    }
    async sendRestockAlert(userEmail, productTitle, productUrl, platform) {
        const urlWithAffiliate = addAffiliateTag(productUrl, platform);
        const html = `
      ${this.getEmailHeader()}
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; font-family: Arial, Helvetica, sans-serif;">
        <tr>
          <td align="center" style="padding: 20px 0;">
            <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 32px 24px; text-align: center;">
                  <h1 style="font-size: 24px; font-weight: bold; color: white; margin: 0 0 8px 0; font-family: Arial, Helvetica, sans-serif;">📦 Back in Stock!</h1>
                  <p style="font-size: 16px; color: rgba(255, 255, 255, 0.9); margin: 0; font-family: Arial, Helvetica, sans-serif;">Your tracked item is available again</p>
                </td>
              </tr>
              
              <!-- Product Info -->
              <tr>
                <td style="padding: 32px 24px;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td width="120" style="vertical-align: top; padding-right: 24px;">
                        <div style="width: 120px; height: 120px; background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); border-radius: 8px; text-align: center; padding: 20px; box-sizing: border-box;">
                          <span style="font-size: 48px;">📦</span>
                        </div>
                      </td>
                      <td style="vertical-align: top;">
                        <h2 style="font-size: 18px; font-weight: bold; color: #111827; margin: 0 0 12px 0; font-family: Arial, Helvetica, sans-serif;">${productTitle}</h2>
                        <p style="margin: 0 0 16px 0;">
                          <span style="display: inline-block; background: #fef3e2; color: #ea580c; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold;">
                            ${platform.charAt(0).toUpperCase() + platform.slice(1)}
                          </span>
                        </p>
                        <a href="${urlWithAffiliate}" style="display: inline-block; background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold; font-size: 16px; font-family: Arial, Helvetica, sans-serif;">
                          Check Availability →
                        </a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background: #f3f4f6; padding: 24px; text-align: center;">
                  <p style="color: #6b7280; font-size: 14px; margin: 0 0 16px 0; font-family: Arial, Helvetica, sans-serif;">You're receiving this because you have an active stock alert for this product.</p>
                  <p style="color: #6b7280; font-size: 12px; margin: 0; font-family: Arial, Helvetica, sans-serif;">Price Tracker</p>
                </td>
              </tr>
              
            </table>
          </td>
        </tr>
      </table>
      ${this.getEmailFooter()}
    `;
        return this.sendEmail({
            to: userEmail,
            subject: `📦 Back in Stock: ${productTitle}`,
            html,
        });
    }
}
exports.default = EmailService;
//# sourceMappingURL=emailService.js.map