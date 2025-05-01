// --- START OF FILE src/rendering/effects.js ---

/**
 * Special visual effect rendering functions for the Mound Mascot project.
 * Handles drawing glow, shimmer, and cursed effects.
 */

/**
 * Draws a shimmer/sparkle effect on the mound area.
 * @param {p5.Graphics | p5.Renderer} [target=window] - The buffer or canvas to draw onto.
 */
function drawShimmerEffect(target = window) {
  const state = getState();
  if (!state || !state.isShiny || state.moundVertices.length < 3) return; // isShiny enables shimmer

  // Check performance level to adapt effect intensity
  const detailLevel = typeof getDetailLevel === 'function' ? getDetailLevel("effects") : { multiplier: 1.0 };
  const shimmerCount = Math.max(1, Math.floor(5 * detailLevel.multiplier)); // Adapt particle count

  target.push();
  target.noStroke();

  // Calculate bounding box once for efficiency
  const boundingBox = calculateBoundingBox(state.moundVertices);
  if (!boundingBox) return; // Exit if calculation failed

  for (let i = 0; i < shimmerCount; i++) {
    // Generate random position within the bounding box for efficiency
    const x = target.random(boundingBox.minX, boundingBox.maxX);
    const y = target.random(state.apexY + 20, boundingBox.maxY - 20); // Avoid edges

    // Check if the point is actually inside the mound polygon
    if (pointInPolygon(x, y, state.moundVertices)) {
      const shimmerSize = target.random(2, 5);
      const shimmerAlpha = target.random(120, 180);

      // Base sparkle (white/yellowish)
      target.fill(255, 255, 220, shimmerAlpha);
      target.ellipse(x, y, shimmerSize, shimmerSize);

      // Subtle glow around sparkle
      target.fill(255, 255, 220, shimmerAlpha * 0.3);
      target.ellipse(x, y, shimmerSize * 1.8, shimmerSize * 1.8);
    }
  }
  target.pop();
}

/**
 * Draws a glow effect around the mound shape.
 * @param {p5.Graphics | p5.Renderer} [target=window] - The buffer or canvas to draw onto.
 */
function drawMoundGlow(target = window) {
  const state = getState();
  if (!state || !state.hasGlow || state.moundVertices.length < 3 || !state.palette) return;

  target.push();
  target.noStroke();

  // --- Determine Glow Color ---
  let baseGlowColor;
  const paletteName = state.palette.name;
  const moundColor = state.palette.mound;

  if (state.isCursed) {
    baseGlowColor = target.color(180, 50, 180); // Dark Purple/Magenta for cursed
  } else if (paletteName === "golden") {
    baseGlowColor = target.color(255, 220, 80); // Bright Gold
  } else if (paletteName === "moonlight" || paletteName === "twilight") {
    baseGlowColor = target.color(140, 180, 255); // Soft Blue
  } else if (paletteName === "forest" || paletteName === "mint") {
     baseGlowColor = target.color(150, 255, 200); // Soft Green
  } else {
    // Default: Brighter, slightly saturated version of mound color
    baseGlowColor = target.color(
      clamp(moundColor[0] + 60, 0, 255),
      clamp(moundColor[1] + 60, 0, 255),
      clamp(moundColor[2] + 60, 0, 255)
    );
  }

  // --- Calculate Glow Parameters ---
  // Adapt number of layers based on performance
  const detailLevel = typeof getDetailLevel === 'function' ? getDetailLevel("effects") : { multiplier: 1.0 };
  const layerCount = Math.max(3, Math.floor(8 * detailLevel.multiplier)); // 3-8 layers
  const maxGlowSize = (target.width + target.height) * 0.03 * detailLevel.multiplier; // Adaptive max size

  // --- Draw Glow Layers ---
  // Draw multiple layers expanding outwards with decreasing opacity
  for (let i = layerCount; i > 0; i--) {
    const ratio = i / layerCount;
    const currentGlowSize = maxGlowSize * (1 - ratio * 0.7); // Non-linear expansion
    const alpha = target.map(ratio, 1, 0, 5, 30); // Lower alpha range for subtlety

    baseGlowColor.setAlpha(alpha);
    target.fill(baseGlowColor);

    // Draw the expanded shape
    target.beginShape();
    for (let j = 0; j < state.moundVertices.length; j++) {
      const v = state.moundVertices[j];
       // Use a simple outward push - calculating normals is too slow here
       // Approximate by pushing away from the visual center (state.moundPosition)
       const center = state.moundPosition || { x: target.width/2, y: target.height/2 };
       const dx = v.x - center.x;
       const dy = v.y - center.y;
       const dist = Math.sqrt(dx*dx + dy*dy);
       const normX = dist > 0 ? dx / dist : 0;
       const normY = dist > 0 ? dy / dist : 0;

      // Reduce expansion near the base
      const baseFactor = target.map(v.y, state.apexY, target.height, 1.0, 0.3); // Less glow at bottom

      target.vertex(v.x + normX * currentGlowSize * baseFactor, v.y + normY * currentGlowSize * baseFactor);
    }
    target.endShape(target.CLOSE);
  }

// --- Add Subtle Pulsing Highlight (Optional) ---
  // Add a soft pulse near the top-center for extra life
  // Use a slower sine function with consistent updates
  // Use time-based animation instead of frameCount for smoother transitions
  const time = typeof millis === 'function' ? millis() * 0.0003 : target.frameCount * 0.01;
  const pulseIntensity = (target.sin(time) * 0.3 + 0.7); // Gentler pulse (0.4 to 1.0 range)
  baseGlowColor.setAlpha(8 + pulseIntensity * 12); // Subtle alpha change (max 20)
  target.fill(baseGlowColor);
  target.ellipse(target.width/2, state.apexY + 50, target.width * 0.2, target.height * 0.1);


  target.pop();
}

