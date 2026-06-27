export interface ScoringConfig {
  killPointValue?: number;
  placementPoints?: Array<{ position: number; points: number }>;
}

export interface TeamMatchResult {
  id?: string;
  teamId: string;
  teamName?: string;
  clanName?: string;
  day: number;
  lobby: number;
  placement: number;
  kills: number;
  damage?: number;
}

export interface BonusPoint {
  id?: string;
  teamId: string;
  day: number;
  amount: number;
}

function stdDev(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
  return Math.sqrt(variance);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function getPlacementPoints(placement: number, placementTable: Array<{ position: number; points: number }> = []): number {
  const entry = placementTable.find((p) => p.position === placement);
  return entry ? entry.points : 0;
}

function applyTiebreakers<T extends { totalPts: number; placementPts: number; kills: number; wins: number }>(standings: T[]): T[] {
  return [...standings].sort((a, b) => {
    if (b.totalPts !== a.totalPts) return b.totalPts - a.totalPts;
    if (b.placementPts !== a.placementPts) return b.placementPts - a.placementPts;
    if (b.kills !== a.kills) return b.kills - a.kills;
    return b.wins - a.wins;
  });
}

export function computeSeasonStandings(
  teamMatchResults: TeamMatchResult[],
  bonusPoints: BonusPoint[],
  scoringConfig: ScoringConfig
) {
  const killPointValue = scoringConfig.killPointValue ?? 2;
  const placementPoints = scoringConfig.placementPoints ?? [];

  const teamMap: Record<string, {
    teamId: string;
    teamName: string;
    clanName: string;
    wins: number;
    matches: number;
    placementPts: number;
    kills: number;
    damage: number;
    bonusPts: number;
    sumOfPositions: number;
    top3Finishes: number;
    top5Finishes: number;
    activeDays: Set<number>;
    perDay: Record<number, { wins: number; matches: number; placePts: number; kills: number; bonusPts: number }>;
  }> = {};

  for (const result of teamMatchResults) {
    const key = result.teamId;
    if (!teamMap[key]) {
      teamMap[key] = {
        teamId: result.teamId,
        teamName: result.teamName || result.teamId,
        clanName: result.clanName || '',
        wins: 0,
        matches: 0,
        placementPts: 0,
        kills: 0,
        damage: 0,
        bonusPts: 0,
        sumOfPositions: 0,
        top3Finishes: 0,
        top5Finishes: 0,
        activeDays: new Set<number>(),
        perDay: {},
      };
    }
    const t = teamMap[key];
    t.matches++;
    t.kills += result.kills || 0;
    t.damage += result.damage || 0;
    t.sumOfPositions += result.placement || 0;
    const ppts = getPlacementPoints(result.placement, placementPoints);
    t.placementPts += ppts;
    if (result.placement === 1) t.wins++;
    if (result.placement <= 3) t.top3Finishes++;
    if (result.placement <= 5) t.top5Finishes++;
    t.activeDays.add(result.day);

    if (!t.perDay[result.day]) {
      t.perDay[result.day] = { wins: 0, matches: 0, placePts: 0, kills: 0, bonusPts: 0 };
    }
    t.perDay[result.day].matches++;
    t.perDay[result.day].kills += result.kills || 0;
    t.perDay[result.day].placePts += ppts;
    if (result.placement === 1) t.perDay[result.day].wins++;
  }

  for (const bonus of bonusPoints) {
    const key = bonus.teamId;
    if (teamMap[key]) {
      teamMap[key].bonusPts += bonus.amount || 0;
      if (!teamMap[key].perDay[bonus.day]) {
        teamMap[key].perDay[bonus.day] = { wins: 0, matches: 0, placePts: 0, kills: 0, bonusPts: 0 };
      }
      teamMap[key].perDay[bonus.day].bonusPts += bonus.amount || 0;
    }
  }

  const standings = Object.values(teamMap).map((t) => {
    const killPts = t.kills * killPointValue;
    const events = t.activeDays.size;

    const perDay: Record<number, {
      wins: number;
      matches: number;
      placePts: number;
      kills: number;
      bonusPts: number;
      killPts: number;
      totalPts: number;
    }> = {};

    for (const [dayStr, d] of Object.entries(t.perDay)) {
      const day = Number(dayStr);
      const dKillPts = d.kills * killPointValue;
      perDay[day] = {
        ...d,
        killPts: dKillPts,
        totalPts: d.placePts + dKillPts + d.bonusPts,
      };
    }

    return {
      teamId: t.teamId,
      teamName: t.teamName,
      clanName: t.clanName,
      wins: t.wins,
      matches: t.matches,
      placementPts: t.placementPts,
      kills: t.kills,
      damage: t.damage,
      bonusPts: t.bonusPts,
      sumOfPositions: t.sumOfPositions,
      top3Finishes: t.top3Finishes,
      top5Finishes: t.top5Finishes,
      events,
      killPts,
      totalPts: t.placementPts + killPts + t.bonusPts,
      perDay,
      activeDays: Array.from(t.activeDays).sort((a, b) => a - b),
    };
  });

  return applyTiebreakers(standings);
}

function computeCoreAnalytics(
  team: ReturnType<typeof computeSeasonStandings>[0],
  scoringConfig: ScoringConfig
) {
  const killPointValue = scoringConfig.killPointValue ?? 2;
  const placementPoints = scoringConfig.placementPoints ?? [];
  const maxPlacementPoints = placementPoints.length > 0 ? Math.max(...placementPoints.map((p) => p.points)) : 25;
  const maxPosition = placementPoints.length > 0 ? Math.max(...placementPoints.map((p) => p.position)) : 25;

  const { wins, matches, placementPts, kills, totalPts, sumOfPositions, top3Finishes, top5Finishes } = team;

  const PPM = matches > 0 ? round2(totalPts / matches) : 0;
  const KPM = matches > 0 ? round2(kills / matches) : 0;
  const avgPlace = matches > 0 ? round2(sumOfPositions / matches) : 0;
  const killPct = totalPts > 0 ? round2(((kills * killPointValue) / totalPts) * 100) : 0;
  const tKillPts = kills * killPointValue;

  const placementEfficiency = matches > 0 ? round2(placementPts / matches) : 0;
  const top3Rate = matches > 0 ? round2((top3Finishes / matches) * 100) : 0;
  const top5Rate = matches > 0 ? round2((top5Finishes / matches) * 100) : 0;
  const top3vs5Spread = round2(top5Rate - top3Rate);
  const conversionRate = top5Finishes > 0 ? round2((wins / top5Finishes) * 100) : 0;
  const conversionRateTop3 = top3Finishes > 0 ? round2((wins / top3Finishes) * 100) : 0;
  const winRate = matches > 0 ? round2((wins / matches) * 100) : 0;

  const perDay = team.perDay || {};
  const activeDays = Object.keys(perDay).map(Number).sort((a, b) => a - b);
  const mid = Math.ceil(activeDays.length / 2);
  const firstHalfDays = activeDays.slice(0, mid);
  const secondHalfDays = activeDays.slice(mid);

  const firstHalfPts = firstHalfDays.reduce((sum, d) => sum + (perDay[d]?.totalPts || 0), 0);
  const secondHalfPts = secondHalfDays.reduce((sum, d) => sum + (perDay[d]?.totalPts || 0), 0);
  const firstHalfMatches = firstHalfDays.reduce((sum, d) => sum + (perDay[d]?.matches || 0), 0);
  const secondHalfMatches = secondHalfDays.reduce((sum, d) => sum + (perDay[d]?.matches || 0), 0);

  const firstHalfPPM = firstHalfMatches > 0 ? firstHalfPts / firstHalfMatches : 0;
  const secondHalfPPM = secondHalfMatches > 0 ? secondHalfPts / secondHalfMatches : 0;

  let forwardMI = 0;
  if (firstHalfPPM === 0) {
    forwardMI = secondHalfPPM > 0 ? 1 : 0;
  } else {
    forwardMI = round2(secondHalfPPM / firstHalfPPM);
  }

  const placeDominanceIndex = matches > 0 ? round2((wins / matches) * 100) : 0;

  const dPPM = activeDays.map((d) => {
    const pd = perDay[d];
    return {
      day: d,
      ppm: pd && pd.matches > 0 ? round2(pd.totalPts / pd.matches) : 0,
    };
  });
  const ppmValues = dPPM.map((x) => x.ppm);
  const rangeCS = ppmValues.length > 1 ? round2(Math.max(...ppmValues) - Math.min(...ppmValues)) : 0;
  const stdDevCS = round2(stdDev(ppmValues));

  return {
    PPM,
    KPM,
    avgPlace,
    killPct,
    tKillPts,
    placementEfficiency,
    top3Rate,
    sumT3F: top3Finishes,
    conversionRate,
    conversionRateTop3,
    top5Finishes,
    top5Rate,
    top3vs5Spread,
    forwardMI,
    firstHalfPts,
    secondHalfPts,
    winRate,
    placeDominanceIndex,
    rangeCS,
    stdDevCS,
    dPPM,
    maxPlacementPoints,
    maxPosition,
  };
}

function normalize(val: number, minVal: number, maxVal: number): number {
  if (maxVal === minVal) return 100;
  return Math.round(((val - minVal) / (maxVal - minVal)) * 100);
}

function playstyleLabel(power: number, placement: number, conversion: number): string {
  const maxVal = Math.max(power, placement, conversion);
  const minVal = Math.min(power, placement, conversion);
  if (maxVal - minVal < 12) {
    return 'Balanced';
  }
  if (power === maxVal) {
    return conversion >= 65 ? 'Aggressive Clutch' : 'Aggressive';
  }
  if (placement === maxVal) {
    return conversion >= 65 ? 'Tactical Clutch' : 'Tactical';
  }
  return placement >= power ? 'Defensive' : 'Clutch';
}

function powerLabel(score: number): string {
  if (score >= 80) return 'Elite';
  if (score >= 60) return 'Strong';
  if (score >= 40) return 'Balanced';
  if (score >= 20) return 'Passive';
  return 'Weak';
}

function placementLabel(score: number): string {
  if (score >= 80) return 'Dominant';
  if (score >= 60) return 'Controlled';
  if (score >= 40) return 'Stable';
  if (score >= 20) return 'Unstable';
  return 'Struggling';
}

function conversionLabel(score: number): string {
  if (score >= 80) return 'Clutch';
  if (score >= 60) return 'Efficient';
  if (score >= 40) return 'Average';
  if (score >= 20) return 'Wasteful';
  return 'Poor';
}

function formLabel(forwardMI: number, consistencyScore: number): string {
  if (forwardMI > 1.15 && consistencyScore >= 60) return 'Red Hot';
  if (forwardMI > 1.0) return 'In Form';
  if (forwardMI >= 0.9 && forwardMI <= 1.0 && consistencyScore >= 60) return 'Steady';
  if (consistencyScore < 40) return 'Inconsistent';
  if (forwardMI < 0.85) return 'Cold';
  return 'Steady';
}

export function teamRatingRankLabel(finalRating: number): string {
  if (finalRating >= 850) return 'Elite Rank';
  if (finalRating >= 750) return 'Top Rank';
  if (finalRating >= 550) return 'Pro Rank';
  if (finalRating >= 380) return 'Mid Rank';
  if (finalRating >= 220) return 'Low Rank';
  return 'Entry Rank';
}

export function computeTeamAnalytics(
  teamMatchResults: TeamMatchResult[],
  bonusPoints: BonusPoint[],
  scoringConfig: ScoringConfig
) {
  const seasonStandings = computeSeasonStandings(teamMatchResults, bonusPoints, scoringConfig);

  if (seasonStandings.length === 0) return [];

  const allTeamsTotalPts = seasonStandings.reduce((sum, t) => sum + t.totalPts, 0);

  let enriched = seasonStandings.map((team) => {
    const analytics = computeCoreAnalytics(team, scoringConfig);
    const pointsShareRatio = allTeamsTotalPts > 0
      ? round2((team.totalPts / allTeamsTotalPts) * 100)
      : 0;

    return {
      ...team,
      analytics: {
        ...analytics,
        pointsShareRatio,
      },
      normalization: {} as Record<string, number>,
      scores: {} as {
        POWER: number;
        PLACEMENT: number;
        CONVERSION: number;
        FORM: number;
        TEAM_RATING: number;
        FINAL_RATING: number;
        rankLabel: string;
      },
      labels: {} as {
        playstyle: string;
        powerLabel: string;
        placementLabel: string;
        conversionLabel: string;
        formLabel: string;
      },
      identity: 'Balanced',
    };
  });

  const metricsToNormalize = [
    'PPM', 'KPM', 'winRate', 'killPct', 'conversionRate', 'conversionRateTop3', 'top3Rate', 'top5Rate', 'placementEfficiency', 'forwardMI'
  ];

  for (const metric of metricsToNormalize) {
    const values = enriched.map((t) => (t.analytics as any)[metric] ?? 0);
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    enriched = enriched.map((t) => ({
      ...t,
      normalization: {
        ...t.normalization,
        [`N_${metric}`]: normalize((t.analytics as any)[metric] ?? 0, minVal, maxVal),
      },
    }));
  }

  const stdDevs = enriched.map((t) => t.analytics.stdDevCS ?? 0);
  const minStdDev = Math.min(...stdDevs);
  const maxStdDev = Math.max(...stdDevs);
  enriched = enriched.map((t) => {
    const consistencyScore = maxStdDev === minStdDev
      ? 100
      : round2(((maxStdDev - t.analytics.stdDevCS) / (maxStdDev - minStdDev)) * 100);
    return {
      ...t,
      normalization: {
        ...t.normalization,
        consistencyScore,
      },
    };
  });

  const avgPlaces = enriched.map((t) => t.analytics.avgPlace ?? 0);
  const minAvgPlace = Math.min(...avgPlaces);
  const maxAvgPlace = Math.max(...avgPlaces);
  enriched = enriched.map((t) => {
    const avgPlace = t.analytics.avgPlace ?? 0;
    const placeScore = maxAvgPlace === minAvgPlace
      ? 100
      : round2(((maxAvgPlace - avgPlace) / (maxAvgPlace - minAvgPlace)) * 100);
    return {
      ...t,
      normalization: {
        ...t.normalization,
        placeScore,
      },
    };
  });

  enriched = enriched.map((t) => {
    const n = t.normalization;
    const POWER = Math.min(100, round2((n.N_PPM * 0.40) + (n.N_KPM * 0.35) + (n.N_killPct * 0.25)));
    const PLACEMENT = Math.min(100, round2((n.placeScore * 0.45) + (n.N_top5Rate * 0.30) + (n.N_placementEfficiency * 0.25)));
    const CONVERSION = Math.min(100, round2((n.N_winRate * 0.40) + (n.N_conversionRate * 0.40) + (n.N_conversionRateTop3 * 0.20)));
    const FORM = Math.min(100, round2((n.N_forwardMI * 0.55) + (n.consistencyScore * 0.45)));
    const TEAM_RATING = Math.min(100, round2((POWER * 0.35) + (PLACEMENT * 0.30) + (CONVERSION * 0.25) + (FORM * 0.10)));
    const FINAL_RATING = Math.min(1000, round2(TEAM_RATING * 10));

    return {
      ...t,
      scores: {
        POWER,
        PLACEMENT,
        CONVERSION,
        FORM,
        TEAM_RATING,
        FINAL_RATING,
        rankLabel: teamRatingRankLabel(FINAL_RATING),
      },
      labels: {
        playstyle: playstyleLabel(POWER, PLACEMENT, CONVERSION),
        powerLabel: powerLabel(POWER),
        placementLabel: placementLabel(PLACEMENT),
        conversionLabel: conversionLabel(CONVERSION),
        formLabel: formLabel(t.analytics.forwardMI, n.consistencyScore),
      },
    };
  });

  const avgTeamRating = enriched.reduce((sum, t) => sum + t.scores.TEAM_RATING, 0) / enriched.length;
  enriched = enriched.map((t) => {
    const { POWER, PLACEMENT, CONVERSION, FORM, TEAM_RATING } = t.scores;
    let identity = 'Balanced';
    if (POWER >= 60 && PLACEMENT >= 60 && CONVERSION >= 60 && FORM >= 60) {
      identity = 'Complete Team';
    } else if (TEAM_RATING < avgTeamRating && FORM >= 75) {
      identity = 'Dark Horse';
    } else if (FORM >= 80) {
      identity = 'Momentum Team';
    } else if (CONVERSION >= 80 && CONVERSION > POWER && CONVERSION > PLACEMENT) {
      identity = 'Closer';
    } else if (PLACEMENT >= 75 && PLACEMENT > POWER) {
      identity = 'Survivalist';
    } else if (POWER >= 75 && POWER > PLACEMENT) {
      identity = 'Slayer';
    }

    return {
      ...t,
      identity,
    };
  });

  return enriched
    .sort((a, b) => {
      if (b.totalPts !== a.totalPts) return b.totalPts - a.totalPts;
      if (b.placementPts !== a.placementPts) return b.placementPts - a.placementPts;
      if (b.kills !== a.kills) return b.kills - a.kills;
      return b.wins - a.wins;
    })
    .map((t, i) => ({ ...t, analyticsRank: i + 1 }));
}
