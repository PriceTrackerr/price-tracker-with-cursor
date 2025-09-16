"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config({ path: require('path').resolve(__dirname, '../../.env') });
const emailService_1 = __importDefault(require("../services/emailService"));
const emailService = new emailService_1.default();
(async () => {
    console.log('GMAIL_USER:', process.env.GMAIL_USER);
    console.log('GMAIL_APP_PASSWORD:', process.env.GMAIL_APP_PASSWORD ? '***' : '(empty)');
    const result = await emailService.sendPriceDropAlert('mikeabrsh21@gmail.com', 'Test Product', 10.99, 15.99, 'https://example.com/product', 'amazon');
    console.log('Test email send result:', result);
})();
//# sourceMappingURL=sendTestEmail.js.map