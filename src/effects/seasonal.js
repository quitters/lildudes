// --- START OF FILE src/effects/seasonal.js ---

/**
 * Seasonal effects system for the Mound Mascot project.
 * Detects the current season, applies appropriate effects (particles),
 * and handles their update and rendering logic.
 */

// --- Constants ---
const MAX_SEASON_PARTICLES = 60; // Adjusted max count
const BASE_PARTICLE_COUNT = { // Base counts per season before performance scaling
  winter: 35,
  autumn: 20,
  spring: 25,
  summer: 15 // Dust/pollen should be sparser
};

// --- Season Detection ---

/**
 * Detects the current season based on the system's current month.
 * Assumes Northern Hemisphere seasons.
 * @returns {"spring" | "summer" | "autumn" | "winter"} The detected season name.
 */
function detectSeason() {
  const month = new Date().getMonth(); // 0 (Jan) to 11 (Dec)

  if (month >= 2 && month <= 4) return "spring"; // Mar, Apr, May
  if (month >= 5 && month <= 7) return "summer"; // Jun, Jul, Aug
  if (month >= 8 && month <= 10) return "autumn"; // Sep, Oct, Nov
  return "winter"; // Dec, Jan, Feb
}

// --- Effect Application ---

/**
 * Determines the active seasonal effect based on the current season and randomness.
 * Updates the 'seasonalEffects' and 'currentSeason' properties in the state.
 * Should be called once during setup.
 */
function applySeasonalEffects() {
   if (typeof getState !== 'function' || typeof updateState !== 'function') {
      console.error("Cannot apply seasonal effects: State functions missing.");
      return;
   }

  const state = getState();
  const currentDetectedSeason = detectSeason();
  let effect = null; // Start with no effect

  // --- Determine active season (prioritize debug override) ---
  let activeSeason = currentDetectedSeason;
  let seasonSource = "detected";

  if (state.debugForcedSeason && state.debugForcedSeason !== 'auto') {
      activeSeason = state.debugForcedSeason; // Use the forced season ('spring', 'summer', 'autumn', 'winter', 'none')
      seasonSource = "forced by debug panel";
      console.log(`Using forced season: ${activeSeason}`);
  } else {
      // Reset forced season in state if it was previously set but now is 'auto'
      // This ensures we don't keep applying a previously forced season indefinitely
      if (state.debugForcedSeason === 'auto' && state.currentSeason !== currentDetectedSeason) {
          updateState('debugForcedSeason', null); // Or set back to null/undefined if preferred
      }
  }

  // Only apply effects if the active season has changed or hasn't been set
  if (state.currentSeason !== activeSeason || !state.seasonalEffects || seasonSource === "forced by debug panel") {
      // Always re-evaluate if forced, even if the forced season is the same as the current one

      console.log(`Applying effects for ${activeSeason} season (source: ${seasonSource}).`);

      // Determine chance of having an effect active this session
      let effectChance = 0.6; // 60% base chance to show seasonal effect

      // Handle 'none' case from debug override explicitly
      if (activeSeason === 'none') {
          effect = null;
          console.log("Seasonal effects forced off by debug panel.");
      } else if (randomChance(effectChance)) { // Use util function for other seasons
          // Get performance multiplier
          const detailLevel = typeof getDetailLevel === 'function' ? getDetailLevel("effects") : { multiplier: 1.0 };
          const multiplier = detailLevel.multiplier;
          effect = null; // Reset effect for the new season

          // Assign effect based on the *active* season
          switch (activeSeason) {
              case "spring":
                  effect = { type: "petals", count: Math.max(5, Math.floor(BASE_PARTICLE_COUNT.spring * multiplier)) };
                  break;
              case "summer":
                  effect = { type: "dust", count: Math.max(3, Math.floor(BASE_PARTICLE_COUNT.summer * multiplier)) };
                  // Optionally add sun rays effect state here if needed, or handle directly in draw
                  break;
              case "autumn":
                  effect = { type: "leaves", count: Math.max(4, Math.floor(BASE_PARTICLE_COUNT.autumn * multiplier)) };
                  break;
              case "winter":
                  effect = { type: "snowflakes", count: Math.max(8, Math.floor(BASE_PARTICLE_COUNT.winter * multiplier)) };
                  break;
              // 'none' case handled above
              default:
                   console.warn(`Unknown season '${activeSeason}' provided. No effect applied.`);
                   effect = null;
          }
      } else {
          effect = null; // No effect if chance roll fails or season is 'none'
      }

      // Update state with the determined effect and *active* season
      updateStateProperties({
         seasonalEffects: effect,
         currentSeason: activeSeason, // Store the active season (could be detected or forced)
         seasonParticles: [] // Clear old particles when effect changes
      });

      // Initialize particles for the new effect (if any)
      if (effect) {
         setupSeasonParticles();
      }

   } else {
      console.log(`Season (${activeSeason}) unchanged, keeping existing effects.`);
      // Ensure particles are set up if effect exists but particles are somehow empty
      if (state.seasonalEffects && (!state.seasonParticles || state.seasonParticles.length === 0)) {
         setupSeasonParticles();
      }
   }
}


