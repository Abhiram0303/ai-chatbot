import React from 'react';
import { SECTION_BACKGROUNDS, PLANET_TO_SECTION } from '../../config/sectionBackgrounds';

/**
 * Reusable Planetary Section Background Component
 * 
 * Manages atmospheric cinematic planetary backgrounds across NOVA sections.
 * Features:
 * - Content-first visual hierarchy (Content > Glass UI > Planetary Background)
 * - Fixed positioning behind workspace, completely independent of page scrolling
 * - Subtle 350ms crossfade between planetary environments
 * - Zero movement, rotation, particles, or parallax
 * 
 * @param {Object} props
 * @param {string} [props.section='chat'] - Target section ('chat', 'explore', 'templates', 'library', 'settings')
 * @param {string} [props.planet] - Optional planet identifier ('earth', 'mars', 'venus', 'jupiter', 'saturn')
 * @param {boolean} [props.isChatActive=false] - When on chat section, adjusts opacity between empty and active
 * @param {string} [props.className] - Optional container class
 */
export default function SectionBackground({
  section = 'chat',
  planet,
  isChatActive = false,
  className = '',
}) {
  // Resolve active section key from either `planet` or `section` prop
  const activeSectionKey = planet 
    ? (PLANET_TO_SECTION[planet.toLowerCase()] || 'chat')
    : (section.toLowerCase() || 'chat');

  return (
    <div
      className={`nova-section-bg-wrapper ${className}`}
      aria-hidden="true"
    >
      {Object.entries(SECTION_BACKGROUNDS).map(([secKey, config]) => {
        const isActive = activeSectionKey === secKey;
        const targetOpacity = secKey === 'chat'
          ? (isChatActive ? config.opacityActive : config.opacityEmpty)
          : config.opacityActive;

        return (
          <div
            key={secKey}
            className={`nova-planet-layer ${isActive ? 'active' : 'inactive'}`}
            data-planet={config.planet}
            style={{
              backgroundImage: `${config.gradient}, url('${config.image}')`,
              backgroundPosition: config.position,
              opacity: isActive ? targetOpacity : 0,
            }}
          />
        );
      })}
    </div>
  );
}
