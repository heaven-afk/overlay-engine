import { db } from './firebase';
import {
  collection,
  getDocs,
  getDoc,
  doc,
  query,
  where,
} from 'firebase/firestore';
import { getProfile, getTopStandings } from './statsApi';

export interface DayBreakdownRow {
  day: string;
  dayNum: number;
  kills: number;
  matches: number;
  kpm: string | number;
  damage: number;
  avgDamage: number;
}

export interface TournamentHistoryRow {
  tournament: string;
  tournamentId: string;
  kills: number;
  matches: number;
  damage: number;
  kpm: number;
  rating: number;
}

export interface UnifiedPlayerProfileResult {
  player: Record<string, any>;
  profile: Record<string, any>;
  careerStats?: Record<string, any>;
  scope: {
    type: 'tournament' | 'career';
    tournamentId?: string;
    tournamentName?: string;
  };
}

/**
 * Load unified player profile data supporting both Career and Tournament levels.
 */
export async function loadPlayerProfileData({
  playerId,
  tournamentId,
}: {
  playerId: string;
  tournamentId?: string;
}): Promise<UnifiedPlayerProfileResult> {
  if (!playerId) {
    throw new Error('playerId is required to load player profile');
  }

  // Always fetch the baseline player profile from stats API / Firestore
  const { profile = {}, careerStats = {} } = await getProfile('player', playerId).catch(() => ({
    profile: {},
    careerStats: {},
  }));

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. TOURNAMENT SCOPE
  // ─────────────────────────────────────────────────────────────────────────────
  if (tournamentId) {
    // 1a. Fetch tournament name if possible
    let tournamentName = 'Tournament';
    try {
      const tSnap = await getDoc(doc(db, 'tournaments', tournamentId));
      if (tSnap.exists()) {
        tournamentName = tSnap.data().name || tournamentName;
      }
    } catch {
      // ignore
    }

    // 1b. Fetch tournament standings for players
    const standingsRes = await getTopStandings(tournamentId, 100, 'player').catch(() => ({ results: [] }));
    const tournamentPlayers: any[] = standingsRes.results || [];

    const norm = (s: any) => String(s || '').trim().toLowerCase();
    const pIdNorm = norm(playerId);
    const pIgnNorm = norm(profile.ign || profile.currentIGN);

    const tourneyPlayer = tournamentPlayers.find((p: any) => {
      if (p.playerId && norm(p.playerId) === pIdNorm) return true;
      if (p.id && norm(p.id) === pIdNorm) return true;
      if (pIgnNorm && norm(p.ign) === pIgnNorm) return true;
      if (pIgnNorm && norm(p.playerName) === pIgnNorm) return true;
      return false;
    });

    if (tourneyPlayer) {
      // Transform perDay into Day Breakdown rows
      const dayHistory: DayBreakdownRow[] = Object.entries(tourneyPlayer.perDay || {})
        .map(([dayKey, d]: [string, any]) => {
          const dayNum = parseInt(dayKey, 10) || 1;
          const kills = Number(d.kills ?? 0);
          const matches = Number(d.matches ?? 0);
          const damage = Number(d.damage ?? 0);
          return {
            day: `Day ${dayNum}`,
            dayNum,
            kills,
            matches,
            kpm: matches > 0 ? (kills / matches).toFixed(2) : '0.00',
            damage,
            avgDamage: matches > 0 ? Math.round(damage / matches) : 0,
          };
        })
        .sort((a, b) => a.dayNum - b.dayNum);

      const mergedPlayer = {
        ...profile,
        ...tourneyPlayer,
        scope: 'tournament',
        tournamentId,
        tournamentName,
        ign: tourneyPlayer.ign || profile.currentIGN || profile.ign || 'PLAYER IGN',
        professionalName: profile.professionalName || tourneyPlayer.playerName || profile.ign || 'PRO PLAYER',
        teamName: tourneyPlayer.teamName || careerStats.teamName || profile.teamName || 'NO TEAM',
        classBadge: tourneyPlayer.class || profile.category || careerStats.lastClass || 'SLAYER',
        device: tourneyPlayer.deviceModel || profile.currentDeviceModel || profile.deviceModel || profile.device || 'N/A',
        region: tourneyPlayer.region || profile.region || 'Africa',
        country: tourneyPlayer.country || profile.country || 'N/A',
        totalKills: Number(tourneyPlayer.totalKills ?? 0),
        totalMatches: Number(tourneyPlayer.totalMatches ?? 0),
        kpm: Number(tourneyPlayer.analytics?.KPM ?? tourneyPlayer.killsPerMatch ?? 0),
        dpm: Number(tourneyPlayer.analytics?.DPM ?? tourneyPlayer.avgDamage ?? 0),
        winRate: Number(tourneyPlayer.analytics?.winRate ?? 0),
        top5Rate: Number(tourneyPlayer.analytics?.top5Rate ?? 0),
        avgPlacement: Number(tourneyPlayer.analytics?.avgPlacement ?? 0),
        scores: {
          POWER: Number(tourneyPlayer.scores?.POWER ?? 0),
          PLACEMENT: Number(tourneyPlayer.scores?.PLACEMENT ?? 0),
          CONVERSION: Number(tourneyPlayer.scores?.CONVERSION ?? 0),
          FORM: Number(tourneyPlayer.scores?.FORM ?? 0),
          FINAL_RATING: Number(tourneyPlayer.scores?.FINAL_RATING ?? 0),
        },
        labels: tourneyPlayer.labels || {},
        identity: tourneyPlayer.identity || 'Balanced',
        dayHistory,
        careerStats: {
          ...careerStats,
          tournaments: dayHistory.map((d) => ({
            tournament: d.day,
            kills: d.kills,
            matches: d.matches,
            kpm: d.kpm,
            rating: d.avgDamage,
          })),
        },
      };

      return {
        player: mergedPlayer,
        profile: mergedPlayer,
        careerStats,
        scope: { type: 'tournament', tournamentId, tournamentName },
      };
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. CAREER SCOPE (or fallback if tournament participant not matched)
  // ─────────────────────────────────────────────────────────────────────────────
  // Collate tournament history across active tournaments
  let careerHistory: TournamentHistoryRow[] = [];
  try {
    const tSnaps = await getDocs(collection(db, 'tournaments'));
    const allTournaments = tSnaps.docs.map((d) => ({ id: d.id, name: d.data().name || d.id }));

    // Prioritize tournaments listed in profile.tournamentIds if available, else check all
    const knownTids = new Set<string>((profile.tournamentIds || careerStats.tournamentIds || []).filter(Boolean));
    const targetTourneys = knownTids.size > 0
      ? allTournaments.filter((t) => knownTids.has(t.id))
      : allTournaments;

    const rows = await Promise.all(
      targetTourneys.map(async (t) => {
        try {
          const pmrSnap = await getDocs(
            query(
              collection(db, 'tournaments', t.id, 'playerMatchResults'),
              where('playerId', '==', playerId)
            )
          );
          if (pmrSnap.empty) return null;

          let totalK = 0;
          let totalD = 0;
          const matches = pmrSnap.size;
          pmrSnap.forEach((docSnap) => {
            const d = docSnap.data();
            totalK += Number(d.kills || 0);
            totalD += Number(d.damage || 0);
          });
          const kpm = matches > 0 ? Number((totalK / matches).toFixed(2)) : 0;
          const rating = Math.round(kpm * 25 + (matches >= 10 ? 100 : 50));
          return {
            tournament: t.name,
            tournamentId: t.id,
            kills: totalK,
            matches,
            damage: totalD,
            kpm,
            rating,
          };
        } catch {
          return null;
        }
      })
    );

    careerHistory = rows.filter(Boolean) as TournamentHistoryRow[];
  } catch (err) {
    console.warn('Error loading player tournament history:', err);
  }

  // Compute composite scores for Career view
  const careerKills = Number(careerStats.careerKills ?? profile.careerKills ?? 0);
  const careerMatches = Number(careerStats.careerMatches ?? profile.careerMatches ?? 0);
  const kpm = Number(careerStats.avgKillsPerMatch ?? (careerMatches > 0 ? careerKills / careerMatches : 0));
  const dpm = Number(careerStats.avgDamagePerMatch ?? 0);
  const winRate = Number(careerStats.winRate ?? 0);
  const top5Rate = Number(careerStats.top5Rate ?? 0);
  const avgPlacement = Number(careerStats.avgPlacement ?? careerStats.avgRankedPosition ?? 0);

  const powerScore = Math.min(100, Math.max(10, Math.round((kpm / 10) * 100)));
  const formScore = Math.min(100, Math.max(10, Math.round(Number(careerStats.decayedForm ?? 6) * 12)));
  const placementScore = Math.min(100, Math.max(10, Math.round(Number(careerStats.avgAccuracy ?? 30) * 2.5)));
  const conversionScore = Math.min(100, Math.max(10, Math.round((careerHistory.length > 1 ? 75 : 45))));
  const finalRating = Math.round((powerScore * 0.35 + formScore * 0.35 + placementScore * 0.2 + conversionScore * 0.1) * 10);

  const mergedCareerPlayer = {
    ...profile,
    ...careerStats,
    scope: 'career',
    ign: profile.currentIGN || profile.ign || 'PLAYER IGN',
    professionalName: profile.professionalName || profile.ign || 'PRO PLAYER',
    teamName: careerStats.teamName || profile.teamName || 'NO TEAM',
    classBadge: careerStats.lastClass || profile.category || profile.class || 'SLAYER',
    device: profile.currentDeviceModel || profile.deviceModel || profile.device || 'N/A',
    region: profile.region || 'Africa',
    country: profile.country || 'N/A',
    totalKills: careerKills,
    totalMatches: careerMatches,
    kpm,
    dpm,
    winRate,
    top5Rate,
    avgPlacement,
    scores: {
      POWER: powerScore,
      PLACEMENT: placementScore,
      CONVERSION: conversionScore,
      FORM: formScore,
      FINAL_RATING: finalRating,
    },
    labels: {
      powerLabel: kpm >= 7 ? 'OUTSTANDING POWER' : kpm >= 5 ? 'STRONG POWER' : 'PASSIVE',
      formLabel: careerStats.formLabel || (formScore >= 70 ? 'RED HOT' : 'STEADY'),
      playstyle: kpm >= 6 ? 'Aggressive' : 'Calculated',
    },
    identity: careerStats.trend === 'up' ? 'RISING' : 'STEADY',
    careerHistory: careerHistory.map((r) => ({
      tournament: r.tournament,
      kills: r.kills,
      matches: r.matches,
      kpm: r.kpm,
      rating: r.rating,
    })),
    careerStats: {
      ...careerStats,
      careerKills,
      avgKills: kpm,
      avgDamage: dpm,
      winRate,
      top5Rate,
      avgPlacement,
      tournaments: careerHistory.map((r) => ({
        tournament: r.tournament,
        kills: r.kills,
        matches: r.matches,
        kpm: r.kpm,
        rating: r.rating,
      })),
    },
  };

  return {
    player: mergedCareerPlayer,
    profile: mergedCareerPlayer,
    careerStats,
    scope: { type: 'career' },
  };
}
