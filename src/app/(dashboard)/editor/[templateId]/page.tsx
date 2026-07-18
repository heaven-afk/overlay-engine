'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  getTemplate, saveTemplate, getTournaments,
  OverlayTemplate, TemplateStyleConfig, ColorTheme, TemplateType
} from '@/lib/db';
import { getTopStandings, getGlobalRankings, getProfile, compareEntities, getDailyStandings } from '@/lib/statsApi';
import { db, storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, doc } from 'firebase/firestore';
import { ArrowLeft, Save, Upload, Loader2, Download, ChevronUp, ChevronDown, Check, Video } from 'lucide-react';
import html2canvas from 'html2canvas';
import { googleFontsLink, cssVarsForTheme } from '@/lib/fonts';

// Import templates
import { TopStandings } from '@/components/templates/TopStandings';
import { DailyStandings } from '@/components/templates/DailyStandings';
import { HeadToHead } from '@/components/templates/HeadToHead';
import { TeamProfile } from '@/components/templates/TeamProfile';
import { PlayerProfile } from '@/components/templates/PlayerProfile';
import { CustomMedia } from '@/components/templates/CustomMedia';
import { OverallRankingsDualColumn } from '@/components/templates/OverallRankingsDualColumn';
import { Top5Overall } from '@/components/templates/Top5Overall';

// Columns definitions
const ALL_COLUMNS = [
  { key: 'wins', label: 'WINS' },
  { key: 'matches', label: 'MATCH' },
  { key: 'events', label: 'EVENTS' },
  { key: 'placePts', label: 'PLACE' },
  { key: 'kills', label: 'KILLS' },
  { key: 'totalPts', label: 'TOTAL PTS' },
  { key: 'rating', label: 'RATING' },
  { key: 'ppm', label: 'PPM' },
  { key: 'kpm', label: 'KPM' },
  { key: 'killPct', label: 'KILL%' },
  { key: 'avgPlace', label: 'AVG PL.' },
  { key: 'top3Rate', label: 'TOP3%' },
  { key: 'top5Rate', label: 'TOP5%' },
  { key: 'rankLabel', label: 'RANK' },
  { key: 'identity', label: 'IDENTITY' },
];

const DEFAULT_COLUMNS = ['wins', 'matches', 'events', 'placePts', 'kills', 'totalPts', 'rating', 'ppm', 'kpm', 'killPct', 'avgPlace', 'top3Rate'];

// ─── MOCK PREVIEW DATASETS ──────────────────────────────────────────────────
const MOCK_OVERALL_RANKINGS = {
  rows: Array.from({ length: 20 }, (_, i) => ({
    rank: i + 1,
    teamId: `team-${i}`,
    teamName: i === 0 ? 'REMEDIUM INVICTUS' : i === 1 ? 'KYZON ESPORTS' : i === 2 ? 'HYPERION SQUAD' : `TEAM UNICORN ${i + 1}`,
    logoUrl: '',
    placementPoints: 120 - i * 5,
    kills: 80 - i * 3,
    totalPoints: 200 - i * 8,
  }))
};

const MOCK_DAILY_STANDINGS = {
  results: Array.from({ length: 8 }, (_, i) => ({
    rank: i + 1,
    teamId: `team-${i}`,
    teamName: i === 0 ? 'REMEDIUM INVICTUS' : i === 1 ? 'KYZON ESPORTS' : i === 2 ? 'HYPERION SQUAD' : `DAILY TEAM ${i + 1}`,
    clanName: `CLAN ${i + 1}`,
    logoUrl: '',
    wins: i === 0 ? 2 : i === 1 ? 1 : 0,
    matches: 4,
    kills: 28 - i * 3,
    placementPts: 120 - i * 12,
    totalPts: 270 - i * 28,
    lobbiesPlayed: [],
  }))
};

const MOCK_STANDINGS = {
  teams: Array.from({ length: 12 }, (_, i) => ({
    teamName: `TEAM UNICORN ${i + 1}`,
    logoUrl: '',
    wins: Math.max(0, 10 - i),
    matches: 12,
    events: 2,
    placementPts: Math.max(0, 240 - i * 15),
    kills: Math.max(0, 150 - i * 10),
    totalPts: Math.max(0, 390 - i * 25),
    scores: {
      FINAL_RATING: 600 - i * 35,
      rankLabel: i === 0 ? 'ELITE RANK' : i < 3 ? 'MASTER' : 'CHALLENGER'
    },
    analytics: {
      PPM: 30 - i * 1.5,
      KPM: 12 - i * 0.8,
      killPct: 80 - i * 2,
      avgPlace: 3 + i * 0.8,
      top3Rate: 60 - i * 4,
      top5Rate: 80 - i * 4,
    },
    identity: i % 2 === 0 ? 'Slayer' : 'Survivalist'
  }))
};

const MOCK_H2H = {
  teamA: {
    teamName: 'APEX HUNTERS',
    logoUrl: '',
    scores: { FINAL_RATING: 720, rankLabel: 'ELITE RANK' },
    identity: 'Slayer',
    wins: 4, matches: 12, placementPts: 180, kills: 120, totalPts: 300,
    analytics: { PPM: 25.0, KPM: 10.0, killPct: 76.5, winRate: 33.3, top5Rate: 66.7, avgPlace: 4.5 }
  },
  teamB: {
    teamName: 'VORTEX ESPORTS',
    logoUrl: '',
    scores: { FINAL_RATING: 580, rankLabel: 'MASTER' },
    identity: 'Survivalist',
    wins: 2, matches: 12, placementPts: 210, kills: 80, totalPts: 290,
    analytics: { PPM: 24.2, KPM: 6.6, killPct: 68.0, winRate: 16.7, top5Rate: 83.3, avgPlace: 3.8 }
  },
  scope: { type: 'career' }
};

const MOCK_TEAM_PROFILE = {
  team: {
    teamName: 'APEX HUNTERS',
    logoUrl: '',
    clanName: 'APEX CLAN',
    tier: 'TIER 1',
    identity: 'Slayer',
    analyticsRank: 1,
    scores: {
      FINAL_RATING: 720,
      rankLabel: 'ELITE RANK',
      POWER: 85.0,
      PLACEMENT: 78.0,
      CONVERSION: 90.0,
      FORM: 88.0,
      totalPtsRank: 1,
      killsRank: 2,
    },
    analytics: {
      PPM: 25.0,
      KPM: 10.0,
      killPct: 76.5,
      winRate: 33.3,
      top5Rate: 66.7,
      avgPlace: 4.5,
    },
    analyticsRanks: {
      PPM: 1, KPM: 2, winRate: 1, killPct: 2, top5Rate: 3, avgPlace: 1,
    },
    // careerStats mirrors the exact shape from aggregateGlobalTeams()
    careerStats: {
      careerTotalPts: 300,
      careerKills: 120,
      careerWins: 4,
      careerMatches: 12,
      tournamentPPM: 25.0,
      tournamentKPM: 10.0,
      tournamentTop5Rate: 66.7,
      winRate: 33.3,
      avgRankedPosition: 4.5,
      careerAvgTeamRating: 720,
      tournamentsCount: 2,
    },
  },
};

