type ScoreInput = {
  subscribers: number;
  views30d: number;
  retentionProxy: number;
  nicheMatch: number;
  geoMatch: number;
  minSubscribers?: number | null;
  minViews30d?: number | null;
};

export function calculateCampaignScore(input: ScoreInput) {
  const subsFit = input.minSubscribers
    ? Math.min(input.subscribers / input.minSubscribers, 1)
    : 1;
  const viewsFit = input.minViews30d ? Math.min(input.views30d / input.minViews30d, 1) : 1;
  const retentionFit = Math.max(0, Math.min(input.retentionProxy, 1));
  const relevanceFit = (input.nicheMatch + input.geoMatch) / 2;

  const breakdown = {
    audienceSizeFit: Number((subsFit * 100).toFixed(2)),
    recentViewsFit: Number((viewsFit * 100).toFixed(2)),
    engagementRetentionFit: Number((retentionFit * 100).toFixed(2)),
    nicheGeoRelevanceFit: Number((relevanceFit * 100).toFixed(2)),
  };

  const score =
    breakdown.audienceSizeFit * 0.3 +
    breakdown.recentViewsFit * 0.3 +
    breakdown.engagementRetentionFit * 0.2 +
    breakdown.nicheGeoRelevanceFit * 0.2;

  return {
    score: Number(score.toFixed(2)),
    breakdown,
  };
}
