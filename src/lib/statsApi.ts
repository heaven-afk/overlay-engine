// Stats API client for Heaven Stat Engine
// NOTE: These env vars use NEXT_PUBLIC_ because calls originate from the dashboard (client-side).
// This dashboard is a private, password-protected tool — the key is never exposed on the
// public render/[publicRenderToken] page, which only reads already-pushed Firestore data.

const API_BASE = process.env.NEXT_PUBLIC_STATS_API_BASE ?? '';
const API_KEY = process.env.NEXT_PUBLIC_STATS_API_KEY ?? '';

async function callStatsApi(path: string, params: Record<string, string>) {
  if (!API_BASE) {
    throw new Error(
      'NEXT_PUBLIC_STATS_API_BASE is not set. Add it to .env.local and restart the dev server.'
    );
  }

  const cleanBase = API_BASE.endsWith('/') ? API_BASE.slice(0, -1) : API_BASE;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const url = new URL(`${cleanBase}${cleanPath}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const res = await fetch(url.toString(), {
    headers: { 'x-overlay-api-key': API_KEY },
  });

  if (!res.ok) {
    throw new Error(`Stats API error (${res.status}): ${await res.text()}`);
  }

  return res.json();
}

/**
 * Get the top N teams or players in a specific tournament, ranked by the analytics engine.
 */
export async function getTopStandings(
  tournamentId: string,
  n: number,
  type: 'team' | 'player' = 'team'
): Promise<{ results: any[] }> {
  return callStatsApi('/api/overlay/standings/top', {
    tournamentId,
    n: String(n),
    type,
  });
}

/**
 * Get global career rankings across all tournaments.
 * Used to populate team/player pickers in the dashboard UI.
 */
export async function getGlobalRankings(
  type: 'team' | 'player' = 'team',
  limit = 20
): Promise<{ results: any[] }> {
  return callStatsApi('/api/overlay/rankings', {
    type,
    limit: String(limit),
  });
}

/**
 * Get the full profile and career stats for a single team or player.
 */
export async function getProfile(
  type: 'team' | 'player',
  id: string
): Promise<{ profile: any; careerStats: any }> {
  return callStatsApi('/api/overlay/profile', { type, id });
}

/**
 * Compare two teams or players head-to-head.
 * Optionally scoped to a single tournament; omit tournamentId for a career-wide comparison.
 */
export async function compareEntities(
  type: 'team' | 'player',
  idA: string,
  idB: string,
  tournamentId?: string
): Promise<{ teamA?: any; teamB?: any; playerA?: any; playerB?: any; scope: any }> {
  const params: Record<string, string> = { type, a: idA, b: idB };
  if (tournamentId) params.tournamentId = tournamentId;
  return callStatsApi('/api/overlay/compare', params);
}
