export const CUSTOMER_TIERS = Object.freeze({
  BRONZE: "bronze",
  SILVER: "silver",
  GOLD: "gold",
  DIAMOND: "diamond",
});

export const CUSTOMER_TIER_LABELS = Object.freeze({
  [CUSTOMER_TIERS.BRONZE]: "Khách hàng đồng",
  [CUSTOMER_TIERS.SILVER]: "Khách hàng bạc",
  [CUSTOMER_TIERS.GOLD]: "Khách hàng vàng",
  [CUSTOMER_TIERS.DIAMOND]: "Khách hàng kim cương",
});

export const CUSTOMER_TIER_THRESHOLDS = [
  { tier: CUSTOMER_TIERS.DIAMOND, min: 50000000 },
  { tier: CUSTOMER_TIERS.GOLD, min: 20000000 },
  { tier: CUSTOMER_TIERS.SILVER, min: 10000000 },
  { tier: CUSTOMER_TIERS.BRONZE, min: 0 },
];

export const determineCustomerTier = (lifetimeSpend = 0) => {
  const spend = Number(lifetimeSpend) || 0;
  const match =
    CUSTOMER_TIER_THRESHOLDS.find((entry) => spend >= entry.min) ||
    CUSTOMER_TIER_THRESHOLDS[CUSTOMER_TIER_THRESHOLDS.length - 1];
  return match.tier;
};

