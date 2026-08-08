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
  type: 'team' | 'player' = 'team',
  groupId?: string
): Promise<{ results: any[] }> {
  const params: Record<string, string> = {
    tournamentId,
    n: String(n),
    type,
  };
  if (groupId && groupId !== 'all') params.groupId = groupId;
  return callStatsApi('/api/overlay/standings/top', params);
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

export async function getDailyStandings(
  tournamentId: string,
  day: number,
  options: { lobby?: number; n?: number; groupId?: string } = {}
) {
  const params: Record<string, string> = {
    tournamentId,
    day: String(day),
    n: String(options.n ?? 5),
  };
  if (options.lobby !== undefined) params.lobby = String(options.lobby);
  if (options.groupId && options.groupId !== 'all') params.groupId = options.groupId;
  return callStatsApi('/api/overlay/standings/daily', params);
}

/**
 * Get top 4 player kills for a team in a specific tournament lobby.
 */
export async function getLobbyKills(
  tournamentId: string,
  day: number,
  lobby: number,
  teamId: string
) {
  return callStatsApi('/api/overlay/lobby-kills', {
    tournamentId,
    day: String(day),
    lobby: String(lobby),
    teamId,
  });
}

/**
 * Get top 4 player kills for a team scoped to either full tournament collation or a single day.
 */
export async function getTeamKills(
  tournamentId: string,
  teamId: string,
  scope: 'collation' | 'daily' = 'collation',
  day?: number
) {
  const params: Record<string, string> = {
    tournamentId,
    teamId,
    scope,
  };
  if (scope === 'daily' && day !== undefined) {
    params.day = String(day);
  }
  return callStatsApi('/api/overlay/team-kills', params);
}

/**
 * Get match summary including winner cards, top 3, and callouts with logos.
 */
export async function getMatchSummary(
  tournamentId: string,
  scope: 'lobby' | 'match' = 'match',
  day?: number,
  lobby?: number,
  groupId?: string
) {
  const params: Record<string, string> = {
    tournamentId,
    scope,
  };
  if (day !== undefined) params.day = String(day);
  if (lobby !== undefined) params.lobby = String(lobby);
  if (groupId && groupId !== 'all') params.groupId = groupId;
  return callStatsApi('/api/overlay/match-summary', params);
}

