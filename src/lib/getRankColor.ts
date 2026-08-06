import { COLORS } from './overlayDesignTokens';

export function getRankColor(absoluteRank: number): string {
  if (absoluteRank === 1) return COLORS.rankElite;
  if (absoluteRank <= 3) return COLORS.rankTop;
  if (absoluteRank <= 5) return COLORS.rankPro;
  if (absoluteRank <= 10) return COLORS.rankMid;
  if (absoluteRank <= 20) return COLORS.rankLow;
  return COLORS.rankEntry;
}
