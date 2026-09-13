import React from 'react';
import novaLogoImg from '../../assets/nova-logo.png';

/**
 * NovaLogo Component
 * Official canonical NOVA AI Assistant logo component.
 * Uses the exact provided robot starburst artwork asset.
 * Preserves transparent background, contains aspect ratio, and does not crop outer starburst.
 */
export default function NovaLogo({
  size = 32,
  showText = true,
  textSub = true,
  className = '',
  imgClassName = '',
  gap = 11,
}) {
  return (
    <div
      className={`nova-brand-logo ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: `${gap}px`,
      }}
    >
      <img
        src={novaLogoImg}
        alt="NOVA"
        width={size}
        height={size}
        className={`nova-logo-img ${imgClassName}`}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          objectFit: 'contain',
          display: 'block',
          flexShrink: 0,
          userSelect: 'none',
          background: 'transparent',
          border: 'none',
        }}
        draggable={false}
      />

      {showText && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            lineHeight: 1.15,
          }}
        >
          <span
            style={{
              fontSize: '1.08rem', // ~17px clean desktop typography
              fontWeight: 800,
              letterSpacing: '1px',
              color: '#ffffff',
              fontFamily: "'Inter', sans-serif",
            }}
          >
            NOVA
          </span>
          {textSub && (
            <span
              style={{
                fontSize: '0.58rem', // ~9.5px clean uppercase badge typography
                fontWeight: 700,
                letterSpacing: '2px',
                color: '#38bdf8',
                textTransform: 'uppercase',
                marginTop: '2px',
                fontFamily: "'Inter', sans-serif",
              }}
            >
              AI ASSISTANT
            </span>
          )}
        </div>
      )}
    </div>
  );
}


