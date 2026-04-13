export const MARKETING_PRICING_CONFIG = {
  leadFreemiumUsd: 25,
  leadPremiumUsd: 50,
  leadOptInReceiveUsd: 60,
  setupCreateUsd: 300,
  setupLaunchUsd: 400,
  nftCreationPackUsd: 400,
} as const;

export function marketingSetupFeeUsd(): number {
  return MARKETING_PRICING_CONFIG.setupCreateUsd + MARKETING_PRICING_CONFIG.setupLaunchUsd;
}