/**
 * Initializes the 'seasonParticles' array based on the 'seasonalEffects' state.
 * MODIFIED to add frame offset to avoid synchronized updates and add velocity dampening.
 */
function setupSeasonParticles() {
   if (typeof getState !== 'function' || typeof updateState !== 'function') return;

   const state = getState();
   const effect = state.seasonalEffects;
   if (!effect || !effect.type || !effect.count) return; // No effect to set up

   console.log(`Setting up ${effect.count} particles for effect: ${effect.type}`);
   const particles = [];
   const count = Math.min(effect.count, MAX_SEASON_PARTICLES); // Ensure max limit

   // Record current performance level to detect changes
   const currentPerformanceLevel = state.performanceSettings?.level || 'high';

   for (let i = 0; i < count; i++) {
       const particle = _createSingleSeasonParticle(effect.type);
       if (particle) {
           // Add frameOffset to each particle so they don't all update simultaneously
           // This helps prevent "wave-like" flashing effects
           particle.frameOffset = Math.floor(randomInRange(0, 10));
           
           // Store the last performance level we saw, to detect changes
           particle.lastPerformanceLevel = currentPerformanceLevel;
           
           // Store the last position to calculate delta
           particle.lastX = particle.x;
           particle.lastY = particle.y;
           if (particle.rotation !== undefined) {
               particle.lastRotation = particle.rotation;
           }
           
           particles.push(particle);
       }
   }

   // Store particles in state
   updateState('seasonParticles', particles);
}

/** 
 * Internal helper to create a single seasonal particle object.
 * MODIFIED to use more subtle motion values to prevent flickering.
 */
function _createSingleSeasonParticle(type) {
    // Ensure p5 context
    if (typeof width === 'undefined' || typeof height === 'undefined') return null;

    const x = randomInRange(0, width); // Use util function
    const y = randomInRange(-height * 0.5, height); // Start some off-screen top
    const size = (type === 'dust') ? randomInRange(1, 3) : randomInRange(4, 10);

    switch (type) {
        case "snowflakes":
            return {
                type: "snowflake", x, y, size,
                speed: randomInRange(0.3, 1.0), // REDUCED speed range
                drift: randomInRange(-0.2, 0.2), // REDUCED drift
                rotation: randomInRange(0, TWO_PI),
                rotSpeed: randomInRange(-0.01, 0.01), // REDUCED rotation speed
                color: [240, 245, 255] // Off-white
            };
        case "leaves":
            return {
                type: "leaf", x, y, size: randomInRange(6, 15),
                speed: randomInRange(0.2, 0.8), // REDUCED speed range
                drift: randomInRange(-0.5, 0.5), // REDUCED drift
                rotation: randomInRange(0, TWO_PI),
                rotSpeed: randomInRange(-0.02, 0.02), // REDUCED rotation speed
                color: [ // Autumnal colors
                    randomInRange(180, 240),
                    randomInRange(80, 160),
                    randomInRange(20, 60)
                ]
            };
        case "petals": // Spring
            return {
                type: "petal", x, y, size: randomInRange(5, 12),
                speed: randomInRange(0.15, 0.7), // REDUCED speed range
                drift: randomInRange(-0.6, 0.6), // REDUCED drift
                rotation: randomInRange(0, TWO_PI),
                rotSpeed: randomInRange(-0.02, 0.02), // REDUCED rotation speed
                color: [ // Pinks/whites
                    randomInRange(240, 255),
                    randomInRange(200, 240),
                    randomInRange(210, 255)
                ]
            };
        case "dust": // Summer
             return {
                type: "dust", x, y, size,
                speed: randomInRange(0.1, 0.3), // REDUCED speed range
                drift: randomInRange(-0.1, 0.1), // REDUCED drift
                alpha: randomInRange(80, 150),
                color: [255, 255, 230] // Pale yellow/white
            };
        default: return null;
    }
}


