// --- START OF FILE src/rendering/bufferManager.js ---

/**
 * Buffer Management for the Mound Mascot project.
 * Handles creation, caching, and reuse of off-screen graphics buffers
 * for performance optimization of backgrounds, textures, and effects.
 */

// --- Private Module Variables ---
let _buffers = {}; // Dictionary to store named p5.Graphics buffers
let _bufferGenerationTimes = {}; // Timestamps for buffer regeneration checks

// --- Initialization and Reset ---

/**
 * Initializes the buffer manager. Clears any existing buffers.
 */
function initBufferManager() {
  console.log("Initializing Buffer Manager...");
  resetBuffers(); // Start with a clean slate
}

/**
 * Clears all stored buffers and resets generation timestamps.
 * Useful on resize or significant state changes requiring regeneration.
 */
function resetBuffers() {
  console.log("Resetting all graphics buffers...");
  // Safely remove and clear references to old buffers
  for (const name in _buffers) {
    if (_buffers[name] && typeof _buffers[name].remove === 'function') {
      try {
        _buffers[name].remove(); // p5.js function to free buffer memory
      } catch (e) {
        console.warn(`Error removing buffer '${name}':`, e);
      }
    }
  }
  _buffers = {}; // Reset buffer storage
  _bufferGenerationTimes = {}; // Reset timestamps

  // Also clean up all cached textures
  const textureCacheNames = ['_noiseTextures', '_dotTextures', '_starTextures', '_gridTextures'];
  
  textureCacheNames.forEach(cacheName => {
    if (window[cacheName]) {
      // Safely remove each cached texture
      for (const key in window[cacheName]) {
        try {
          if (window[cacheName][key] && typeof window[cacheName][key].remove === 'function') {
            window[cacheName][key].remove();
          }
        } catch (e) {
          console.warn(`Error removing cached texture '${key}' from ${cacheName}:`, e);
        }
      }
      window[cacheName] = {}; // Clear the cache
    }
  });
  
  // Also clear generation timestamp tracking
  window._lastNoiseTextureTime = {};
  
  console.log("All cached textures cleared.");

  // Update state flag if relevant (e.g., textures need regeneration)
  if (typeof updateState === 'function') {
    updateState('texturesGenerated', false);
  }
}

// --- Core Buffer Management ---

/**
 * Retrieves a buffer by name. Creates or regenerates it if necessary.
 * @param {string} name - The unique name for the buffer (e.g., 'background', 'moundTexture').
 * @param {Function} generatorFn - A function that takes the buffer as an argument and draws its content.
 *                                Example: (buffer) => { buffer.background(255); buffer.fill(0); buffer.ellipse... }
 * @param {number} [expiryTime=0] - Time in milliseconds after which the buffer is considered expired and needs regeneration. 0 means never expires unless forced.
 * @param {boolean} [forceRegenerate=false] - If true, forces regeneration even if the buffer exists and hasn't expired.
 * @returns {p5.Graphics | null} The requested p5.Graphics buffer, or null if creation fails.
 */
function getBuffer(name, generatorFn, expiryTime = 0, forceRegenerate = false) {
  // Ensure p5 context is available
  if (typeof createGraphics !== 'function' || typeof millis !== 'function' || typeof width === 'undefined') {
      console.error("BufferManager: p5.js context not available (createGraphics, millis, width).");
      return null;
  }

  const currentTime = millis();
  const bufferExists = _buffers[name] !== null && _buffers[name] !== undefined;
  let bufferExpired = false;

  if (expiryTime > 0 && bufferExists) {
    bufferExpired = (currentTime - (_bufferGenerationTimes[name] || 0)) > expiryTime;
  }

  // Determine if regeneration is needed
  const needsRegeneration = !bufferExists || forceRegenerate || bufferExpired;

  if (needsRegeneration) {
    // console.log(`Regenerating buffer: ${name} (Exists: ${bufferExists}, Force: ${forceRegenerate}, Expired: ${bufferExpired})`);

    // Create buffer if it doesn't exist or if size changed (might happen on resize before reset)
    if (!bufferExists || _buffers[name].width !== width || _buffers[name].height !== height) {
        if (bufferExists) _buffers[name].remove(); // Remove old one if size changed
        _buffers[name] = createGraphics(width, height);
        if (!_buffers[name]) {
            console.error(`Failed to create graphics buffer: ${name}`);
            return null;
        }
    }

    const buffer = _buffers[name];

    // Prepare buffer for drawing
    buffer.push(); // Isolate styles and transformations
    buffer.clear(); // Ensure buffer is transparent before drawing

    // Execute the generator function to draw content onto the buffer
    try {
      generatorFn(buffer);
    } catch (error) {
      logError(`Buffer Generation (${name})`, error); // Use global error logger
      // Optionally draw an error state onto the buffer
      buffer.background(255, 0, 0, 50);
      buffer.fill(255); buffer.textAlign(CENTER, CENTER); buffer.text(`Error generating ${name}`, buffer.width / 2, buffer.height / 2);
    }

    buffer.pop(); // Restore previous buffer state

    // Update generation timestamp
    _bufferGenerationTimes[name] = currentTime;
  }

  return _buffers[name];
}

// --- Specific Buffer Generators ---

/**
 * Gets or generates the static background buffer.
 * Uses the drawBackground function from backgroundManager.js.
 * @returns {p5.Graphics | null} The background buffer.
 */