/**
 * Draws a simplified glow effect, suitable for low performance or when buffers aren't used.
 * @param {p5.Graphics | p5.Renderer} [target=window] - The buffer or canvas to draw onto.
 */
function drawSimplifiedMoundGlow(target = window) {
   const state = getState();
   if (!state || !state.hasGlow || !state.palette) return;

   target.push();
   target.noStroke();

    let glowColor;
    if (state.isCursed) glowColor = target.color(180, 50, 180, 30);
    else if (state.palette.name === "golden") glowColor = target.color(255, 220, 80, 35);
    else glowColor = target.color(state.palette.mound[0], state.palette.mound[1], state.palette.mound[2], 30);

   // Draw one or two simple large ellipses behind the mound area
   const centerX = target.width / 2;
   const centerY = state.apexY + (target.height - state.apexY) / 2; // Center vertically on mound approx
   const glowWidth = target.width * 0.7;
   const glowHeight = (target.height - state.apexY) * 0.8;

   target.fill(glowColor);
   target.ellipse(centerX, centerY, glowWidth, glowHeight);
   // Optional second layer
   // glowColor.setAlpha(15);
   // target.fill(glowColor);
   // target.ellipse(centerX, centerY, glowWidth * 1.2, glowHeight * 1.2);

   target.pop();
}


/**
 * Draws visual effects specific to the 'cursed' trait.
 * @param {p5.Graphics | p5.Renderer} [target=window] - The buffer or canvas to draw onto.
 */
function drawCursedEffects(target = window) {
  const state = getState();
  if (!state || !state.isCursed || state.moundVertices.length < 3) return;

  target.push();

  // --- Dark Overlay ---
  // Add a semi-transparent dark purple overlay onto the mound shape
  target.fill(70, 0, 70, 35); // Dark purple, semi-transparent
  target.noStroke();
  target.beginShape();
  for (const v of state.moundVertices) {
    target.vertex(v.x, v.y);
  }
  target.endShape(target.CLOSE);

  // --- Floating Particles ---
  // Adapt particle count based on performance
  const detailLevel = typeof getDetailLevel === 'function' ? getDetailLevel("effects") : { multiplier: 1.0 };
  const particleCount = Math.max(5, Math.floor(25 * detailLevel.multiplier));

  const boundingBox = calculateBoundingBox(state.moundVertices);
  if (!boundingBox) { target.pop(); return; } // Need bounds

  target.fill(150, 0, 150, 120); // Brighter purple for particles
  target.noStroke();

  for (let i = 0; i < particleCount; i++) {
    // Use noise for particle positioning to make it look less random
    const noiseX = target.noise(target.frameCount * 0.005 + i * 10);
    const noiseY = target.noise(target.frameCount * 0.005 + i * 10 + 50);
    const x = target.map(noiseX, 0, 1, boundingBox.minX, boundingBox.maxX);
    const y = target.map(noiseY, 0, 1, state.apexY + 30, boundingBox.maxY - 30);

    // Check if inside mound
    if (pointInPolygon(x, y, state.moundVertices)) {
        const pulseSize = 2 + target.sin(target.frameCount * 0.08 + i * 0.5) * 1.5; // Slow pulse
        target.ellipse(x, y, pulseSize, pulseSize);
    }
  }

  target.pop();
}

// --- Helper Functions (potentially move to utils if needed elsewhere) ---

/**
 * Calculates the bounding box of a set of vertices.
 * @param {Array<object>} vertices - Array of vertex objects {x, y}.
 * @returns {object | null} Bounding box {minX, maxX, minY, maxY} or null if no vertices.
 */
function calculateBoundingBox(vertices) {
  if (!vertices || vertices.length === 0) return null;
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const v of vertices) {
    minX = Math.min(minX, v.x);
    maxX = Math.max(maxX, v.x);
    minY = Math.min(minY, v.y);
    maxY = Math.max(maxY, v.y);
  }
  // Add slight padding
  const padding = 5;
  return {
      minX: minX - padding,
      maxX: maxX + padding,
      minY: minY - padding,
      maxY: maxY + padding
  };
}


// --- Exports ---
window.drawShimmerEffect = drawShimmerEffect;
window.drawMoundGlow = drawMoundGlow;
window.drawSimplifiedMoundGlow = drawSimplifiedMoundGlow;
window.drawCursedEffects = drawCursedEffects;

// --- END OF FILE src/rendering/effects.js ---