// --- Update & Draw ---

/**
 * Updates positions and draws all active seasonal effect particles.
 * Should be called once per frame in the main draw loop.
 * FIXED to prevent flashing by properly respecting performance settings
 * and being more selective about when particle positions update.
 * OPTIMIZED to reduce calculations and conditionals.
 * OPTIMIZED to skip unnecessary rotation for elliptical particles (petals and dust)
 * which improves performance especially for the Spring (petals) seasonal effect.
 */
function updateAndDrawSeasonEffects() {
   // Ensure p5 context and state functions are available
   if (typeof getState !== 'function' || typeof ellipse !== 'function') {
      if(!window._seasonUpdateWarned) console.warn("Cannot update/draw seasonal effects: Dependencies missing.");
      window._seasonUpdateWarned = true;
      return;
   }

   const state = getState();
   const particles = state.seasonParticles || [];
   if (particles.length === 0) return; // Skip if no particles

   // Get current performance settings
   const performOp = typeof shouldPerformOperation === 'function' ? 
       shouldPerformOperation("effect") : true;
   
   // ALWAYS DRAW particles, but only UPDATE positions based on performance settings
   // This is the key fix - draw every frame but only update positions occasionally
   const updatePositions = performOp;

   // Early calculation of interpolation values outside the particle loop
   // This greatly reduces per-particle overhead
   const perfLevel = state.performanceSettings?.level || 'high';
   const updateFreq = state.performanceSettings.effectUpdateFrequency || 1;
   const isInterpolationNeeded = perfLevel !== 'high' && updateFreq > 1 && !updatePositions;
   
   // If using interpolation, pre-calculate values
   let frameInCycle = 0;
   let progress = 0;
   let easedProgress = 0;
   
   if (isInterpolationNeeded) {
     frameInCycle = frameCount % updateFreq;
     progress = frameInCycle / updateFreq;
     easedProgress = 0.5 - 0.5 * cos(PI * progress); // Cosine easing
   }

   // Flag to track if we need to update the state
   let stateNeedsUpdate = false;

   // Array for particles remaining on screen (only used when updating positions)
   const updatedParticles = updatePositions ? [] : null;

   push(); // Isolate drawing styles

   for (let i = 0; i < particles.length; i++) {
      const p = particles[i];

      // --- Update Particle State (ONLY when updatePositions is true) ---
      if (updatePositions) {
         // Get current performance level 
         const currentPerformanceLevel = state.performanceSettings?.level || 'high';
         
         // Check if performance level changed
         const performanceLevelChanged = p.lastPerformanceLevel !== currentPerformanceLevel;
         
         // Update stored performance level
         p.lastPerformanceLevel = currentPerformanceLevel;
         
         // Use frameOffset to stagger updates if present
         const shouldUpdateThisParticle = !p.frameOffset || (frameCount + p.frameOffset) % state.performanceSettings.effectUpdateFrequency === 0;
         
         if (shouldUpdateThisParticle || performanceLevelChanged) {
             // Store last position for interpolation
             p.lastX = p.x;
             p.lastY = p.y;
             if (p.rotation !== undefined) {
                 p.lastRotation = p.rotation;
             }
             
             // Calculate new position
             const newY = p.y + p.speed;
             const newX = p.x + p.drift;
             // Add subtle horizontal flutter based on noise/sine
             const flutterX = sin(frameCount * 0.02 + i * 0.5) * 0.4 * (p.drift + 0.1);
             
             // Apply position change with extra smoothing during performance transitions
             if (performanceLevelChanged) {
                // Apply smaller change if performance level changed to reduce jumps
                p.x += (newX - p.x + flutterX) * 0.3; // Dampen movement during transition
                p.y += (newY - p.y) * 0.3;
             } else {
                p.x = newX + flutterX;
                p.y = newY;
             }
             
             if (p.rotation !== undefined) {
                p.rotation += p.rotSpeed;
             }
             
             // Add slight speed variation for leaves/petals
             if (p.type === 'leaf' || p.type === 'petal') {
                p.speed *= 0.998; 
                p.speed = max(0.1, p.speed);
             }
         }

         // --- Check Boundaries & Reset ---
         // Reset particle if it goes off bottom or too far off sides
         if (shouldUpdateThisParticle) {
             if (p.y > height + p.size * 2) {
                stateNeedsUpdate = true; // Mark state for update
                const newParticle = _createSingleSeasonParticle(p.type);
                if (newParticle) {
                   newParticle.y = -p.size * 2; // Start just above screen
                   newParticle.x = randomInRange(0, width);
                   
                   // Add frameOffset to new particles too
                   newParticle.frameOffset = Math.floor(randomInRange(0, 10));
                   
                   // Copy performance level info to new particle
                   newParticle.lastPerformanceLevel = currentPerformanceLevel;
                   
                   // Initialize last position
                   newParticle.lastX = newParticle.x;
                   newParticle.lastY = newParticle.y;
                   if (newParticle.rotation !== undefined) {
                       newParticle.lastRotation = newParticle.rotation;
                   }
                   
                   updatedParticles.push(newParticle);
                }
                continue; // Skip drawing this particle, add replacement
             } else if (p.x < -p.size * 2 || p.x > width + p.size * 2) {
                // Reset horizontal position if it goes too far off screen
                p.lastX = p.x; // Store last position before reset
                p.x = randomInRange(0, width);
                p.lastY = p.y; // Store last position before reset
                p.y = randomInRange(-50, 0); // Reset near top
             }
         }

         // Add to updatedParticles array if we're updating positions
         updatedParticles.push(p);
      }

      // --- Draw Particle (ALWAYS do this regardless of performance settings) ---
      // For medium/low performance, interpolate position between updates to make movement smooth
      let drawX = p.x;
      let drawY = p.y;
      let drawRotation = p.rotation;
      
      // Simplified interpolation - only calculate when needed
      if (isInterpolationNeeded && p.lastX !== undefined) {
          // Apply simple interpolation using pre-calculated values
          const expectedNextY = p.y + p.speed;
          const expectedNextX = p.x + p.drift;
          
          // Interpolate between last position and expected next position
          drawX = p.lastX + (expectedNextX - p.lastX) * easedProgress;
          drawY = p.lastY + (expectedNextY - p.lastY) * easedProgress;
          
          // Also interpolate rotation if present
          if (p.rotation !== undefined && p.lastRotation !== undefined) {
              drawRotation = p.lastRotation + (p.rotation - p.lastRotation) * easedProgress;
          }
      }
      
      // Draw at the calculated position (either actual or interpolated)
      _drawSingleSeasonParticle(p, drawX, drawY, drawRotation);
   }
   pop(); // Restore drawing styles

   // --- Update State (ONLY when updating positions AND state actually changed) ---
   if (updatePositions && stateNeedsUpdate && updatedParticles.length !== particles.length) {
      updateState('seasonParticles', updatedParticles);
   }

   // Optionally draw non-particle effects like summer rays
   // Make these respect performance settings as well
   if (state.seasonalEffects?.type === "summer" && performOp) {
      _drawSummerLightRays();
   }
}