function generateBackgroundBuffer() {
  const state = getState(); // Assumes getState is available globally
  if (!state || !state.backgroundType || !state.palette) return null;

  const expiry = 0; // No expiry needed, regeneration controlled by caller
  const forceRegenerate = true; // --- FORCE REGENERATION --- Always redraw when this function is called

  return getBuffer('background', (buffer) => {
    // Call the unified background drawing function, targeting the buffer
    if (typeof drawBackground === 'function') {
      drawBackground(state.backgroundType, state.palette, buffer);
    } else {
       console.error("drawBackground function not found for buffer generation.");
       buffer.background(200); // Fallback
    }
  }, expiry, forceRegenerate);
}

/**
 * Gets or generates the mound texture buffer.
 * Uses drawing functions from mound.js and effects.js.
 * @returns {p5.Graphics | null} The mound texture buffer.
 */
function generateMoundTextureBuffer() {
  const state = getState(); // Assumes getState is available globally
  if (!state || !state.moundVertices || !state.palette || state.moundVertices.length < 3) {
     // console.warn("Cannot generate mound texture buffer: Required state missing.");
     return null; // Not ready yet
  }

  const expiry = 0; // No expiry needed, regeneration controlled by caller
  const forceRegenerate = true; // --- FORCE REGENERATION --- Always redraw when this function is called

  const buffer = getBuffer('moundTexture', (buffer) => {
    // --- DEBUG LOGGING --- Check state at regeneration time
    const regenState = window.getState(); // Get fresh state
    console.log(`[Regen MoundTexture] Palette Mound Color: ${JSON.stringify(regenState.palette?.mound)}, Pattern Type: ${regenState.patternType}, Has Pattern: ${regenState.hasPattern}`);
    // --- END DEBUG LOGGING ---
 
    // Draw the base mound shape first
    // Ensure palette color is up-to-date
    const currentPalette = window.getState().palette; // Use fresh state here too
    buffer.fill(currentPalette.mound[0], currentPalette.mound[1], currentPalette.mound[2]);
    buffer.noStroke();
    buffer.beginShape();
    for (let i = 0; i < state.moundVertices.length; i++) {
      buffer.vertex(state.moundVertices[i].x, state.moundVertices[i].y);
    }
    buffer.endShape(buffer.CLOSE);

    // Apply texture based on palette (function should be in rendering/mound.js or similar)
    if (typeof applyPaletteTexture === 'function') {
      applyPaletteTexture(buffer); // Pass buffer as target
    } else {
        console.warn("applyPaletteTexture function not found for buffer generation.");
    }

    // Apply pattern if present (function should be in rendering/mound.js or similar)
    if (state.hasPattern && typeof drawMoundPattern === 'function') {
      drawMoundPattern(buffer); // Pass buffer as target
    }

    // Mark textures as generated if this completes successfully
    if (typeof window.updateState === 'function') {
      window.updateState('texturesGenerated', true);
    }

  }, expiry, forceRegenerate);

  return buffer;
}

/**
 * Gets or generates the glow effect buffer. Regenerates frequently for animation.
 * Uses drawing function from effects.js.
 * @returns {p5.Graphics | null} The glow buffer.
 */
function generateGlowBuffer() {
  const state = getState(); // Assumes getState is available globally
  if (!state || !state.hasGlow || state.moundVertices.length < 3) return null;

  // Glow needs to regenerate often for smooth pulsing/animation effect
  // but not so fast that it causes jumpy animations
  const expiry = 100; // ~10 FPS update rate, more stable than 33ms

  const buffer = getBuffer('glow', (buffer) => {
    // Call the glow drawing function (should be in rendering/effects.js)
    if (typeof drawMoundGlow === 'function') {
      drawMoundGlow(buffer); // Pass buffer as target
    } else {
        console.warn("drawMoundGlow function not found for buffer generation.");
    }
  }, expiry);

  // Update state with reference (optional)
  // if (typeof updateState === 'function') updateState('glowBuffer', buffer);

  return buffer;
}

/**
 * Gets or generates the shimmer effect buffer. Regenerates for animation.
 * Uses drawing function from effects.js.
 * @returns {p5.Graphics | null} The shimmer buffer.
 */
function generateShimmerBuffer() {
  const state = getState(); // Assumes getState is available globally
  // Shimmer is linked to isShiny trait
  if (!state || !state.isShiny || state.moundVertices.length < 3) return null;

  // Shimmer needs frequent updates for animation
  const expiry = 100; // Update ~10 times per second

  const buffer = getBuffer('shimmer', (buffer) => {
    // Call the shimmer drawing function (should be in rendering/effects.js)
    if (typeof drawShimmerEffect === 'function') {
      drawShimmerEffect(buffer); // Pass buffer as target
    } else {
        console.warn("drawShimmerEffect function not found for buffer generation.");
    }
  }, expiry);

   // Update state with reference (optional)
   // if (typeof updateState === 'function') updateState('shimmerBuffer', buffer);

  return buffer;
}


// --- Event Handling ---

/**
 * Handles window resize events by resetting all buffers.
 */
function resizeBuffers() {
  console.log("Window resized, resetting buffers.");
  resetBuffers();
}

// --- Exports ---
window.initBufferManager = initBufferManager;
window.resetBuffers = resetBuffers;
window.getBuffer = getBuffer; // Expose core function if needed externally
window.generateBackgroundBuffer = generateBackgroundBuffer;
window.generateMoundTextureBuffer = generateMoundTextureBuffer;
window.generateGlowBuffer = generateGlowBuffer;
window.generateShimmerBuffer = generateShimmerBuffer;
window.resizeBuffers = resizeBuffers; // Make available for windowResized handler

// --- END OF FILE src/rendering/bufferManager.js ---