const MOCK_PLAYER_PROFILE = {
  player: {
    ign: 'FABRIZIO',
    professionalName: 'Fabrizio Mayowa',
    teamName: 'APEX HUNTERS',
    logoUrl: '',
    classBadge: 'SLAYER',
    device: 'iPad Pro M4',
    region: 'North America',
    country: 'Nigeria',
    careerKills: 850,
    avgKills: 8.5,
    avgDamage: 1240,
    winRate: 28.5,
    top5Rate: 68.0,
    avgPlace: 4.8,
    scores: {
      FINAL_RATING: 745.0,
      POWER: 88,
      CONVERSION: 82,
      FORM: 78
    },
    labels: {
      powerLabel: 'OUTSTANDING POWER',
      formLabel: 'RED HOT'
    },
    careerStats: {
      careerKills: 850,
      avgKills: 8.5,
      avgDamage: 1240,
      winRate: 28.5,
      top5Rate: 68.0,
      avgPlacement: 4.8,
      tournaments: [
        { tournament: 'African BR Championship', kills: 48, matches: 6, kpm: 8.0, rating: 720 },
        { tournament: 'Heaven Invitational S1', kills: 35, matches: 5, kpm: 7.0, rating: 690 },
        { tournament: 'CODM Mobile Masters', kills: 52, matches: 6, kpm: 8.6, rating: 780 }
      ]
    }
  }
};

interface PageProps {
  params: Promise<{ templateId: string }>;
}