/** Internal helper to draw a single seasonal particle based on its type. */
function _drawSingleSeasonParticle(p, drawX, drawY, drawRotation) {
    push();
    // Use provided drawing coordinates if supplied, otherwise use the particle's values
    const currentX = drawX !== undefined ? drawX : p.x;
    const currentY = drawY !== undefined ? drawY : p.y;

    translate(currentX, currentY); // Translate is always needed

    // --- Apply rotation ONLY if needed by the shape ---
    const needsRotation = (p.type === 'snowflake' || p.type === 'leaf');
    if (needsRotation) {
        const currentRotation = drawRotation !== undefined ? drawRotation : p.rotation;
        if (currentRotation !== undefined) {
            rotate(currentRotation); // Apply rotation only for specific types
        }
    }
    // --- Petals and Dust DO NOT need rotation ---

    noStroke();
    const alpha = p.alpha || 200; // Use particle alpha or default

    switch (p.type) {
        case "snowflake":
            fill(p.color[0], p.color[1], p.color[2], alpha * 0.8);
            // Simple snowflake shape (e.g., intersecting lines or custom shape)
            stroke(p.color[0], p.color[1], p.color[2], alpha); strokeWeight(1);
            for(let a=0; a<3; a++) { line(0, -p.size/2, 0, p.size/2); rotate(PI/3); }
            break;
        case "leaf":
            fill(p.color[0], p.color[1], p.color[2], alpha * 0.9);
            // Simple leaf shape using bezier curves
            beginShape();
            vertex(0, -p.size * 0.8);
            bezierVertex(p.size * 0.5, -p.size * 0.4, p.size * 0.3, p.size * 0.4, 0, p.size * 0.8);
            bezierVertex(-p.size * 0.3, p.size * 0.4, -p.size * 0.5, -p.size * 0.4, 0, -p.size * 0.8);
            endShape(CLOSE);
            break;
        case "petal": // Rotation is skipped before the switch for petals
            fill(p.color[0], p.color[1], p.color[2], alpha * 0.7);
            ellipse(0, 0, p.size * 0.8, p.size * 1.2); // Petal shape drawn without prior rotation
            break;
        case "dust": // Rotation is skipped before the switch for dust
            fill(p.color[0], p.color[1], p.color[2], alpha);
            ellipse(0, 0, p.size, p.size); // Simple circle for dust
            break;
    }
    pop();
}

