import React, { useState, useEffect } from 'react';
import { TemplateStyleConfig } from '@/lib/db';

interface CustomMediaProps {
  data: any;
  styleConfig: TemplateStyleConfig;
}

/** Returns the Canva embed URL if the given URL is a Canva design page, otherwise null. */
export function getCanvaEmbedUrl(url: string): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    // Matches canva.com/design/<id>/... or canva.com/design/<id>
    if (parsed.hostname.endsWith('canva.com') && parsed.pathname.includes('/design/')) {
      // Strip to base design path, add ?embed
      const designMatch = parsed.pathname.match(/^(\/design\/[^/]+)/);
      if (designMatch) {
        return `https://www.canva.com${designMatch[1]}/view?embed`;
      }
    }
  } catch {
    // not a valid URL
  }
  return null;
}

/** Returns true if the URL is any sort of Canva URL (short link or full design) */
export function isCanvaUrl(url: string): boolean {
  if (!url) return false;
  return (
    url.includes('canva.link') ||
    url.includes('canva.me') ||
    url.includes('canv.a') ||
    url.includes('canva.com/design/')
  );
}

export function detectMediaType(url: string, explicitType?: string): 'video' | 'image' | 'canva' {
  if (explicitType === 'video') return 'video';
  if (explicitType === 'image' || explicitType === 'gif') return 'image';
  if (explicitType === 'canva') return 'canva';

  if (!url) return 'image';

  // Canva URLs — always render as iframe
  if (isCanvaUrl(url)) return 'canva';

  if (url.startsWith('data:video/')) return 'video';
  if (url.startsWith('data:image/')) return 'image';

  let cleanUrl = url;
  try {
    const parsed = new URL(url);
    cleanUrl = parsed.pathname;
  } catch {
    // raw string fallback
  }

  const lower = cleanUrl.toLowerCase();
  const videoExtensions = ['.mp4', '.webm', '.mov', '.m4v', '.mkv', '.ogv', '.avi', '.3gp'];
  if (videoExtensions.some((ext) => lower.endsWith(ext)) || lower.includes('/video/')) {
    return 'video';
  }

  return 'image';
}

export const CustomMedia: React.FC<CustomMediaProps> = ({ styleConfig }) => {
  const { customMediaUrl, customMediaType, customMediaFit = 'cover' } = styleConfig;
  const [hasError, setHasError] = useState(false);
  const [errorDetail, setErrorDetail] = useState('');

  useEffect(() => {
    setHasError(false);
    setErrorDetail('');
  }, [customMediaUrl]);

  if (!customMediaUrl) {
    return (
      <div style={{
        width: '1920px',
        height: '1080px',
        backgroundColor: '#0a0a0f',
        color: '#d946ef',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'sans-serif',
        border: '4px dashed rgba(217, 70, 239, 0.3)',
        boxSizing: 'border-box',
      }}>
        <h2 style={{ fontSize: '36px', fontWeight: 800, margin: '0 0 10px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Custom Media Output Slot
        </h2>
        <p style={{ fontSize: '18px', color: 'rgba(255, 255, 255, 0.4)', margin: 0 }}>
          Upload an image, GIF, or video from the template editor to display it here.
        </p>
      </div>
    );
  }

  if (hasError) {
    return (
      <div style={{
        width: '1920px',
        height: '1080px',
        backgroundColor: '#0a0a0f',
        color: '#ef4444',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'sans-serif',
        border: '4px dashed rgba(239, 68, 68, 0.4)',
        boxSizing: 'border-box',
        padding: '40px',
        textAlign: 'center',
      }}>
        <h2 style={{ fontSize: '32px', fontWeight: 800, margin: '0 0 12px 0', textTransform: 'uppercase' }}>
          Unable to Load Media
        </h2>
        <p style={{ fontSize: '18px', color: 'rgba(255, 255, 255, 0.6)', maxWidth: '900px', margin: '0 0 10px 0', overflowWrap: 'anywhere' }}>
          {errorDetail || `The media could not be loaded (${customMediaUrl.slice(0, 100)}${customMediaUrl.length > 100 ? '...' : ''}). Please verify the link or upload a new file.`}
        </p>
        <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.3)', margin: 0 }}>
          Tip: For videos, ensure Firebase Storage is enabled and the file was uploaded via the editor.
        </p>
      </div>
    );
  }

  const mediaType = detectMediaType(customMediaUrl, customMediaType);
  const objectFitStyle = customMediaFit === 'fill' ? 'fill' : customMediaFit === 'contain' ? 'contain' : 'cover';
  // Only apply crossOrigin for remote HTTP(S) URLs — data URIs don't need it and it can break them
  const isRemoteUrl = customMediaUrl.startsWith('http://') || customMediaUrl.startsWith('https://');

  // ── Canva iframe embed ───────────────────────────────────────────────────────
  if (mediaType === 'canva') {
    const embedUrl = getCanvaEmbedUrl(customMediaUrl) ?? customMediaUrl;
    return (
      <div style={{
        width: '1920px',
        height: '1080px',
        backgroundColor: 'transparent',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <iframe
          key={embedUrl}
          src={embedUrl}
          title="Canva Design"
          allow="fullscreen"
          allowFullScreen
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            display: 'block',
          }}
        />
      </div>
    );
  }

  return (
    <div style={{
      width: '1920px',
      height: '1080px',
      backgroundColor: 'transparent',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {mediaType === 'video' ? (
        <video
          key={customMediaUrl}
          src={customMediaUrl}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          {...(isRemoteUrl ? { crossOrigin: 'anonymous' as const, referrerPolicy: 'no-referrer' as const } : {})}
          onError={(e) => {
            const target = e.target as HTMLVideoElement;
            setErrorDetail(target.error?.message || 'Video failed to load.');
            setHasError(true);
          }}
          style={{
            width: '100%',
            height: '100%',
            objectFit: objectFitStyle,
            display: 'block',
          }}
        />
      ) : (
        <img
          key={customMediaUrl}
          src={customMediaUrl}
          alt="Custom Broadcast Media"
          {...(isRemoteUrl ? { referrerPolicy: 'no-referrer' as const, crossOrigin: 'anonymous' as const } : {})}
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            setErrorDetail(`Image failed to load: ${target.src?.slice(0, 60) || ''}...`);
            setHasError(true);
          }}
          style={{
            width: '100%',
            height: '100%',
            objectFit: objectFitStyle,
            display: 'block',
          }}
        />
      )}
    </div>
  );
};