export default function TemplateBuilderPage({ params }: PageProps) {
  const router = useRouter();
  const { templateId: rawTemplateId } = use(params);
  const isNew = rawTemplateId === 'new';

  // Loading states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadingBg, setUploadingBg] = useState(false);
  const [uploadBgProgress, setUploadBgProgress] = useState<number>(0);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [uploadMediaProgress, setUploadMediaProgress] = useState<number>(0);

  // Template base configurations
  const [templateId, setTemplateId] = useState<string>('');
  const [name, setName] = useState('Untitled Template');
  const [templateType, setTemplateType] = useState<TemplateType>('top_standings');
  
  const [styleConfig, setStyleConfig] = useState<TemplateStyleConfig>({
    colorTheme: 'dark',
    accentColor: '#C9A84C',
    customBackgroundUrl: '',
    headingFont: 'Inter',
    bodyFont: 'Inter',
    brandingLogoUrl: '',
    brandingName: 'HEAVEN STAT ENGINE\nAfrican CODM BR Coverage',
    showStatsStamp: true,
    tournamentLogoCount: 1,
    tournamentLogos: [
      { logoUrl: '', tournamentName: '' },
      { logoUrl: '', tournamentName: '' },
      { logoUrl: '', tournamentName: '' },
    ],
    topN: 10,
    showColumns: DEFAULT_COLUMNS,
    graphicTitle: 'OGR T1 COLLATION',
    graphicSubtitle: 'Full standings — Top 10 · 2 Events Played',
  });

  // Preview Data Source Selectors
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [selectedTournamentId, setSelectedTournamentId] = useState<string>('');
  const [teamsList, setTeamsList] = useState<any[]>([]);
  const [playersList, setPlayersList] = useState<any[]>([]);
  const [filteredTeams, setFilteredTeams] = useState<any[]>([]);
  const [filteredPlayers, setFilteredPlayers] = useState<any[]>([]);

  // Selection states for previewing
  const [previewTeamAId, setPreviewTeamAId] = useState<string>('');
  const [previewTeamBId, setPreviewTeamBId] = useState<string>('');
  const [previewTeamId, setPreviewTeamId] = useState<string>('');
  const [previewPlayerId, setPreviewPlayerId] = useState<string>('');

  // Resolved dynamic preview data
  const [previewData, setPreviewData] = useState<any>(MOCK_STANDINGS);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Initialize page
  useEffect(() => {
    async function loadInitialData() {
      try {
        setLoading(true);
        // Load tournaments and rankings lists for selectors
        const [tourneys, teamsRes, playersRes] = await Promise.all([
          getTournaments(),
          getGlobalRankings('team', 50).catch(() => ({ results: [] })),
          getGlobalRankings('player', 100).catch(() => ({ results: [] })),
        ]);

        setTournaments(tourneys);
        setTeamsList(teamsRes.results || []);
        setPlayersList(playersRes.results || []);
        setFilteredTeams(teamsRes.results || []);
        setFilteredPlayers(playersRes.results || []);

        if (tourneys.length > 0) {
          setSelectedTournamentId(tourneys[0].id);
        }
        if (teamsRes.results?.length > 0) {
          setPreviewTeamAId(teamsRes.results[0].teamId || teamsRes.results[0].id);
          setPreviewTeamBId(teamsRes.results[1]?.teamId || teamsRes.results[1]?.id || teamsRes.results[0].teamId);
          setPreviewTeamId(teamsRes.results[0].teamId || teamsRes.results[0].id);
        }
        if (playersRes.results?.length > 0) {
          setPreviewPlayerId(playersRes.results[0].playerId || playersRes.results[0].id);
        }

        if (!isNew) {
          setTemplateId(rawTemplateId);
          const template = await getTemplate(rawTemplateId);
          if (template) {
            setName(template.name);
            setTemplateType(template.templateType);
            // Mix in default tournament logo slots to avoid length issues
            const loadedLogos = template.styleConfig.tournamentLogos || [];
            const standardLogos = [
              loadedLogos[0] || { logoUrl: '', tournamentName: '' },
              loadedLogos[1] || { logoUrl: '', tournamentName: '' },
              loadedLogos[2] || { logoUrl: '', tournamentName: '' },
            ];
            setStyleConfig({
              ...template.styleConfig,
              customBackgroundUrl: template.styleConfig.customBackgroundUrl || '',
              tournamentLogos: standardLogos,
              showColumns: template.styleConfig.showColumns || DEFAULT_COLUMNS,
            });
          } else {
            alert('Template not found');
            router.push('/editor');
          }
        } else {
          const newId = doc(collection(db, 'overlayTemplates')).id;
          setTemplateId(newId);
        }
      } catch (err) {
        console.error('Error initializing editor:', err);
      } finally {
        setLoading(false);
      }
    }

    loadInitialData();
  }, [rawTemplateId, isNew, router]);

  // Update filtered selection lists when selectedTournamentId changes.
  // IMPORTANT: We also reset team/player selection IDs here (synchronously within the same
  // async function) so that by the time this effect finishes and the previewData effect
  // re-runs, the IDs already reflect the new tournament list — avoiding a race condition
  // where the preview would fetch with stale IDs.
  useEffect(() => {
    let active = true;
    async function updateFilters() {
      if (loading) return;

      try {
        let tList: any[] = teamsList;
        let pList: any[] = playersList;

        if (selectedTournamentId) {
          // Fetch tournament-specific standings
          const [teamsRes, playersRes] = await Promise.all([
            getTopStandings(selectedTournamentId, 100, 'team').catch(() => ({ results: [] })),
            getTopStandings(selectedTournamentId, 100, 'player').catch(() => ({ results: [] }))
          ]);
          tList = (teamsRes.results?.length > 0 ? teamsRes.results : teamsList);
          pList = (playersRes.results?.length > 0 ? playersRes.results : playersList);
        }

        if (!active) return;

        setFilteredTeams(tList);
        setFilteredPlayers(pList);

        // --- Reset selection IDs to valid entries in the new list ---
        const teamIds = tList.map((t: any) => t.teamId || t.id);
        const playerIds = pList.map((p: any) => p.playerId || p.id);

        // Team A: reset if not in new list, always pick index 0
        if (!previewTeamAId || !teamIds.includes(previewTeamAId)) {
          setPreviewTeamAId(teamIds[0] ?? '');
        }
        // Team B: reset if not in new list, pick index 1 (or 0 if only one entry)
        if (!previewTeamBId || !teamIds.includes(previewTeamBId)) {
          setPreviewTeamBId(teamIds[1] ?? teamIds[0] ?? '');
        }
        // Also reset single-team and player pickers
        if (!previewTeamId || !teamIds.includes(previewTeamId)) {
          setPreviewTeamId(teamIds[0] ?? '');
        }
        if (!previewPlayerId || !playerIds.includes(previewPlayerId)) {
          setPreviewPlayerId(playerIds[0] ?? '');
        }
      } catch (err) {
        console.warn('Failed to fetch tournament-specific teams/players, using global list:', err);
        if (!active) return;
        setFilteredTeams(teamsList);
        setFilteredPlayers(playersList);
      }
    }

    updateFilters();
    return () => { active = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTournamentId, teamsList, playersList, loading]);

  // Load preview data when data source inputs change
  useEffect(() => {
    let active = true;
    async function loadLivePreview() {
      if (loading) return;

      try {
        setPreviewLoading(true);

        if (templateType === 'top_standings') {
          if (!selectedTournamentId) {
            setPreviewData(MOCK_STANDINGS);
            return;
          }
          const { results } = await getTopStandings(selectedTournamentId, styleConfig.topN || 10, 'team');
          if (active) {
            if (results && results.length > 0) {
              setPreviewData({ teams: results });
            } else {
              setPreviewData(MOCK_STANDINGS);
            }
          }
        }

        else if (templateType === 'overall_rankings_dual_column') {
          if (!selectedTournamentId) {
            setPreviewData(MOCK_OVERALL_RANKINGS);
            return;
          }
          const { results } = await getTopStandings(selectedTournamentId, styleConfig.topN || 20, 'team');
          if (active) {
            if (results && results.length > 0) {
              setPreviewData({ rows: results });
            } else {
              setPreviewData(MOCK_OVERALL_RANKINGS);
            }
          }
        }

        else if (templateType === 'top_5_overall') {
          if (!selectedTournamentId) {
            setPreviewData(MOCK_OVERALL_RANKINGS);
            return;
          }
          const { results } = await getTopStandings(selectedTournamentId, styleConfig.topN || 5, 'team');
          if (active) {
            if (results && results.length > 0) {
              setPreviewData({ rows: results });
            } else {
              setPreviewData(MOCK_OVERALL_RANKINGS);
            }
          }
        }

        else if (templateType === 'daily_standings') {
          if (!selectedTournamentId) {
            setPreviewData(MOCK_DAILY_STANDINGS);
            return;
          }
          const day = styleConfig.dailyStandingsDay || 1;
          const lobby = (styleConfig.dailyStandingsMode === 'single_lobby' && styleConfig.dailyStandingsLobby !== undefined && styleConfig.dailyStandingsLobby !== null)
            ? styleConfig.dailyStandingsLobby
            : undefined;
          const n = styleConfig.topN || 5;
          const data = await getDailyStandings(selectedTournamentId, day, { lobby, n });
          if (active) {
            if (data.results && data.results.length > 0) {
              setPreviewData(data);
            } else {
              setPreviewData(MOCK_DAILY_STANDINGS);
            }
          }
        }

        else if (templateType === 'head_to_head') {
          if (!previewTeamAId || !previewTeamBId) {
            setPreviewData(MOCK_H2H);
            return;
          }
          const data = await compareEntities('team', previewTeamAId, previewTeamBId, selectedTournamentId || undefined);
          if (active) {
            setPreviewData({
              teamA: data.teamA ?? data.playerA ?? {},
              teamB: data.teamB ?? data.playerB ?? {},
              scope: data.scope ?? { type: selectedTournamentId ? 'tournament' : 'career' }
            });
          }
        }

        else if (templateType === 'team_profile') {
          if (!previewTeamId) {
            setPreviewData(MOCK_TEAM_PROFILE);
            return;
          }
          const { profile, careerStats } = await getProfile('team', previewTeamId);
          if (active) {
            setPreviewData({ team: { ...profile, careerStats } });
          }
        }

        else if (templateType === 'player_profile') {
          if (!previewPlayerId) {
            setPreviewData(MOCK_PLAYER_PROFILE);
            return;
          }
          const { profile, careerStats } = await getProfile('player', previewPlayerId);
          if (active) {
            setPreviewData({ player: { ...profile, careerStats } });
          }
        }
      } catch (err) {
        console.warn('Live preview API call failed, falling back to mockups:', err);
        if (active) {
          // fallback to mock
          if (templateType === 'top_standings') setPreviewData(MOCK_STANDINGS);
          else if (templateType === 'overall_rankings_dual_column') setPreviewData(MOCK_OVERALL_RANKINGS);
          else if (templateType === 'top_5_overall') setPreviewData(MOCK_OVERALL_RANKINGS);
          else if (templateType === 'daily_standings') setPreviewData(MOCK_DAILY_STANDINGS);
          else if (templateType === 'head_to_head') setPreviewData(MOCK_H2H);
          else if (templateType === 'team_profile') setPreviewData(MOCK_TEAM_PROFILE);
          else if (templateType === 'player_profile') setPreviewData(MOCK_PLAYER_PROFILE);
        }
      } finally {
        if (active) setPreviewLoading(false);
      }
    }

    loadLivePreview();
    return () => { active = false; };
  }, [templateType, selectedTournamentId, previewTeamAId, previewTeamBId, previewTeamId, previewPlayerId, styleConfig.topN, styleConfig.dailyStandingsDay, styleConfig.dailyStandingsLobby, styleConfig.dailyStandingsMode, loading]);

  // Update specific style configuration field
  const updateStyleConfig = (patch: Partial<TemplateStyleConfig>) => {
    setStyleConfig(prev => ({ ...prev, ...patch }));
  };

  const [resolvingUrls, setResolvingUrls] = useState<Record<string, boolean>>({});

  const resolveShortCanvaUrl = async (fieldKey: string, url: string, updateFn: (resolvedUrl: string) => void) => {
    if (!url) return;
    const isShortCanva = url.includes('canva.link') || url.includes('canva.me') || url.includes('canv.a');
    if (isShortCanva) {
      setResolvingUrls(prev => ({ ...prev, [fieldKey]: true }));
      try {
        const res = await fetch(`/api/resolve-link?url=${encodeURIComponent(url)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.resolvedUrl) {
            updateFn(data.resolvedUrl);
          }
        }
      } catch (err) {
        console.error('Failed to resolve short Canva URL:', err);
      } finally {
        setResolvingUrls(prev => ({ ...prev, [fieldKey]: false }));
      }
    } else {
      updateFn(url);
    }
  };

  // Helper to downscale and compress images to optimized Base64 in the browser,
  // preventing Firebase Firestore 1MB document size limit issues.
  const compressAndGetBase64 = (
    file: File,
    maxW: number,
    maxH: number,
    quality = 0.8
  ): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;

            if (width > maxW) {
              height = Math.round((height * maxW) / width);
              width = maxW;
            }
            if (height > maxH) {
              width = Math.round((width * maxH) / height);
              height = maxH;
            }

            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
              resolve(e.target?.result as string);
              return;
            }

            ctx.drawImage(img, 0, 0, width, height);

            const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
            const dataUrl = canvas.toDataURL(mimeType, quality);
            resolve(dataUrl);
          } catch (err) {
            resolve(e.target?.result as string); // fallback to original base64
          }
        };
        img.onerror = () => resolve(e.target?.result as string);
        img.src = e.target?.result as string;
      };
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    });
  };

  // Shared helper: read a File with FileReader (fires real progress 0–60%),
  // then upload the ArrayBuffer via uploadBytes, and resolve with the download URL.
  // Falls back to direct Base64 Firestore storage if Firebase Storage is not configured.
  const uploadFileWithProgress = (
    file: File,
    storagePath: string,
    onProgress: (pct: number) => void,
    onDone: (url: string) => void,
    onError: (err: any) => void,
    fallbackOpts: { maxW: number; maxH: number; quality?: number }
  ) => {
    const reader = new FileReader();

    reader.onprogress = (evt) => {
      if (evt.lengthComputable) {
        // Reading counts as 0–60%; the final Firebase upload or Base64 conversion is 60–100%
        const readPct = Math.round((evt.loaded / evt.total) * 60);
        onProgress(readPct);
      }
    };

    reader.onload = async () => {
      try {
        onProgress(75);
        const imageRef = ref(storage, storagePath);
        const buffer = reader.result as ArrayBuffer;
        
        // Try uploading to Firebase Storage with a 2.5 second timeout
        // (to prevent Firebase SDK from retrying indefinitely when Storage is not configured/enabled)
        const uploadPromise = uploadBytes(imageRef, buffer, { contentType: file.type });
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Firebase Storage upload timed out')), 2500)
        );
        
        const snapshot = await Promise.race([uploadPromise, timeoutPromise]);
        const url = await getDownloadURL(snapshot.ref);
        onProgress(100);
        setTimeout(() => onDone(url), 400);
      } catch (err) {
        console.warn('Firebase Storage upload failed, falling back to local Firestore Base64:', err);
        onProgress(80);
        if (file.type.startsWith('video/')) {
          const r = new FileReader();
          r.onload = () => {
            onProgress(100);
            onDone(r.result as string);
          };
          r.onerror = () => onError(new Error('Failed to read video file as base64'));
          r.readAsDataURL(file);
        } else {
          // Fall back to browser-side compression & base64 encoding
          const base64Url = await compressAndGetBase64(file, fallbackOpts.maxW, fallbackOpts.maxH, fallbackOpts.quality || 0.8);
          onProgress(100);
          if (base64Url) {
            setTimeout(() => onDone(base64Url), 400);
          } else {
            onError(new Error('Failed to convert image to base64 fallback'));
          }
        }
      }
    };

    reader.onerror = () => onError(reader.error);
    reader.readAsArrayBuffer(file);
  };

  // Upload branding logo to Firebase Storage
  const handleUploadBranding = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Reset so picking the same file again still triggers onChange
    e.target.value = '';

    setUploading(true);
    setUploadProgress(0);

    uploadFileWithProgress(
      file,
      `templates/branding/${templateId || 'new'}_logo.${file.name.split('.').pop()}`,
      (pct) => setUploadProgress(pct),
      (url) => { updateStyleConfig({ brandingLogoUrl: url }); setUploading(false); setUploadProgress(0); },
      (err) => { console.error('Branding upload failed:', err); alert('Upload failed.'); setUploading(false); setUploadProgress(0); },
      { maxW: 512, maxH: 512, quality: 0.85 }
    );
  };

  // Upload custom background image to Firebase Storage
  const handleUploadCustomBackground = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    setUploadingBg(true);
    setUploadBgProgress(0);

    uploadFileWithProgress(
      file,
      `templates/backgrounds/${templateId || 'new'}_bg.${file.name.split('.').pop()}`,
      (pct) => setUploadBgProgress(pct),
      (url) => { updateStyleConfig({ customBackgroundUrl: url }); setUploadingBg(false); setUploadBgProgress(0); },
      (err) => { console.error('Background upload failed:', err); alert('Upload failed.'); setUploadingBg(false); setUploadBgProgress(0); },
      { maxW: 1920, maxH: 1080, quality: 0.75 }
    );
  };

  // Upload custom media file (image/video/gif) to Firebase Storage
  const handleUploadMedia = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    setUploadingMedia(true);
    setUploadMediaProgress(0);

    const folder = `custom_media/${templateId || 'new'}_${Date.now()}.${file.name.split('.').pop()}`;

    uploadFileWithProgress(
      file,
      folder,
      (pct) => setUploadMediaProgress(pct),
      (url) => {
        const type = file.type.startsWith('video/') ? 'video' : 'image';
        updateStyleConfig({ customMediaUrl: url, customMediaType: type });
        setUploadingMedia(false);
        setUploadMediaProgress(0);
      },
      (err) => {
        console.error('Media upload failed:', err);
        alert('Upload failed.');
        setUploadingMedia(false);
        setUploadMediaProgress(0);
      },
      { maxW: 1920, maxH: 1080, quality: 0.85 }
    );
  };

  // Tournament Logo array editor helpers
  const handleTournamentLogoChange = (index: number, field: 'logoUrl' | 'tournamentName', value: string) => {
    const list = [...(styleConfig.tournamentLogos || [])];
    while (list.length <= index) {
      list.push({ logoUrl: '', tournamentName: '' });
    }
    list[index] = { ...list[index], [field]: value };
    updateStyleConfig({ tournamentLogos: list });
  };

  // Column Selector helpers
  const handleColumnToggle = (colKey: string) => {
    const columns = [...styleConfig.showColumns];
    if (columns.includes(colKey)) {
      // Don't allow empty columns completely
      if (columns.length > 1) {
        updateStyleConfig({ showColumns: columns.filter(c => c !== colKey) });
      }
    } else {
      // Find where to insert it based on default checklist order
      const newCols = ALL_COLUMNS.filter(c => columns.includes(c.key) || c.key === colKey).map(c => c.key);
      updateStyleConfig({ showColumns: newCols });
    }
  };

  const moveColumn = (index: number, direction: 'up' | 'down') => {
    const columns = [...styleConfig.showColumns];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex >= 0 && targetIndex < columns.length) {
      const temp = columns[index];
      columns[index] = columns[targetIndex];
      columns[targetIndex] = temp;
      updateStyleConfig({ showColumns: columns });
    }
  };

  // Export 1920x1080 PNG using html2canvas
  const handleDownload = async () => {
    const canvasEl = document.getElementById('broadcast-graphic-preview');
    if (!canvasEl) return;

    try {
      // Briefly remove scaling so it renders at full size
      const originalTransform = canvasEl.style.transform;
      canvasEl.style.transform = 'scale(1)';
      
      const screenshot = await html2canvas(canvasEl, {
        backgroundColor: null, // transparent
        scale: 2,              // 2x for full 1920x1080 crisp render
        useCORS: true,
        allowTaint: false,
        width: 1920,
        height: 1080,
      });

      canvasEl.style.transform = originalTransform;

      const link = document.createElement('a');
      link.download = `${name.replace(/\s+/g, '_')}_broadcast.png`;
      link.href = screenshot.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('PNG export failed:', err);
      alert('Failed to generate PNG image. Ensure preview data is valid.');
    }
  };

  // Save Config to Firebase
  const handleSave = async () => {
    if (!name.trim()) {
      alert('Please enter a template name.');
      return;
    }

    try {
      setSaving(true);
      const payload: Omit<OverlayTemplate, 'id'> = {
        name,
        templateType,
        styleConfig,
      };

      await saveTemplate(payload, templateId);
      router.push('/editor');
    } catch (err) {
      console.error('Save failed:', err);
      alert('Failed to save template configuration.');
    } finally {
      setSaving(false);
    }
  };

  // Branding Split fields
  const brandingParts = styleConfig.brandingName
    ? (styleConfig.brandingName.includes('\n') ? styleConfig.brandingName.split('\n') : styleConfig.brandingName.split('/'))
    : ['', ''];
  const brandingOrg = brandingParts[0] || '';
  const brandingMain = brandingParts[1] || '';

  const handleBrandingNameChange = (field: 'org' | 'main', value: string) => {
    const org = field === 'org' ? value : brandingOrg;
    const main = field === 'main' ? value : brandingMain;
    updateStyleConfig({ brandingName: `${org}\n${main}` });
  };

  // Map template type to component
  const getTemplateComponent = () => {
    switch (templateType) {
      case 'top_standings': return TopStandings;
      case 'overall_rankings_dual_column': return OverallRankingsDualColumn;
      case 'top_5_overall': return Top5Overall;
      case 'daily_standings': return DailyStandings;
      case 'head_to_head': return HeadToHead;
      case 'team_profile': return TeamProfile;
      case 'player_profile': return PlayerProfile;
      case 'custom_media': return CustomMedia;
      default: return TopStandings;
    }
  };

  const TemplateComponent = getTemplateComponent();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh', gap: '0.5rem', color: 'var(--text-muted)' }}>
        <Loader2 className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
        <span>Loading Template Editor...</span>
      </div>
    );
  }

  return (
    <div style={{ height: 'calc(100vh - 74px)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      
      {/* Editor Action Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0.75rem 2rem',
        background: '#0a0a0f',
        borderBottom: '1px solid var(--border-glass)',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link href="/editor" className="btn btn-secondary btn-sm" title="Back to library">
            <ArrowLeft style={{ width: '16px', height: '16px' }} />
          </Link>
          <span style={{ fontWeight: 600, fontSize: '1.1rem' }}>
            {isNew ? 'New Broadcast Template' : 'Edit Style Configuration'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Download PNG */}
          <button onClick={handleDownload} className="btn btn-secondary btn-sm">
            <Download style={{ width: '14px', height: '14px' }} />
            Download PNG (2x)
          </button>

          {/* Save Button */}
          <button onClick={handleSave} className="btn btn-primary btn-sm" disabled={saving}>
            {saving ? (
              <Loader2 className="animate-spin" style={{ width: '14px', height: '14px' }} />
            ) : (
              <Save style={{ width: '14px', height: '14px' }} />
            )}
            Save Template
          </button>
        </div>
      </div>

      {/* Main Split Panels */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '400px 1fr',
        flexGrow: 1,
        overflow: 'hidden',
      }}>
        
        {/* Left Side: Form Configurator */}
        <div style={{
          backgroundColor: 'rgba(15, 15, 22, 0.95)',
          borderRight: '1px solid var(--border-glass)',
          padding: '1.5rem',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
          boxSizing: 'border-box',
        }}>
          
          {/* Section 1: Template & Name */}
          <div>
            <div className="sidebar-section-title">Template & Title</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="property-field">
                <span className="property-label">Template Name</span>
                <input 
                  type="text" 
                  className="text-input" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                />
              </div>

              <div className="property-field">
                <span className="property-label">Template Type</span>
                {templateType === 'custom_media' ? (
                  <div style={{
                    padding: '8px 12px',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(217, 70, 239, 0.1)',
                    border: '1px solid rgba(217, 70, 239, 0.3)',
                    color: '#d946ef',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}>
                    Custom Media Slot (Fixed)
                  </div>
                ) : (
                  <select 
                    className="select-input"
                    value={templateType}
                    onChange={(e) => setTemplateType(e.target.value as TemplateType)}
                  >
                    <option value="top_standings">Top Standings Table</option>
                    <option value="overall_rankings_dual_column">Overall Rankings (Dual Column)</option>
                    <option value="top_5_overall">Top 5 Overall Table</option>
                    <option value="daily_standings">Daily Standings Table</option>
                    <option value="head_to_head">Head to Head Comparison</option>
                    <option value="team_profile">Team Profile</option>
                    <option value="player_profile">Player Profile</option>
                  </select>
                )}
              </div>

              {templateType !== 'custom_media' && (
                <>
                  <div className="property-field">
                    <span className="property-label">Graphic Title</span>
                    <input 
                      type="text" 
                      className="text-input" 
                      value={styleConfig.graphicTitle} 
                      placeholder="e.g. OGR T1 COLLATION"
                      onChange={(e) => updateStyleConfig({ graphicTitle: e.target.value })} 
                    />
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Wrap [word] or *word* to force accent highlight.</span>
                  </div>

                  <div className="property-field">
                    <span className="property-label">Graphic Subtitle</span>
                    <input 
                      type="text" 
                      className="text-input" 
                      value={styleConfig.graphicSubtitle} 
                      placeholder="e.g. Full Standings"
                      onChange={(e) => updateStyleConfig({ graphicSubtitle: e.target.value })} 
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Wrapper to hide standard settings for custom_media */}
          <div style={{ display: templateType === 'custom_media' ? 'none' : 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* Section 2: Theme Settings */}
          <div>
            <div className="sidebar-section-title">Color Theme</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="property-field">
                <span className="property-label">Theme Mode</span>
                <div className="toggle-group">
                  <button 
                    className={`toggle-btn ${styleConfig.colorTheme === 'dark' ? 'active' : ''}`}
                    onClick={() => updateStyleConfig({ colorTheme: 'dark' })}
                  >
                    Dark
                  </button>
                  <button 
                    className={`toggle-btn ${styleConfig.colorTheme === 'light' ? 'active' : ''}`}
                    onClick={() => updateStyleConfig({ colorTheme: 'light' })}
                  >
                    Light
                  </button>
                  <button 
                    className={`toggle-btn ${styleConfig.colorTheme === 'custom' ? 'active' : ''}`}
                    onClick={() => updateStyleConfig({ colorTheme: 'custom' })}
                  >
                    Custom
                  </button>
                </div>
              </div>

              {/* Custom Background Sub-panel */}
              {styleConfig.colorTheme === 'custom' && (
                <div style={{
                  border: '1px solid var(--accent)',
                  borderRadius: '10px',
                  padding: '0.85rem',
                  background: 'rgba(201,168,76,0.06)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--accent)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Custom Background Image</span>

                  {/* Preview thumbnail */}
                  {styleConfig.customBackgroundUrl && (
                    <img
                      src={styleConfig.customBackgroundUrl}
                      alt="bg preview"
                      style={{ width: '100%', height: '80px', objectFit: 'cover', borderRadius: '6px', border: '1px solid var(--border)' }}
                    />
                  )}

                  {/* Upload File */}
                  <label className="btn btn-secondary btn-sm" style={{ margin: 0, justifyContent: 'center', opacity: uploadingBg ? 0.7 : 1 }}>
                    {uploadingBg ? (
                      <Loader2 className="animate-spin" style={{ width: '14px', height: '14px' }} />
                    ) : (
                      <Upload style={{ width: '14px', height: '14px' }} />
                    )}
                    {uploadingBg ? `Uploading ${uploadBgProgress}%...` : 'Upload Image'}
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={handleUploadCustomBackground}
                      disabled={uploadingBg}
                    />
                  </label>

                  {/* Progress bar */}
                  {uploadingBg && (
                    <div style={{ position: 'relative', height: '3px', borderRadius: '2px', backgroundColor: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                      <div style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        height: '100%',
                        width: `${uploadBgProgress}%`,
                        backgroundColor: 'var(--accent)',
                        borderRadius: '2px',
                        transition: 'width 0.25s ease',
                        boxShadow: '0 0 6px var(--accent)',
                      }} />
                    </div>
                  )}

                  {/* Or paste URL */}
                  <div className="property-field" style={{ marginTop: 0 }}>
                    <span className="property-label">Or Paste URL</span>
                    <input
                      type="text"
                      className="text-input"
                      placeholder="https://..."
                      value={styleConfig.customBackgroundUrl || ''}
                      onChange={(e) => updateStyleConfig({ customBackgroundUrl: e.target.value })}
                      onBlur={(e) => {
                        resolveShortCanvaUrl('bg', e.target.value, (resolved) => {
                          updateStyleConfig({ customBackgroundUrl: resolved });
                        });
                      }}
                    />
                    {resolvingUrls['bg'] && (
                      <span style={{ fontSize: '0.7rem', color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                        <Loader2 className="animate-spin" style={{ width: '10px', height: '10px' }} />
                        Resolving short Canva link...
                      </span>
                    )}
                  </div>
                </div>
              )}

              <div className="property-field">
                <span className="property-label">Accent Color</span>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input 
                    type="color" 
                    className="color-picker-input" 
                    value={styleConfig.accentColor || '#C9A84C'} 
                    onChange={(e) => updateStyleConfig({ accentColor: e.target.value })}
                  />
                  <input 
                    type="text" 
                    className="text-input" 
                    style={{ width: '100px', fontSize: '0.85rem' }} 
                    value={styleConfig.accentColor || '#C9A84C'} 
                    onChange={(e) => updateStyleConfig({ accentColor: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Typography */}
          <div>
            <div className="sidebar-section-title">Typography (Google Fonts)</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="property-field">
                <span className="property-label">Heading Font</span>
                <input 
                  type="text" 
                  className="text-input" 
                  value={styleConfig.headingFont} 
                  placeholder="Inter"
                  onChange={(e) => updateStyleConfig({ headingFont: e.target.value })} 
                />
              </div>

              <div className="property-field">
                <span className="property-label">Body Font</span>
                <input 
                  type="text" 
                  className="text-input" 
                  value={styleConfig.bodyFont} 
                  placeholder="Inter"
                  onChange={(e) => updateStyleConfig({ bodyFont: e.target.value })} 
                />
              </div>
            </div>
          </div>

          {/* Section 4: Branding Settings */}
          <div>
            <div className="sidebar-section-title">Branding</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="property-field">
                <span className="property-label">Branding Logo</span>

                {/* Preview */}
                {styleConfig.brandingLogoUrl && (
                  <div style={{ position: 'relative', display: 'inline-block', marginBottom: '0.5rem' }}>
                    <img
                      src={styleConfig.brandingLogoUrl}
                      alt="logo preview"
                      style={{
                        width: '64px',
                        height: '64px',
                        objectFit: 'contain',
                        borderRadius: '6px',
                        border: '1px solid var(--border)',
                        backgroundColor: 'rgba(255,255,255,0.04)',
                        display: 'block',
                      }}
                    />
                    <button
                      onClick={() => updateStyleConfig({ brandingLogoUrl: '' })}
                      title="Remove logo"
                      style={{
                        position: 'absolute',
                        top: '-6px',
                        right: '-6px',
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        backgroundColor: '#333',
                        border: '1px solid var(--border)',
                        color: '#ccc',
                        fontSize: '11px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        lineHeight: 1,
                      }}
                    >×</button>
                  </div>
                )}

                {/* Upload button */}
                <label className="btn btn-secondary btn-sm" style={{ margin: '0 0 0.5rem', justifyContent: 'center', opacity: uploading ? 0.7 : 1 }}>
                  {uploading ? (
                    <Loader2 className="animate-spin" style={{ width: '14px', height: '14px' }} />
                  ) : (
                    <Upload style={{ width: '14px', height: '14px' }} />
                  )}
                  {uploading ? `Uploading ${uploadProgress}%...` : 'Upload Logo'}
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleUploadBranding}
                    disabled={uploading}
                  />
                </label>

                {/* Progress bar */}
                {uploading && (
                  <div style={{ position: 'relative', height: '3px', borderRadius: '2px', backgroundColor: 'rgba(255,255,255,0.08)', overflow: 'hidden', marginBottom: '0.5rem' }}>
                    <div style={{
                      position: 'absolute',
                      left: 0, top: 0, height: '100%',
                      width: `${uploadProgress}%`,
                      backgroundColor: 'var(--accent)',
                      borderRadius: '2px',
                      transition: 'width 0.25s ease',
                      boxShadow: '0 0 6px var(--accent)',
                    }} />
                  </div>
                )}

                {/* URL paste input */}
                <span className="property-label" style={{ marginBottom: '4px' }}>Or Paste URL</span>
                <input
                  type="text"
                  className="text-input"
                  placeholder="https://..."
                  value={styleConfig.brandingLogoUrl || ''}
                  onChange={(e) => updateStyleConfig({ brandingLogoUrl: e.target.value })}
                  onBlur={(e) => {
                    resolveShortCanvaUrl('logo', e.target.value, (resolved) => {
                      updateStyleConfig({ brandingLogoUrl: resolved });
                    });
                  }}
                />
                {resolvingUrls['logo'] && (
                  <span style={{ fontSize: '0.7rem', color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                    <Loader2 className="animate-spin" style={{ width: '10px', height: '10px' }} />
                    Resolving short Canva link...
                  </span>
                )}
              </div>

              <div className="property-field">
                <span className="property-label">Org Name (Line 1)</span>
                <input 
                  type="text" 
                  className="text-input" 
                  value={brandingOrg} 
                  placeholder="e.g. HEAVEN STAT ENGINE"
                  onChange={(e) => handleBrandingNameChange('org', e.target.value)} 
                />
              </div>

              <div className="property-field">
                <span className="property-label">Main Title (Line 2)</span>
                <input 
                  type="text" 
                  className="text-input" 
                  value={brandingMain} 
                  placeholder="e.g. CODM BR Coverage"
                  onChange={(e) => handleBrandingNameChange('main', e.target.value)} 
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '4px' }}>
                <input 
                  type="checkbox" 
                  id="chk-stamp"
                  checked={styleConfig.showStatsStamp}
                  onChange={(e) => updateStyleConfig({ showStatsStamp: e.target.checked })} 
                />
                <label htmlFor="chk-stamp" className="property-label" style={{ margin: 0, cursor: 'pointer' }}>
                  Show "Stats by Heaven" Watermark
                </label>
              </div>
            </div>
          </div>

          {/* Section 5: Tournament Logos */}
          <div>
            <div className="sidebar-section-title">Tournament Logos</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="property-field">
                <span className="property-label">Number of Slots</span>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  {[1, 2, 3].map((val) => (
                    <label key={val} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}>
                      <input 
                        type="radio" 
                        name="logo-slots" 
                        checked={styleConfig.tournamentLogoCount === val}
                        onChange={() => updateStyleConfig({ tournamentLogoCount: val as 1 | 2 | 3 })} 
                      />
                      <span className="property-label" style={{ margin: 0 }}>{val}</span>
                    </label>
                  ))}
                </div>
              </div>

              {Array.from({ length: styleConfig.tournamentLogoCount || 1 }).map((_, idx) => {
                const logo = styleConfig.tournamentLogos?.[idx] || { logoUrl: '', tournamentName: '' };
                return (
                  <div key={idx} style={{
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(255, 255, 255, 0.01)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                  }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 'bold', color: 'var(--accent)' }}>SLOT #{idx + 1}</span>
                    <div className="property-field">
                      <span className="property-label">Logo URL</span>
                      <input 
                        type="text" 
                        className="text-input" 
                        style={{ padding: '0.35rem 0.5rem', fontSize: '0.8rem' }}
                        value={logo.logoUrl} 
                        placeholder="Paste logo URL..."
                        onChange={(e) => handleTournamentLogoChange(idx, 'logoUrl', e.target.value)} 
                        onBlur={(e) => {
                          resolveShortCanvaUrl(`slot-${idx}`, e.target.value, (resolved) => {
                            handleTournamentLogoChange(idx, 'logoUrl', resolved);
                          });
                        }}
                      />
                      {resolvingUrls[`slot-${idx}`] && (
                        <span style={{ fontSize: '0.7rem', color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                          <Loader2 className="animate-spin" style={{ width: '10px', height: '10px' }} />
                          Resolving short Canva link...
                        </span>
                      )}
                    </div>
                    <div className="property-field">
                      <span className="property-label">Tournament Label</span>
                      <input 
                        type="text" 
                        className="text-input" 
                        style={{ padding: '0.35rem 0.5rem', fontSize: '0.8rem' }}
                        value={logo.tournamentName} 
                        placeholder="e.g. Major S2"
                        onChange={(e) => handleTournamentLogoChange(idx, 'tournamentName', e.target.value)} 
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 6: Top N Rows (Only Top Standings) */}
          {templateType === 'top_standings' && (
            <div>
              <div className="sidebar-section-title">Top Standings Settings</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="property-field">
                  <span className="property-label">Rows to display (Top N)</span>
                  <input 
                    type="number" 
                    className="text-input" 
                    min={1} 
                    max={25}
                    value={styleConfig.topN} 
                    onChange={(e) => updateStyleConfig({ topN: Math.max(1, Math.min(25, Number(e.target.value))) })} 
                  />
                </div>

                <div className="property-field">
                  <span className="property-label">Table Columns & Order</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Check to show. Reorder columns using the arrows.
                  </span>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    maxHeight: '300px',
                    overflowY: 'auto',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    padding: '8px',
                    backgroundColor: 'rgba(0,0,0,0.2)',
                  }}>
                    {/* Render currently active columns list in their sorted order */}
                    {styleConfig.showColumns.map((colKey, index) => {
                      const colDef = ALL_COLUMNS.find(c => c.key === colKey) || { key: colKey, label: colKey };
                      return (
                        <div key={colKey} style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '6px 8px',
                          backgroundColor: 'rgba(255, 255, 255, 0.02)',
                          border: '1px solid var(--border)',
                          borderRadius: '4px',
                        }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', flexGrow: 1 }}>
                            <input 
                              type="checkbox" 
                              checked={true}
                              onChange={() => handleColumnToggle(colKey)} 
                            />
                            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{colDef.label}</span>
                          </label>
                          <div style={{ display: 'flex', gap: '2px' }}>
                            <button 
                              disabled={index === 0} 
                              onClick={() => moveColumn(index, 'up')}
                              className="element-action-btn"
                              style={{ padding: '2px' }}
                            >
                              <ChevronUp style={{ width: '14px', height: '14px' }} />
                            </button>
                            <button 
                              disabled={index === styleConfig.showColumns.length - 1} 
                              onClick={() => moveColumn(index, 'down')}
                              className="element-action-btn"
                              style={{ padding: '2px' }}
                            >
                              <ChevronDown style={{ width: '14px', height: '14px' }} />
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    {/* Render unselected columns at the bottom */}
                    {ALL_COLUMNS.filter(c => !styleConfig.showColumns.includes(c.key)).map((colDef) => (
                      <div key={colDef.key} style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '6px 8px',
                        border: '1px dashed var(--border)',
                        borderRadius: '4px',
                        opacity: 0.6,
                      }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', flexGrow: 1 }}>
                          <input 
                            type="checkbox" 
                            checked={false}
                            onChange={() => handleColumnToggle(colDef.key)} 
                          />
                          <span style={{ fontSize: '0.8rem' }}>{colDef.label}</span>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Section 6c: Overall Rankings Dual Column Settings */}
          {templateType === 'overall_rankings_dual_column' && (
            <div>
              <div className="sidebar-section-title">Overall Rankings Settings</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="property-field">
                  <span className="property-label">Rows to display (Top N)</span>
                  <input 
                    type="number" 
                    className="text-input" 
                    min={1} 
                    max={30}
                    value={styleConfig.topN || 20} 
                    onChange={(e) => updateStyleConfig({ topN: Math.max(1, Math.min(30, Number(e.target.value))) })} 
                  />
                </div>
              </div>
            </div>
          )}

          {/* Section 6b: Daily Standings Settings */}
          {templateType === 'daily_standings' && (
            <div>
              <div className="sidebar-section-title">Daily Standings Settings</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="property-field">
                  <span className="property-label">Mode</span>
                  <div className="toggle-group">
                    <button 
                      className={`toggle-btn ${styleConfig.dailyStandingsMode !== 'single_lobby' ? 'active' : ''}`}
                      onClick={() => updateStyleConfig({ dailyStandingsMode: 'full_day', dailyStandingsLobby: null })}
                    >
                      Full Day
                    </button>
                    <button 
                      className={`toggle-btn ${styleConfig.dailyStandingsMode === 'single_lobby' ? 'active' : ''}`}
                      onClick={() => updateStyleConfig({ dailyStandingsMode: 'single_lobby', dailyStandingsLobby: styleConfig.dailyStandingsLobby || 1 })}
                    >
                      Single Lobby
                    </button>
                  </div>
                </div>

                <div className="property-field">
                  <span className="property-label">Day Number</span>
                  <input 
                    type="number" 
                    className="text-input" 
                    min={1} 
                    max={20}
                    value={styleConfig.dailyStandingsDay || 1} 
                    onChange={(e) => updateStyleConfig({ dailyStandingsDay: Math.max(1, Number(e.target.value)) })} 
                  />
                </div>

                {styleConfig.dailyStandingsMode === 'single_lobby' && (
                  <div className="property-field">
                    <span className="property-label">Lobby Number</span>
                    <input 
                      type="number" 
                      className="text-input" 
                      min={1} 
                      max={20}
                      value={styleConfig.dailyStandingsLobby || 1} 
                      onChange={(e) => updateStyleConfig({ dailyStandingsLobby: Math.max(1, Number(e.target.value)) })} 
                    />
                  </div>
                )}

                <div className="property-field">
                  <span className="property-label">Rows to display (Top N)</span>
                  <input 
                    type="number" 
                    className="text-input" 
                    min={1} 
                    max={20}
                    value={styleConfig.topN || 5} 
                    onChange={(e) => updateStyleConfig({ topN: Math.max(1, Math.min(20, Number(e.target.value))) })} 
                  />
                </div>

                <div className="property-field">
                  <span className="property-label">Points Column</span>
                  <select
                    className="select-input"
                    value={styleConfig.dailyPointsColumn || 'totalPts'}
                    onChange={(e) => updateStyleConfig({ dailyPointsColumn: e.target.value as 'totalPts' | 'kills' | 'placementPts' })}
                  >
                    <option value="totalPts">Total Points</option>
                    <option value="kills">Total Kills</option>
                    <option value="placementPts">Placement Points</option>
                  </select>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Choose what the right-hand column shows.</span>
                </div>
              </div>
            </div>
          )}

          {/* Section 6c: Top 5 Overall Settings */}
          {templateType === 'top_5_overall' && (
            <div>
              <div className="sidebar-section-title">Top 5 Overall Settings</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="property-field">
                  <span className="property-label">Rows to display (Top N)</span>
                  <input 
                    type="number" 
                    className="text-input" 
                    min={1} 
                    max={20}
                    value={styleConfig.topN || 5} 
                    onChange={(e) => updateStyleConfig({ topN: Math.max(1, Math.min(20, Number(e.target.value))) })} 
                  />
                </div>

                <div className="property-field">
                  <span className="property-label">Points Column</span>
                  <select
                    className="select-input"
                    value={styleConfig.dailyPointsColumn || 'totalPts'}
                    onChange={(e) => updateStyleConfig({ dailyPointsColumn: e.target.value as 'totalPts' | 'kills' | 'placementPts' })}
                  >
                    <option value="totalPts">Total Points</option>
                    <option value="kills">Total Kills</option>
                    <option value="placementPts">Placement Points</option>
                  </select>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Choose what the right-hand column shows.</span>
                </div>
              </div>
            </div>
          )}

          </div>

          {/* Section 7: Custom Media Configurator */}
          {templateType === 'custom_media' && (
            <div>
              <div className="sidebar-section-title" style={{ color: '#d946ef' }}>Media Settings</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{
                  border: '1px solid #d946ef',
                  borderRadius: '10px',
                  padding: '1rem',
                  background: 'rgba(217, 70, 239, 0.05)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.85rem',
                }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#d946ef', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                    Upload Media File
                  </span>

                  {/* Thumbnail / Video preview */}
                  {styleConfig.customMediaUrl ? (
                    <div style={{ width: '100%', height: '140px', border: '1px solid var(--border)', borderRadius: '6px', overflow: 'hidden', position: 'relative', backgroundColor: '#000' }}>
                      {styleConfig.customMediaType === 'video' ? (
                        <video src={styleConfig.customMediaUrl} muted loop autoPlay style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                      ) : (
                        <img src={styleConfig.customMediaUrl} alt="custom media" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                      )}
                      
                      <button
                        onClick={() => updateStyleConfig({ customMediaUrl: '', customMediaType: 'image' })}
                        title="Remove Media"
                        style={{
                          position: 'absolute',
                          top: '6px',
                          right: '6px',
                          backgroundColor: 'rgba(0,0,0,0.6)',
                          border: '1px solid rgba(255,255,255,0.2)',
                          color: '#fff',
                          borderRadius: '4px',
                          padding: '2px 6px',
                          fontSize: '11px',
                          cursor: 'pointer',
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div style={{
                      height: '80px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px dashed rgba(217, 70, 239, 0.3)',
                      borderRadius: '6px',
                      fontSize: '0.8rem',
                      color: 'var(--text-muted)',
                    }}>
                      No media uploaded yet
                    </div>
                  )}

                  {/* Upload button */}
                  <label className="btn btn-secondary btn-sm" style={{ margin: 0, justifyContent: 'center', opacity: uploadingMedia ? 0.7 : 1, borderColor: 'rgba(217, 70, 239, 0.4)', color: '#d946ef' }}>
                    {uploadingMedia ? (
                      <Loader2 className="animate-spin" style={{ width: '14px', height: '14px' }} />
                    ) : (
                      <Upload style={{ width: '14px', height: '14px' }} />
                    )}
                    {uploadingMedia ? `Uploading ${uploadMediaProgress}%...` : 'Upload Video, GIF or Image'}
                    <input
                      type="file"
                      accept="image/*,video/*"
                      style={{ display: 'none' }}
                      onChange={handleUploadMedia}
                      disabled={uploadingMedia}
                    />
                  </label>

                  {/* Progress bar */}
                  {uploadingMedia && (
                    <div style={{ position: 'relative', height: '3px', borderRadius: '2px', backgroundColor: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                      <div style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        height: '100%',
                        width: `${uploadMediaProgress}%`,
                        backgroundColor: '#d946ef',
                        borderRadius: '2px',
                        transition: 'width 0.25s ease',
                        boxShadow: '0 0 6px #d946ef',
                      }} />
                    </div>
                  )}

                  {/* Or paste direct URL */}
                  <div className="property-field" style={{ marginTop: 0 }}>
                    <span className="property-label">Or Paste Media URL</span>
                    <input
                      type="text"
                      className="text-input"
                      placeholder="https://..."
                      value={styleConfig.customMediaUrl || ''}
                      onChange={(e) => {
                        const url = e.target.value;
                        const isVid = url.endsWith('.mp4') || url.endsWith('.webm') || url.includes('video');
                        updateStyleConfig({ customMediaUrl: url, customMediaType: isVid ? 'video' : 'image' });
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Right Side: Preview Panel */}
        <div style={{
          backgroundColor: '#121218',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'auto',
          padding: '2.5rem 2rem',
          boxSizing: 'border-box',
        }}>
          
          {/* Preview Source Selector Toolbar (Static header above the canvas) */}
          <div style={{
            width: '960px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            marginBottom: '1.5rem',
          }}>
            {templateType === 'custom_media' ? (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.9rem',
                fontWeight: 700,
                color: '#d946ef',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}>
                <Video style={{ width: '16px', height: '16px' }} />
                <span>Custom Media Broadcast Scene (No Data Binding)</span>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  
                  {/* Tournament Selector */}
                  <div className="editor-preview-selector">
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Preview Tourney:</span>
                    <select 
                      value={selectedTournamentId}
                      onChange={(e) => setSelectedTournamentId(e.target.value)}
                    >
                      <option value="">-- Global / Career Stats --</option>
                      {tournaments.map((t) => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Head-to-Head Source Pickers */}
                  {templateType === 'head_to_head' && (
                    <>
                      <div className="editor-preview-selector">
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Team A:</span>
                        <select 
                          value={previewTeamAId}
                          onChange={(e) => setPreviewTeamAId(e.target.value)}
                        >
                          {filteredTeams.map((t) => (
                            <option key={t.teamId || t.id} value={t.teamId || t.id}>{t.teamName}</option>
                          ))}
                        </select>
                      </div>
                      <div className="editor-preview-selector">
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Team B:</span>
                        <select 
                          value={previewTeamBId}
                          onChange={(e) => setPreviewTeamBId(e.target.value)}
                        >
                          {filteredTeams.filter(t => (t.teamId || t.id) !== previewTeamAId).map((t) => (
                            <option key={t.teamId || t.id} value={t.teamId || t.id}>{t.teamName}</option>
                          ))}
                        </select>
                      </div>
                    </>
                  )}

                  {/* Team Profile Source Picker */}
                  {templateType === 'team_profile' && (
                    <div className="editor-preview-selector">
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Team:</span>
                      <select 
                        value={previewTeamId}
                        onChange={(e) => setPreviewTeamId(e.target.value)}
                      >
                        {filteredTeams.map((t) => (
                          <option key={t.teamId || t.id} value={t.teamId || t.id}>{t.teamName}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Player Profile Source Picker */}
                  {templateType === 'player_profile' && (
                    <div className="editor-preview-selector">
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Player:</span>
                      <select 
                        value={previewPlayerId}
                        onChange={(e) => setPreviewPlayerId(e.target.value)}
                      >
                        {filteredPlayers.map((p) => (
                          <option key={p.playerId || p.id} value={p.playerId || p.id}>
                            {p.ign || p.professionalName || p.id}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* Spinner indicator */}
                {previewLoading && (
                  <div style={{
                    background: 'rgba(0,0,0,0.5)',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '0.8rem',
                    border: '1px solid var(--border-glass)',
                  }}>
                    <Loader2 className="animate-spin" style={{ width: '12px', height: '12px', animation: 'spin 1s linear infinite' }} />
                    <span>Loading preview data...</span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* 1920x1080 graphic scaled down to 50% */}
          <div style={{
            width: '960px',
            height: '540px',
            position: 'relative',
            border: '2px dashed rgba(255, 255, 255, 0.15)',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7)',
            backgroundColor: '#000',
            overflow: 'hidden',
          }}>
            <div 
              id="broadcast-graphic-preview"
              style={{
                width: '1920px',
                height: '1080px',
                transform: 'scale(0.5)',
                transformOrigin: 'top left',
                position: 'absolute',
                top: 0,
                left: 0,
              }}
            >
              <style dangerouslySetInnerHTML={{ __html: `${googleFontsLink(styleConfig)}\n${cssVarsForTheme(styleConfig)}` }} />
              <TemplateComponent data={previewData} styleConfig={styleConfig} />
            </div>
          </div>

          <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Live preview scaled to 50%. Exported image or OBS renders at full 1920x1080.
          </div>

        </div>

      </div>
    </div>
  );
}