/** Internal helper to draw summer light rays effect. */
function _drawSummerLightRays() {
    push();
    // Use ADD blend mode for light effect, but carefully
    // blendMode(ADD); // Can cause over-brightening, use with low alpha
    noStroke();
    const rayCount = 5;
    const rayColor = color(255, 255, 200); // Warm light yellow

    for (let i = 0; i < rayCount; i++) {
        const rayX = width * (0.1 + i * 0.8 / (rayCount - 1)); // Spread rays across top
        const rayStartY = -50;
        const rayEndY = height;
        const rayStartWidth = random(width * 0.05, width * 0.15);
        const rayEndWidth = rayStartWidth * random(1.5, 2.5);

        // Draw gradient quad for the ray
        for(let y=rayStartY; y<rayEndY; y+=5) {
            const t = map(y, rayStartY, rayEndY, 0, 1);
            const currentWidth = lerp(rayStartWidth, rayEndWidth, t*t); // Flare out towards bottom
            const alpha = map(t, 0, 1, 20, 0); // Fade out towards bottom
            rayColor.setAlpha(alpha);
            fill(rayColor);
            // Draw small segment of the ray
            rect(rayX - currentWidth/2, y, currentWidth, 5);
        }
    }
    // blendMode(BLEND); // Reset blend mode
    pop();
}


// --- Exports ---
window.applySeasonalEffects = applySeasonalEffects;
window.setupSeasonParticles = setupSeasonParticles; // Export if manual setup needed
window.updateAndDrawSeasonEffects = updateAndDrawSeasonEffects;

// --- END OF FILE src/effects/seasonal.js ---