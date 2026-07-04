import { TemplateStyleConfig } from './db';

export function googleFontsLink(styleConfig: TemplateStyleConfig): string {
  if (!styleConfig) return '';
  const fonts = [...new Set([styleConfig.headingFont, styleConfig.bodyFont])]
    .filter(Boolean)
    .map(f => f.trim().replace(/ /g, '+'));
  return fonts.length > 0
    ? `@import url('https://fonts.googleapis.com/css2?${fonts.map(f => `family=${f}:wght@400;500;600;700;800`).join('&')}&display=swap');`
    : '';
}

export function cssVarsForTheme(styleConfig: TemplateStyleConfig): string {
  if (!styleConfig) return '';
  const isDark = styleConfig.colorTheme === 'dark';
  const accent = styleConfig.accentColor || '#C9A84C';

  // Helper to convert hex to rgba
  const hexToRgba = (hex: string, alpha: number) => {
    if (!hex) return 'transparent';
    const clean = hex.replace('#', '');
    let r = 201, g = 168, b = 76; // defaults for #C9A84C
    if (clean.length === 3) {
      r = parseInt(clean[0] + clean[0], 16);
      g = parseInt(clean[1] + clean[1], 16);
      b = parseInt(clean[2] + clean[2], 16);
    } else if (clean.length === 6) {
      r = parseInt(clean.substring(0, 2), 16);
      g = parseInt(clean.substring(2, 4), 16);
      b = parseInt(clean.substring(4, 6), 16);
    }
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const accentMuted = hexToRgba(accent, isDark ? 0.20 : 0.15);

  const vars = isDark ? `
    --bg-primary: #0D0D12;
    --bg-card: #13131A;
    --bg-row-alt: #1A1A24;
    --bg-row: #13131A;
    --border: rgba(255,255,255,0.07);
    --text-primary: #F1F5F9;
    --text-muted: #94A3B8;
    --text-heading: #FFFFFF;
    --accent: ${accent};
    --accent-muted: ${accentMuted};
    --rank-bg: #1E1E2A;
    --rank-border: rgba(255,255,255,0.12);
  ` : `
    --bg-primary: #F8F9FA;
    --bg-card: #FFFFFF;
    --bg-row-alt: #F1F3F5;
    --bg-row: #FFFFFF;
    --border: rgba(0,0,0,0.08);
    --text-primary: #1A1A2E;
    --text-muted: #6B7280;
    --text-heading: #0D0D12;
    --accent: ${accent};
    --accent-muted: ${accentMuted};
    --rank-bg: #F1F3F5;
    --rank-border: rgba(0,0,0,0.1);
  `;

  return `
    :root {
      ${vars}
      --heading-font: '${styleConfig.headingFont || 'Inter'}', sans-serif;
      --body-font: '${styleConfig.bodyFont || 'Inter'}', sans-serif;
    }
  `;
}
