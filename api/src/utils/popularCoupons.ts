export interface PopularCoupon {
    code: string;
    stores: string[]; // "amazon", "walmart", or "*" for all
    desc: string;
}

export const POPULAR_COUPONS: PopularCoupon[] = [
    { code: "SAVE20", stores: ["amazon", "walmart"], desc: "20% off select items" },
    { code: "APPLE15", stores: ["amazon", "bestbuy"], desc: "$15 off Apple products" },
    { code: "TECH10", stores: ["amazon", "ebay"], desc: "10% off electronics" },
    { code: "WOWFRESH", stores: ["walmart"], desc: "$10 off + free shipping" },
    { code: "PERFECT10", stores: ["ebay"], desc: "10% off $100+" },
    { code: "FREESHIP", stores: ["*"], desc: "Free shipping on $35+" },
    { code: "WELCOME15", stores: ["*"], desc: "15% off first order" },
    { code: "BF25", stores: ["amazon", "bestbuy"], desc: "25% off Black Friday deals" },
    { code: "STUDENT100", stores: ["bestbuy"], desc: "$100 off for students" },
    { code: "HOME20", stores: ["walmart"], desc: "20% off home & tech" }
];
