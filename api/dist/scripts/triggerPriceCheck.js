"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config({ path: require('path').resolve(__dirname, '../../.env') });
const cronJobs_1 = require("../services/cronJobs");
(async () => {
    console.log('Triggering price/stock alert check...');
    await (0, cronJobs_1.checkPriceAlerts)();
    console.log('Check complete.');
})();
//# sourceMappingURL=triggerPriceCheck.js.map