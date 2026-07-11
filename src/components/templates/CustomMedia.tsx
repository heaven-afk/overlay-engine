import React from 'react';
import { TemplateStyleConfig } from '@/lib/db';

interface CustomMediaProps {
  data: any;
  styleConfig: TemplateStyleConfig;
}

export const CustomMedia: React.FC<CustomMediaProps> = ({ styleConfig }) => {
  const { customMediaUrl, customMediaType = 'image' } = styleConfig;

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

  const isVideo = customMediaType === 'video' || customMediaUrl.startsWith('data:video/') || customMediaUrl.endsWith('.mp4') || customMediaUrl.endsWith('.webm');

  return (
    <div style={{
      width: '1920px',
      height: '1080px',
      backgroundColor: 'transparent',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {isVideo ? (
        <video
          src={customMediaUrl}
          autoPlay
          loop
          muted
          playsInline
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
          }}
        />
      ) : (
        <img
          src={customMediaUrl}
          alt="Custom Broadcast Media"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
          }}
        />
      )}
    </div>
  );
};
