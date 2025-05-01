// --- START OF FILE src/effects/particles.js ---

/**
 * Particle system for visual feedback effects in the Mound Mascot project.
 * Handles creation, update, and drawing of short-lived interaction particles.
 */

// --- Constants ---
const MAX_INTERACTION_PARTICLES = 50; // Limit total particles for performance
const BASE_INTERACTION_PARTICLE_COUNT = 8; // Default number per interaction burst

/**
 * Initializes the interaction particle system state.
 */
function initParticleSystem() {
  updateState('interactionParticles', []); // Ensure it's an empty array
  console.log("Interaction particle system initialized.");
}

/**
 * Creates a burst of interaction feedback particles, typically around the face.
 * Called by interaction handlers (e.g., feedback.js).
 */
function createInteractionParticles() {
  // Ensure state and p5 context are available
  if (typeof getState !== 'function' || typeof width === 'undefined') {
      if(!window._particleCreateWarned) console.warn("Cannot create interaction particles: Dependencies missing.");
      window._particleCreateWarned = true;
      return;
  }
  const state = getState();
  const { interactionParticles = [], currentFaceX, currentFaceY, palette } = state;

  // Get performance multiplier
  const detailLevel = typeof getDetailLevel === 'function' ? getDetailLevel("effects") : { multiplier: 1.0 };
  const particleCount = Math.max(3, Math.floor(BASE_INTERACTION_PARTICLE_COUNT * detailLevel.multiplier));

  // --- Particle Emission Logic ---
  const newParticles = [];
  const originX = currentFaceX || width / 2; // Use tracked face X or fallback
  const originY = currentFaceY || height / 2; // Use tracked face Y or fallback

  for (let i = 0; i < particleCount; i++) {
    const angle = randomInRange(0, TWO_PI); // Use util function
    const speed = randomInRange(1.0, 2.5);
    const distance = randomInRange(20, 40); // Emit slightly away from face center

    // Particle starting position
    const px = originX + Math.cos(angle) * distance;
    const py = originY + Math.sin(angle) * distance;

    // Velocity outwards from origin
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed - randomInRange(0.5, 1.5); // Add slight upward drift

    // Color based on palette (e.g., cheek or a contrasting color)
    let pColor;
    if (palette?.cheeks && randomChance(0.6)) { // 60% chance use cheek color
        pColor = color(palette.cheeks[0], palette.cheeks[1], palette.cheeks[2]);
    } else if (palette?.dots?.r) { // Use dots color range if available
        pColor = color(
            randomInRange(palette.dots.r[0], palette.dots.r[1]),
            randomInRange(palette.dots.g[0], palette.dots.g[1]),
            randomInRange(palette.dots.b[0], palette.dots.b[1])
        );
    } else { // Fallback to white
        pColor = color(255);
    }

    newParticles.push({
      x: px,
      y: py,
      vx: vx,
      vy: vy,
      life: 1.0, // Start fully opaque, fades out
      size: randomInRange(3, 7),
      color: pColor,
      // Optional: add rotation, type, etc. if needed later
    });
  }

  // --- Update State ---
  // Combine new particles with existing, respecting the MAX limit
  let combinedParticles = [...interactionParticles, ...newParticles];
  if (combinedParticles.length > MAX_INTERACTION_PARTICLES) {
    // Remove the oldest particles to stay within the limit
    combinedParticles = combinedParticles.slice(combinedParticles.length - MAX_INTERACTION_PARTICLES);
  }

  updateState('interactionParticles', combinedParticles);
}

/**
 * Updates the state (position, life) and draws all active interaction particles.
 * Should be called once per frame in the main draw loop if particles exist.
 */
function updateAndDrawInteractionParticles() {
  // Ensure p5 context and state functions are available
  if (typeof getState !== 'function' || typeof ellipse !== 'function') {
     if(!window._particleUpdateWarned) console.warn("Cannot update/draw interaction particles: Dependencies missing.");
     window._particleUpdateWarned = true;
     return;
  }

  const state = getState();
  const particles = state.interactionParticles || [];
  if (particles.length === 0) return; // Skip if no particles

  const updatedParticles = []; // Array for particles that are still alive

  push(); // Isolate drawing styles
  noStroke();

  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];

    // --- Update State ---
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.03; // Gravity/Drift down slightly
    p.vx *= 0.99; // Air resistance/damping
    p.life -= 0.018; // Decrease life (adjust fade speed)

    // --- Check if Alive ---
    if (p.life > 0) {
      // --- Draw Particle ---
      const alpha = p.life * 200; // Map life (1.0 -> 0.0) to alpha (200 -> 0)
      p.color.setAlpha(alpha); // Set alpha on the p5.Color object
      fill(p.color);
      ellipse(p.x, p.y, p.size * p.life, p.size * p.life); // Size shrinks with life

      updatedParticles.push(p); // Keep particle if still alive
    }
  }
  pop(); // Restore drawing styles

  // --- Update State ---
  // Only update state if the array content has actually changed
  if (updatedParticles.length !== particles.length) {
    updateState('interactionParticles', updatedParticles);
  }
}

// --- Exports ---
window.initParticleSystem = initParticleSystem;
window.createInteractionParticles = createInteractionParticles;
window.updateAndDrawInteractionParticles = updateAndDrawInteractionParticles;

// --- END OF FILE src/effects/particles.js ---