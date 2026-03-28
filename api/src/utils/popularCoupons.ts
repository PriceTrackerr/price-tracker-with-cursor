export interface PopularCoupon {
    code: string;
    stores: string[]; // specific store names only — NO wildcards
    desc: string;
}

// Only include store-specific codes that are well-known and periodically valid.
// Do NOT add wildcard ('*') entries — they show up for every product and feel fake.
// These should be periodically reviewed and pruned.
export const POPULAR_COUPONS: PopularCoupon[] = [
    // NOTE: All entries below have been removed because they were either
    // fabricated or outdated. When you have REAL verified coupon codes,
    // add them here with the specific store they belong to.
    //
    // Example of a valid entry:
    // { code: "HOLIDAY25", stores: ["amazon"], desc: "25% off holiday deals (Dec 2025)" },
];
