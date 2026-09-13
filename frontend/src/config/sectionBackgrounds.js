/**
 * NOVA Planetary Backgrounds - Central Configuration
 * 
 * Defines cinematic space backgrounds for each NOVA application section.
 * Maintains a cohesive visual hierarchy:
 *   Content (★★★★★) -> UI Surfaces (★★★★☆) -> Planetary Atmosphere (★★☆☆☆)
 */

export const SECTION_BACKGROUNDS = {
  chat: {
    planet: 'earth',
    name: 'Earth',
    image: '/assets/backgrounds/earth-space.png',
    position: 'center bottom',
    // Exact opacities established for Earth in Chat
    opacityEmpty: 0.38,
    opacityActive: 0.24,
    gradient: `
      linear-gradient(
        to bottom,
        rgba(4, 6, 14, 0.85) 0%,
        rgba(4, 6, 14, 0.48) 38%,
        rgba(4, 6, 14, 0.36) 65%,
        rgba(3, 5, 12, 0.88) 100%
      ),
      radial-gradient(
        ellipse at 50% 88%,
        transparent 30%,
        rgba(3, 5, 12, 0.65) 85%
      )
    `,
  },
  explore: {
    planet: 'mars',
    name: 'Mars',
    image: '/assets/backgrounds/mars-space.png',
    position: 'center bottom',
    // Tuned for clear 30–40% visibility; surface craters, glowing horizon & moons
    opacityEmpty: 0.35,
    opacityActive: 0.35,
    gradient: `
      linear-gradient(
        to bottom,
        rgba(4, 6, 14, 0.70) 0%,
        rgba(4, 6, 14, 0.28) 38%,
        rgba(4, 6, 14, 0.22) 65%,
        rgba(3, 5, 12, 0.78) 100%
      ),
      radial-gradient(
        ellipse at 50% 85%,
        transparent 45%,
        rgba(3, 5, 12, 0.50) 90%
      )
    `,
  },
  templates: {
    planet: 'venus',
    name: 'Venus',
    image: '/assets/backgrounds/venus-space.png',
    position: 'center bottom',
    // Tuned for clear 30–35% visibility; warm golden atmosphere & planetary form
    opacityEmpty: 0.32,
    opacityActive: 0.32,
    gradient: `
      linear-gradient(
        to bottom,
        rgba(4, 6, 14, 0.74) 0%,
        rgba(4, 6, 14, 0.30) 38%,
        rgba(4, 6, 14, 0.25) 65%,
        rgba(3, 5, 12, 0.80) 100%
      ),
      radial-gradient(
        ellipse at 50% 85%,
        transparent 40%,
        rgba(3, 5, 12, 0.55) 90%
      )
    `,
  },
  library: {
    planet: 'jupiter',
    name: 'Jupiter',
    image: '/assets/backgrounds/jupiter-space.png',
    position: 'center bottom',
    // Tuned for clear 30–35% visibility; cloud bands, atmospheric patterns & Great Red Spot
    opacityEmpty: 0.34,
    opacityActive: 0.34,
    gradient: `
      linear-gradient(
        to bottom,
        rgba(4, 6, 14, 0.70) 0%,
        rgba(4, 6, 14, 0.26) 38%,
        rgba(4, 6, 14, 0.22) 65%,
        rgba(3, 5, 12, 0.76) 100%
      ),
      radial-gradient(
        ellipse at 50% 85%,
        transparent 45%,
        rgba(3, 5, 12, 0.50) 90%
      )
    `,
  },
  settings: {
    planet: 'saturn',
    name: 'Saturn',
    image: '/assets/backgrounds/saturn-space.png',
    position: 'center 42%',
    // Tuned for clear 30–35% visibility; prominent ring system, moons & horizon
    opacityEmpty: 0.32,
    opacityActive: 0.32,
    gradient: `
      linear-gradient(
        to bottom,
        rgba(4, 6, 14, 0.70) 0%,
        rgba(4, 6, 14, 0.26) 38%,
        rgba(4, 6, 14, 0.20) 65%,
        rgba(3, 5, 12, 0.76) 100%
      ),
      radial-gradient(
        ellipse at 50% 85%,
        transparent 45%,
        rgba(3, 5, 12, 0.50) 90%
      )
    `,
  },
};

/**
 * Maps planet names to section keys for versatile prop usage (<SectionBackground planet="mars" />)
 */
export const PLANET_TO_SECTION = {
  earth: 'chat',
  mars: 'explore',
  venus: 'templates',
  jupiter: 'library',
  saturn: 'settings',
};
