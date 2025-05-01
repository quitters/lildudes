// --- START OF FILE src/rendering/backgroundManager.js ---

/**
 * Unified Background Rendering Manager for the Mound Mascot project.
 * Handles the selection and drawing of all background types.
 * Replaces all previous background-related files and fixes.
 */

// Global cache initialization
if (!window.textureCache) {
    window.textureCache = {};
    console.log("Initialized global texture cache");
}

// Helper function to get cached texture or null if not available
function getCachedTexture(textureType, key) {
    // Ensure there's a namespace for this texture type
    if (!window.textureCache[textureType]) window.textureCache[textureType] = {};
    
    return window.textureCache[textureType][key] || null;
}

// Helper function to store texture in cache
function cacheTexture(textureType, key, buffer, maxCacheSize = 10) {
    // Ensure cache exists
    if (!window.textureCache[textureType]) window.textureCache[textureType] = {};
    
    // Limit cache size
    const cache = window.textureCache[textureType];
    const keys = Object.keys(cache);
    
    // Remove oldest if we're at capacity
    if (keys.length >= maxCacheSize) {
        const oldestKey = keys[0]; // First key is oldest in JS object iteration
        if (cache[oldestKey] && typeof cache[oldestKey].remove === 'function') {
            cache[oldestKey].remove(); // Clean up p5.Graphics
        }
        delete cache[oldestKey];
        console.log(`Removed old ${textureType} texture from cache: ${oldestKey}`);
    }
    
    // Store the new texture
    cache[key] = buffer;
    console.log(`Cached ${textureType} texture: ${key}`);
    return buffer;
}

// --- Background Type Constants ---
// Use constants for clarity and maintainability
const BackgroundTypes = {
  GRADIENT: "gradient",
  HILLS: "hills",             // Enhanced rolling hills
  DOTS: "dots",               // Static dotted pattern
  NOISE: "noise",             // Static noise texture
  GRID: "grid",               // Static grid pattern
  STARS: "stars",             // Static starry night
  WAVES: "waves",             // Animated waves
  STRIPES: "stripes",           // Static striped pattern
  FOREST_HILLS: "forest_hills", // Enhanced detailed hills
  GEOMETRIC_PATTERNS: "geometric_patterns", // Added geometric patterns
  MISTY_MOUNTAINS: "misty_mountains",
  QUIET_LIBRARY: "quiet_library",
  ABSTRACT_BURST: "abstract_burst",
  SUNNY_DAY: "sunny_day",
  CANDY_LAND: "candy_land",
  STORMY_SKY: "stormy_sky",
  VOLCANIC_PLAIN: "volcanic_plain",
  UNDERWATER_WORLD: "underwater_world",
  TECH_GRID: "tech_grid",
  FOREST_CLEARING: "forest_clearing",
  CURSED_REALM: "cursed_realm",
  DESERT_OASIS: "desert_oasis"
  // Add any other final background types here
};
// Ensure this list matches the one used in generators/traits.js
const ALL_BACKGROUND_TYPES = Object.values(BackgroundTypes);


// --- Main Drawing Function ---

/**
 * Draws the specified background type to the canvas or a buffer.
 * @param {string} type - The type of background to draw (e.g., BackgroundTypes.GRADIENT).
 * @param {object} palette - The current color palette object.
 * @param {p5.Graphics | p5.Renderer} [target=window] - The target buffer or canvas to draw onto (defaults to main canvas).
 */
function drawBackground(type, palette, target = window) {
  // Validate input
  if (!type || !palette) {
    console.error("drawBackground: Missing type or palette information.");
    if (target && typeof target.background === 'function') {
        target.background(200); // Draw fallback gray
    }
    return;
  }
   // Ensure palette has needed properties, provide defaults if missing
   if (!palette.sky || !palette.skyLines || !palette.dots) {
       console.warn(`drawBackground: Palette '${palette.name}' might be missing properties (sky, skyLines, dots). Using defaults.`);
       palette.sky = palette.sky || [200, 220, 255];
       palette.skyLines = palette.skyLines || [180, 200, 230];
       palette.dots = palette.dots || { r: [220, 255], g: [220, 255], b: [220, 255] };
   }


  // Ensure target has p5 methods (could be canvas or buffer)
  if (typeof target.push !== 'function') {
     console.error("drawBackground: Invalid target provided.");
     return;
  }

  target.push(); // Isolate drawing transformations and styles

  // Base sky color (used by many backgrounds)
  const skyR = palette.sky[0];
  const skyG = palette.sky[1];
  const skyB = palette.sky[2];

  // Set random seed for static backgrounds to ensure reproducibility
  // NOTE: Seeding is done *inside* the helper functions now where 'type' is available
  const isStatic = ["dots", "noise", "grid", "stars", "stripes", "gradient", "hills", "forest_hills", "geometric_patterns", 
                   "misty_mountains", "quiet_library", "abstract_burst", "sunny_day", "candy_land", "stormy_sky", 
                   "volcanic_plain", "underwater_world", "tech_grid", "forest_clearing", "cursed_realm", "desert_oasis"].includes(type);
  // We still need to reset the seed *after* drawing is done for static types.

  // Call the specific drawing function
  switch (type) {
    case BackgroundTypes.GRADIENT:      _drawGradient(target, palette); break; // Simple gradient, likely no cache needed
    case BackgroundTypes.HILLS:         _drawHills(target, palette, type); break; // Pass type (for initial setup consistency)
    case BackgroundTypes.DOTS:          _drawDots(target, palette, type); break;
    case BackgroundTypes.NOISE:         _drawNoise(target, palette, type); break;
    case BackgroundTypes.GRID:          _drawGrid(target, palette); break; // Grid likely doesn't need type or cache
    case BackgroundTypes.STARS:         _drawStars(target, palette, type); break; 
    case BackgroundTypes.WAVES:         _drawWaves(target, palette, type); break; // Pass type (for initial setup consistency), draws base
    case BackgroundTypes.STRIPES:       _drawStripes(target, palette, type); break;
    case BackgroundTypes.FOREST_HILLS:  _drawForestHills(target, palette, type); break;
    case BackgroundTypes.GEOMETRIC_PATTERNS: target.image(_drawGeometricPatterns(target, palette, type), 0, 0); break; // Draw cached buffer
    case BackgroundTypes.MISTY_MOUNTAINS: target.image(_drawMistyMountains(target, palette, type), 0, 0); break;
    case BackgroundTypes.QUIET_LIBRARY: target.image(_drawQuietLibrary(target, palette, type), 0, 0); break;
    case BackgroundTypes.ABSTRACT_BURST: target.image(_drawAbstractBurst(target, palette, type), 0, 0); break;
    case BackgroundTypes.SUNNY_DAY: target.image(_drawSunnyDay(target, palette, type), 0, 0); break;
    case BackgroundTypes.CANDY_LAND: target.image(_drawCandyLand(target, palette, type), 0, 0); break;
    case BackgroundTypes.STORMY_SKY: _drawStormySky(target, palette, type); break;
    case BackgroundTypes.VOLCANIC_PLAIN: target.image(_drawVolcanicPlain(target, palette, type), 0, 0); break;
    case BackgroundTypes.UNDERWATER_WORLD: target.image(_drawUnderwaterWorld(target, palette, type), 0, 0); break;
    case BackgroundTypes.TECH_GRID: target.image(_drawTechGrid(target, palette, type), 0, 0); break;
    case BackgroundTypes.FOREST_CLEARING: target.image(_drawForestClearing(target, palette, type), 0, 0); break;
    case BackgroundTypes.CURSED_REALM: target.image(_drawCursedRealm(target, palette, type), 0, 0); break;
    case BackgroundTypes.DESERT_OASIS: target.image(_drawDesertOasis(target, palette, type), 0, 0); break;
    // Add cases for other implemented types here
    default:
      console.warn(`Unknown background type: "${type}". Falling back to gradient.`);
      _drawGradient(target, palette);
  }

  // Reset random/noise seeds if they were set for static backgrounds
  if (isStatic) {
    target.randomSeed(); // Reset to time-based seed
    target.noiseSeed();
  }

  target.pop(); // Restore previous drawing state
}

/**
 * Draws the animated portion of the waves background directly onto the main canvas.
 * Should be called each frame if the background type is WAVES.
 * @param {object} state - The current application state containing wave data and palette.
 * @param {p5.Graphics | p5.Renderer} [target=window] - The target to draw on.
 */
function drawWaveAnimation(state, target = window) {
    // Ensure p5 functions and state are available
    if (!target || typeof target.push !== 'function' || !state || !state.waves || !state.waves.length || !state.palette) {
         // Log warning only once to avoid spamming console
         if (!window._waveAnimWarned) {
             console.warn("Cannot draw wave animation: p5 context or state properties missing.");
             window._waveAnimWarned = true;
         }
         return;
    }

    const palette = state.palette;

    target.push();
    target.noFill();
    target.strokeWeight(1.5);

    // Determine wave color
    let waveColor;
    // Use target.color here now
    if (palette.skyLines && palette.skyLines.length >= 3) {
        waveColor = target.color(palette.skyLines[0], palette.skyLines[1], palette.skyLines[2], 100);
    } else if (palette.name === "ocean") {
        waveColor = target.color(70, 130, 180, 100);
    } else {
        waveColor = target.color(200, 220, 240, 100); // Default
    }
    target.stroke(waveColor);

    // Draw animated waves based on stored data
    const frame = typeof frameCount !== 'undefined' ? frameCount : 0; // Use p5 frameCount
    for (const wave of state.waves) {
        target.beginShape();
        // Extend drawing slightly beyond edges for safety
        for (let x = -10; x < target.width + 10; x += 10) {
            // Add time-based animation using frameCount
             // Use target.sin, target.width here
            const y = wave.y + target.sin(x * wave.frequency + frame * wave.speed) * wave.amplitude;
            target.vertex(x, y);
        }
        target.endShape();
    }
    target.pop();
}

// --- Private Background Drawing Implementations ---
// These functions draw onto the provided target (canvas or buffer).

function _drawGradient(target, palette) {
  const skyColor = target.color(palette.sky[0], palette.sky[1], palette.sky[2]);
  const bottomColor = target.color(
    Math.max(0, palette.sky[0] - 30),
    Math.max(0, palette.sky[1] - 20),
    Math.max(0, palette.sky[2] - 10)
  );

  target.noStroke();
  // Draw gradient using rectangles for full coverage
  for (let y = 0; y < target.height; y++) {
    const inter = y / target.height;
    const c = target.lerpColor(skyColor, bottomColor, inter);
    target.fill(c);
    target.rect(0, y, target.width, 1);
  }
}

// Added 'type' parameter
function _drawHills(target, palette, type) {
    // Use the same consistent seed for hills rendering
    const seed = (type + palette.name).split("").reduce((acc, char) => (acc * 31 + char.charCodeAt(0)) | 0, 0);
    target.randomSeed(seed);
    target.noiseSeed(seed);

    // Create a sky gradient
    _drawGradient(target, { sky: palette.sky }); // Draw base gradient first

    // Add subtle clouds (static)
    target.fill(255, 255, 255, 30);
    target.noStroke();
    for (let i = 0; i < 5; i++) {
        const cloudX = target.width * (0.1 + target.random() * 0.8);
        const cloudY = target.height * (0.15 + target.random() * 0.2);
        const cloudSize = target.width * (0.1 + target.random() * 0.2);
        for (let j = 0; j < 5; j++) {
            const offsetX = target.random(-cloudSize * 0.5, cloudSize * 0.5);
            const offsetY = target.random(-cloudSize * 0.2, cloudSize * 0.2);
            target.ellipse(cloudX + offsetX, cloudY + offsetY, cloudSize * target.random(0.6, 1.0), cloudSize * target.random(0.4, 0.7));
        }
    }

    // Define hill colors based on palette.sky, getting progressively darker
    const hillColors = [
        target.color(Math.max(0, palette.sky[0] - 35), Math.max(0, palette.sky[1] - 25), Math.max(0, palette.sky[2] - 15)), // Distant
        target.color(Math.max(0, palette.sky[0] - 50), Math.max(0, palette.sky[1] - 30), Math.max(0, palette.sky[2] - 20)), // Mid
        target.color(Math.max(0, palette.sky[0] - 60), Math.max(0, palette.sky[1] - 35), Math.max(0, palette.sky[2] - 25))  // Foreground
    ];

    // Define hill parameters (back to front)
    const hillLayers = [
        { yBase: target.height * 0.7, amplitude: target.height * 0.06, frequency: 0.003, noiseOffset: 0 },
        { yBase: target.height * 0.75, amplitude: target.height * 0.09, frequency: 0.005, noiseOffset: 400 },
        { yBase: target.height * 0.82, amplitude: target.height * 0.13, frequency: 0.008, noiseOffset: 800 }
    ];

    target.noStroke();
    // Draw hills from back to front
    for (let i = 0; i < hillLayers.length; i++) {
        const layer = hillLayers[i];
        target.fill(hillColors[i]);

        target.beginShape();
        target.vertex(0, target.height); // Bottom left
        target.vertex(0, layer.yBase);   // Top left edge

        // Generate hill curve using noise
        const detail = target.width / 15; // Number of segments
        for (let x = 0; x <= target.width; x += detail) {
            const noiseVal = target.noise(x * layer.frequency, layer.noiseOffset);
            const y = layer.yBase - layer.amplitude * noiseVal;
            target.vertex(x, y);
        }

        target.vertex(target.width, layer.yBase); // Top right edge
        target.vertex(target.width, target.height); // Bottom right
        target.endShape(target.CLOSE);
    }
    // Note: Seed is reset outside this function by drawBackground
}

// Added 'type' parameter
function _drawDots(target, palette, type) {
  // Cache key for dot textures
  const cacheKey = `dots_${type}_${palette.name}_${target.width}x${target.height}`;
  
  // Check cache state
  if (!window._dotTextures) {
      window._dotTextures = {};
      console.log("Initialized dot texture cache");
  }
  
  // Use cached dot texture if available
  if (window._dotTextures[cacheKey]) {
      console.log(`Using cached dot texture for ${palette.name}`);
      target.image(window._dotTextures[cacheKey], 0, 0);
      return;
  }
  
  // Use seed based on type for consistency
  const seed = (type + palette.name).split("").reduce((acc, char) => (acc * 31 + char.charCodeAt(0)) | 0, 0);
  
  // Create a buffer for dot texture
  let dotBuffer;
  const isTargetBuffer = typeof target.width === 'number' && typeof target.canvas !== 'undefined';
  
  if (isTargetBuffer) {
      dotBuffer = target; // Use target directly if it's already a buffer
      dotBuffer.randomSeed(seed);
      dotBuffer.background(palette.sky[0], palette.sky[1], palette.sky[2]);
  } else {
      // Create a new buffer for dots
      dotBuffer = createGraphics(target.width, target.height);
      dotBuffer.randomSeed(seed);
      dotBuffer.background(palette.sky[0], palette.sky[1], palette.sky[2]);
  }

  dotBuffer.noStroke();

  // Use palette.dots color range if available, otherwise fallback
  const dotColorR = palette.dots?.r || [220, 255];
  const dotColorG = palette.dots?.g || [220, 255];
  const dotColorB = palette.dots?.b || [220, 255];

  const spacing = dotBuffer.width / 25; // Adjust density
  for (let x = spacing / 2; x < dotBuffer.width; x += spacing) {
    for (let y = spacing / 2; y < dotBuffer.height; y += spacing) {
      // Use seeded random for consistent position offset and opacity
      const offsetX = dotBuffer.random(-spacing / 4, spacing / 4);
      const offsetY = dotBuffer.random(-spacing / 4, spacing / 4);
      const opacity = dotBuffer.random(40, 90);
      const dotSize = dotBuffer.random(spacing * 0.1, spacing * 0.3);
      const r = dotBuffer.random(dotColorR[0], dotColorR[1]);
      const g = dotBuffer.random(dotColorG[0], dotColorG[1]);
      const b = dotBuffer.random(dotColorB[0], dotColorB[1]);

      dotBuffer.fill(r, g, b, opacity);
      dotBuffer.ellipse(x + offsetX, y + offsetY, dotSize, dotSize);
    }
  }
  
  // If we created a new buffer, cache it and draw it to the target
  if (!isTargetBuffer) {
      // Store in cache (limited to 10 textures to prevent memory issues)
      const cacheKeys = Object.keys(window._dotTextures);
      if (cacheKeys.length >= 10) {
          // Remove oldest texture if cache is full
          const oldestKey = cacheKeys[0];
          if (window._dotTextures[oldestKey] && 
              typeof window._dotTextures[oldestKey].remove === 'function') {
              window._dotTextures[oldestKey].remove();
          }
          delete window._dotTextures[oldestKey];
      }
      
      // Store the new texture in the cache
      window._dotTextures[cacheKey] = dotBuffer;
      console.log(`Cached dot texture with key: ${cacheKey}`);
      
      // Draw the buffer to the target
      target.image(dotBuffer, 0, 0);
  }
  // Note: Seed is reset outside this function by drawBackground
}

// SIMPLIFIED NOISE FUNCTION - Fixed caching issues
function _drawNoise(target, palette, type) {
    // Cache key for noise textures
    const cacheKey = `noise_${type}_${palette.name}_${target.width}x${target.height}`;
    
    // Check cache state
    if (!window._noiseTextures) {
        window._noiseTextures = {};
        console.log("Initialized noise texture cache");
    }
    
    // Use cached noise texture if available
    if (window._noiseTextures[cacheKey]) {
        // Just draw the cached texture and return
        console.log(`Using cached noise texture for ${palette.name}`);
        target.image(window._noiseTextures[cacheKey], 0, 0);
        return;
    }
    
    // Track when textures were last generated to prevent rapid regeneration
if (!window._lastNoiseTextureTime) {
    window._lastNoiseTextureTime = {};
}

// Add time check - prevent regenerating the same texture multiple times in quick succession
const currentTime = typeof millis === 'function' ? millis() : Date.now();
const lastGenTime = window._lastNoiseTextureTime[cacheKey] || 0;
const timeSinceLastGen = currentTime - lastGenTime;

// If we recently generated this texture (within 2 seconds), return the dummy
if (timeSinceLastGen < 2000) {
    console.log(`Texture ${cacheKey} was just generated ${timeSinceLastGen}ms ago, skipping duplicate generation`);
    // Draw a simple colored rectangle instead as a temporary substitute
    target.noStroke();
    target.fill(palette.sky[0], palette.sky[1], palette.sky[2]);
    target.rect(0, 0, target.width, target.height);
    return;
}

// We'll generate a new texture now

    // Use seed based on type for consistency
    const seed = (type + palette.name).split("").reduce((acc, char) => (acc * 31 + char.charCodeAt(0)) | 0, 0);
    
    // Create a buffer for this noise texture
    let noiseBuffer;
    
    // If we're drawing to the main canvas, create a new buffer
    // If we're already drawing to a buffer, use it directly
    const isTargetBuffer = typeof target.width === 'number' && typeof target.canvas !== 'undefined';
    
    if (isTargetBuffer) {
        noiseBuffer = target; // Use target directly if it's already a buffer
        noiseBuffer.noiseSeed(seed);
        noiseBuffer.background(palette.sky[0], palette.sky[1], palette.sky[2]);
    } else {
        // Create a new buffer for noise with willReadFrequently attribute
        noiseBuffer = createGraphics(target.width, target.height);
        // Add the willReadFrequently attribute to the canvas
        if (noiseBuffer.canvas && noiseBuffer.canvas.getContext) {
            // Get the rendering context and set the attribute
            const ctx = noiseBuffer.canvas.getContext('2d', { willReadFrequently: true });
            // No need to do anything with ctx, the attribute is now set
        }
        noiseBuffer.noiseSeed(seed);
        noiseBuffer.background(palette.sky[0], palette.sky[1], palette.sky[2]);
    }

    // --- Noise Parameters ---
    const noiseScale = 0.05;
    const intensity = 25;

    // Performance level affects quality
    const detailLevel = typeof getDetailLevel === 'function' ? getDetailLevel("texture") : { stepSize: 8 };
    const step = Math.max(4, detailLevel.stepSize * 2);

    // Use pixel manipulation for better performance
    noiseBuffer.loadPixels();
    if (!noiseBuffer.pixels) {
        console.warn("Could not load pixels for noise texture, falling back to rect method");
        _drawNoiseFallback(noiseBuffer, palette, noiseScale, intensity, step);
        return;
    }

    const pixelDensity = noiseBuffer.pixelDensity() || 1;
    const d = pixelDensity; // Shorthand
    
    // Process pixels in larger blocks for better performance
    for (let y = 0; y < noiseBuffer.height; y += step) {
        for (let x = 0; x < noiseBuffer.width; x += step) {
            // Calculate noise value once per block
            const noiseVal = noiseBuffer.noise(x * noiseScale, y * noiseScale);
            const adjustment = map(noiseVal, 0, 1, -intensity, intensity);
            
            // Calculate adjusted color
            const r = clamp(palette.sky[0] + adjustment, 0, 255);
            const g = clamp(palette.sky[1] + adjustment, 0, 255);
            const b = clamp(palette.sky[2] + adjustment, 0, 255);
            
            // Fill entire block with this color
            for (let blockY = 0; blockY < step && y + blockY < noiseBuffer.height; blockY++) {
                for (let blockX = 0; blockX < step && x + blockX < noiseBuffer.width; blockX++) {
                    // Calculate index in the pixel array (accounting for pixel density)
                    for (let i = 0; i < d; i++) {
                        for (let j = 0; j < d; j++) {
                            const idx = 4 * ((y + blockY) * d + i) * noiseBuffer.width * d + ((x + blockX) * d + j) * 4;
                            noiseBuffer.pixels[idx] = r;
                            noiseBuffer.pixels[idx + 1] = g;
                            noiseBuffer.pixels[idx + 2] = b;
                            noiseBuffer.pixels[idx + 3] = 255; // Fully opaque
                        }
                    }
                }
            }
        }
    }
    
    noiseBuffer.updatePixels();
    
    // If we created a new buffer, cache it and draw it to the target
    if (!isTargetBuffer) {
        // Store in cache (limited to 10 textures to prevent memory issues)
        const cacheKeys = Object.keys(window._noiseTextures);
        if (cacheKeys.length >= 10) {
            // Remove oldest texture if cache is full
            const oldestKey = cacheKeys[0];
            if (window._noiseTextures[oldestKey] && 
                typeof window._noiseTextures[oldestKey].remove === 'function') {
                console.log(`Removing old cached texture: ${oldestKey}`);
                window._noiseTextures[oldestKey].remove();
            }
            delete window._noiseTextures[oldestKey];
        }
        
        // Store the new texture in the cache
        window._noiseTextures[cacheKey] = noiseBuffer;
        console.log(`Cached noise texture with key: ${cacheKey}`);
        
        // Draw the buffer to the target
        target.image(noiseBuffer, 0, 0);
    }
    // Note: Seed reset happens outside this function in drawBackground
}

// Fallback method using rectangles if pixel manipulation fails
function _drawNoiseFallback(target, palette, noiseScale, intensity, step) {
    target.noStroke();
    
    for (let y = 0; y < target.height; y += step) {
        for (let x = 0; x < target.width; x += step) {
            const noiseVal = target.noise(x * noiseScale, y * noiseScale);
            const adjustment = map(noiseVal, 0, 1, -intensity, intensity);
            
            const r = clamp(palette.sky[0] + adjustment, 0, 255);
            const g = clamp(palette.sky[1] + adjustment, 0, 255);
            const b = clamp(palette.sky[2] + adjustment, 0, 255);
            
            target.fill(r, g, b);
            target.rect(x, y, step, step);
        }
    }
}


function _drawGrid(target, palette) {
  target.background(palette.sky[0], palette.sky[1], palette.sky[2]);

  // Use palette.skyLines color if available, otherwise calculate contrast
  let lineColor;
   if (palette.skyLines && palette.skyLines.length === 3) {
      lineColor = target.color(palette.skyLines[0], palette.skyLines[1], palette.skyLines[2], 50); // More subtle alpha
   } else {
      const skyLuma = (palette.sky[0]*0.299 + palette.sky[1]*0.587 + palette.sky[2]*0.114) / 255;
      const lineBrightness = skyLuma > 0.5 ? 50 : 200; // Dark lines on light bg, light lines on dark
      lineColor = target.color(lineBrightness, lineBrightness, lineBrightness, 50);
   }

  target.stroke(lineColor);
  target.strokeWeight(1); // Thinner lines

  const gridSize = target.width / 20; // Consistent grid size
  // Extend lines slightly beyond canvas to avoid edge gaps
  for (let x = 0; x <= target.width + gridSize; x += gridSize) {
    target.line(x, -5, x, target.height + 5);
  }
  for (let y = 0; y <= target.height + gridSize; y += gridSize) {
    target.line(-5, y, target.width + 5, y);
  }
}

// Added 'type' parameter
function _drawStars(target, palette, type) {
  // Use seed based on type for consistency
  const seed = (type + palette.name).split("").reduce((acc, char) => (acc * 31 + char.charCodeAt(0)) | 0, 0);
  target.randomSeed(seed);

  // Darker background
  const bgR = Math.max(0, palette.sky[0] - 60);
  const bgG = Math.max(0, palette.sky[1] - 60);
  const bgB = Math.max(0, palette.sky[2] - 50); // Keep blue slightly higher
  target.background(bgR, bgG, bgB);

  target.noStroke();
  // Draw many small stars
  for (let i = 0; i < 250; i++) { // More stars
    const x = target.random(target.width);
    const y = target.random(target.height); // Full sky coverage
    const size = target.random(0.5, 2.5); // Range of sizes
    const brightness = target.random(150, 255);
    target.fill(brightness, brightness, brightness, target.random(100, 220)); // Vary brightness/alpha
    target.ellipse(x, y, size, size);
  }
  // Add a few larger "hero" stars with subtle glow
   for (let i = 0; i < 10; i++) {
       const x = target.random(target.width);
       const y = target.random(target.height * 0.8); // Keep them higher
       const size = target.random(3, 5);
       target.fill(255, 255, 255, 250);
       target.ellipse(x, y, size, size);
       // Simple glow
       target.fill(255, 255, 255, 50);
       target.ellipse(x, y, size * 2, size * 2);
   }
   // Note: Seed is reset outside this function by drawBackground
}

// Added 'type' parameter for consistent initial setup if needed
function _drawWaves(target, palette, type) {
  // Draw base gradient first
  _drawGradient(target, palette);

  // Determine wave color
  let waveColor;
  if (palette.skyLines && palette.skyLines.length === 3) {
     waveColor = target.color(palette.skyLines[0], palette.skyLines[1], palette.skyLines[2], 100);
  } else {
     waveColor = target.color(200, 220, 240, 100); // Default
  }

  // Store wave parameters in state for animation IF they don't exist
  // This ensures waves are consistent unless reset
  let stateWaves = getStateProperty('waves', []);
  if (!stateWaves || stateWaves.length === 0) {
      // Use seed based on type for consistent initial wave parameters
      const seed = (type + palette.name).split("").reduce((acc, char) => (acc * 31 + char.charCodeAt(0)) | 0, 0);
      target.randomSeed(seed); // Use temporary seeded random

      stateWaves = [];
      const waveCount = 5 + target.floor(target.random(4)); // 5-8 waves
      for (let i = 0; i < waveCount; i++) {
          stateWaves.push({
              y: target.map(i, 0, waveCount - 1, target.height * 0.3, target.height * 0.9), // Spread waves more
              amplitude: target.random(8, 18),
              frequency: target.random(0.008, 0.025), // Wider frequency range
              speed: target.random(0.005, 0.015) // Slower speeds for subtlety
          });
      }
      target.randomSeed(); // Reset random seed immediately
      updateState('waves', stateWaves); // Update state only if generated
  }


  // Draw initial static waves (animation is handled by drawWaveAnimation)
  target.stroke(waveColor);
  target.strokeWeight(1.5);
  target.noFill();
  for (const wave of stateWaves) {
    target.beginShape();
    for (let x = -10; x < target.width + 10; x += 10) {
        const y = wave.y + target.sin(x * wave.frequency) * wave.amplitude;
        target.vertex(x, y);
    }
    target.endShape();
  }
  // Note: Seed is reset outside this function by drawBackground if applicable (waves isn't purely static)
}

// Added 'type' parameter
function _drawStripes(target, palette, type) {
  // Use seed based on type for consistency
  const seed = (type + palette.name).split("").reduce((acc, char) => (acc * 31 + char.charCodeAt(0)) | 0, 0);
  target.randomSeed(seed);

  target.background(palette.sky[0], palette.sky[1], palette.sky[2]);

  // Determine stripe color (contrast with sky)
  let stripeColor;
   if (palette.skyLines && palette.skyLines.length === 3) {
      stripeColor = target.color(palette.skyLines[0], palette.skyLines[1], palette.skyLines[2], 40); // Subtle alpha
   } else {
      const skyLuma = (palette.sky[0]*0.299 + palette.sky[1]*0.587 + palette.sky[2]*0.114) / 255;
      const stripeBrightness = skyLuma > 0.5 ? 50 : 200;
      stripeColor = target.color(stripeBrightness, stripeBrightness, stripeBrightness, 40);
   }

  target.noStroke();
  target.fill(stripeColor);

  const isHorizontal = target.random() > 0.5; // Use seeded random
  const stripeWidth = target.width / target.random(25, 40); // Use seeded random
  const stripeSpacing = stripeWidth * target.random(1.2, 2.0); // Use seeded random

  if (isHorizontal) {
    for (let y = 0; y <= target.height + stripeSpacing; y += stripeSpacing) { // Extend drawing
      target.rect(-5, y, target.width + 10, stripeWidth); // Extend width
    }
  } else {
    for (let x = 0; x <= target.width + stripeSpacing; x += stripeSpacing) { // Extend drawing
      target.rect(x, -5, stripeWidth, target.height + 10); // Extend height
    }
  }
  // Note: Seed is reset outside this function by drawBackground
}

// Added 'type' parameter
function _drawForestHills(target, palette, type) {
    // Use the same consistent seed
    const seed = (type + palette.name).split("").reduce((acc, char) => (acc * 31 + char.charCodeAt(0)) | 0, 0);
    target.randomSeed(seed);
    target.noiseSeed(seed);

    // Sky gradient
    _drawGradient(target, { sky: palette.sky }); // Base gradient

    // Subtle sun glow
    target.noStroke();
    for (let i = 5; i > 0; i--) {
        target.fill(255, 240, 200, 5);
        target.ellipse(target.width * 0.7, target.height * 0.2, target.width * 0.5 * i, target.width * 0.5 * i);
    }

    // Distant bluish mountains/hills
    target.fill(Math.max(0, palette.sky[0] - 90), Math.min(255, palette.sky[1] - 20), Math.max(0, palette.sky[2] - 40), 220);
    target.beginShape();
    target.vertex(0, target.height * 0.6);
    for (let x = 0; x <= target.width; x += target.width / 20) {
        const mountainHeight = target.noise(x * 0.005) * target.height * 0.1;
        target.vertex(x, target.height * 0.6 - mountainHeight);
    }
    target.vertex(target.width, target.height * 0.6);
    target.vertex(target.width, target.height); // Close shape at bottom
    target.vertex(0, target.height);
    target.endShape(target.CLOSE);

    // Mid-distance forest layer (darker green)
    target.fill(Math.max(0, palette.sky[0] - 80), Math.min(255, palette.sky[1] + 10), Math.max(0, palette.sky[2] - 60));
    target.beginShape();
    target.vertex(0, target.height * 0.65);
    for (let x = 0; x <= target.width; x += target.width / 25) {
        const hillHeight = target.noise(x * 0.01 + 100) * target.height * 0.12;
        target.vertex(x, target.height * 0.65 - hillHeight);
    }
    target.vertex(target.width, target.height * 0.65);
    target.vertex(target.width, target.height);
    target.vertex(0, target.height);
    target.endShape(target.CLOSE);

     // Foreground hillside (lighter green)
    target.fill(Math.max(0, palette.sky[0] - 70), Math.min(255, palette.sky[1] + 30), Math.max(0, palette.sky[2] - 70));
    target.beginShape();
    target.vertex(0, target.height * 0.75);
    for (let x = 0; x <= target.width; x += target.width / 30) {
        const hillHeight = target.noise(x * 0.02 + 200) * target.height * 0.15;
        target.vertex(x, target.height * 0.75 - hillHeight);
    }
    target.vertex(target.width, target.height * 0.75);
    target.vertex(target.width, target.height);
    target.vertex(0, target.height);
    target.endShape(target.CLOSE);

    // Add simplified tree silhouettes (less detail for performance)
    const treeColor = target.color(Math.max(0, palette.sky[0] - 95), Math.min(255, palette.sky[1]), Math.max(0, palette.sky[2] - 70)); // Darker green
    target.fill(treeColor);
    target.noStroke();
    for (let i = 0; i < 50; i++) { // Fewer trees
        const x = target.random(target.width); // Use seeded random
        const yBase = target.map(target.noise(x * 0.01), 0, 1, target.height * 0.55, target.height * 0.68); // Get hill height at x

        // Only draw if tree base is on the mid-distance hill
        if (yBase < target.height * 0.65) {
            const treeHeight = target.random(target.height * 0.02, target.height * 0.06); // Smaller trees
            const treeWidth = treeHeight * target.random(0.4, 0.6);
            // Simple triangle for trees
            target.triangle(x, yBase - treeHeight, x - treeWidth, yBase, x + treeWidth, yBase);
        }
    }
    // Note: Seed is reset outside this function by drawBackground
}

// --- START: Refactored Geometric Patterns Function (with caching) ---
function _drawGeometricPatterns(target, palette, type) {
    const cacheKey = `${type}_${palette.name}_${target.width}x${target.height}`;
    let buffer = getCachedTexture('geometric', cacheKey);

    if (buffer) {
        // console.log(`Using cached geometric texture: ${cacheKey}`);
        return buffer;
    }

    // Create a new buffer if not cached
    // Use target's methods to create buffer if available (e.g., if target is p5 instance)
    if (typeof target.createGraphics !== 'function') {
        console.error("_drawGeometricPatterns: Target cannot create graphics buffer.");
        // Draw directly as fallback? Or return null?
        // For now, log error and return null/empty buffer if possible
        return null; 
    }
    buffer = target.createGraphics(target.width, target.height);
    if (!buffer) {
         console.error("_drawGeometricPatterns: Failed to create graphics buffer.");
         return null;
    }

    // --- Start drawing on the buffer --- 
    buffer.push(); // Isolate buffer drawing state

    const seed = $fx.rand() * 10000; // Use fxrand for seed
    buffer.randomSeed(seed);

    const defaultSkyColor = [200, 220, 255]; // Light blue fallback
    const defaultDotsColor = [220, 220, 220]; // Grey fallback
    const defaultSkyLinesColor = [180, 200, 230]; // Lighter blue fallback
    const defaultMoundFillColor = [120, 140, 100]; // Muted green fallback
    const randomBookColor = [buffer.random(50,150), buffer.random(50,100), buffer.random(30,80)];
    
    // Safely access palette properties with fallbacks
    const sky = palette.sky ?? defaultSkyColor;
    const dotsR = palette.dots?.r?.[0] ?? defaultDotsColor[0];
    const dotsG = palette.dots?.g?.[0] ?? defaultDotsColor[1];
    const dotsB = palette.dots?.b?.[0] ?? defaultDotsColor[2];
    const skyLines = palette.skyLines ?? defaultSkyLinesColor;
    const moundFill = palette.moundBody?.fill ?? defaultMoundFillColor;
    
    const bgColor = buffer.color(sky[0], sky[1], sky[2]);
    const patternColor1 = buffer.color(dotsR, dotsG, dotsB, 150); // Use safe values
    const patternColor2 = buffer.color(skyLines[0], skyLines[1], skyLines[2], 100); // Use safe value
    const bookColors = [
        buffer.color(dotsR, dotsG, dotsB), // Uses safe values
        buffer.color(skyLines[0], skyLines[1], skyLines[2]), // Uses safe value
        buffer.color(moundFill[0], moundFill[1], moundFill[2]), // Uses safe value
        buffer.color(randomBookColor[0], randomBookColor[1], randomBookColor[2])
    ];
    
    buffer.background(bgColor);
    
    // Determine pattern size
    const patternSize = buffer.width / buffer.random(10, 20); 
    const overlap = 0.7; 

    for (let y = 0; y < buffer.height + patternSize; y += patternSize * (1 - overlap)) {
        for (let x = 0; x < buffer.width + patternSize; x += patternSize * (1 - overlap)) {
            buffer.fill(buffer.random() > 0.5 ? patternColor1 : patternColor2);
            const diameter = patternSize * buffer.random(0.8, 1.2);
            buffer.ellipse(x + buffer.random(-patternSize * 0.1, patternSize * 0.1), 
                         y + buffer.random(-patternSize * 0.1, patternSize * 0.1),
                         diameter, 
                         diameter);
        }
    }
    
    buffer.pop(); // Restore buffer state (though likely not needed here)
    // --- End drawing on the buffer ---

    console.log(`Generated geometric pattern background with seed: ${seed}`);
    return cacheTexture('geometric', cacheKey, buffer);
}
// --- END: Refactored Geometric Patterns Function ---


// --- START: New Background Implementation Functions ---
// Helper function to check cache and create buffer (Refactored for reuse)
function getOrCreateBuffer(target, cacheType, cacheKey) {
    let buffer = getCachedTexture(cacheType, cacheKey);
    if (buffer) {
        return buffer; // Return cached buffer
    }

    // Create a new buffer if not cached
    if (typeof target.createGraphics !== 'function') {
        console.error(`Cannot create graphics buffer for ${cacheType}.`);
        return null; 
    }
    buffer = target.createGraphics(target.width, target.height);
    if (!buffer) {
         console.error(`Failed to create graphics buffer for ${cacheType}.`);
         return null;
    }
    console.log(`Created new buffer for ${cacheType}: ${cacheKey}`);
    return buffer; // Return new buffer (needs drawing and caching)
}

// 1. Misty Mountains
function _drawMistyMountains(target, palette, type) {
    const cacheKey = `${type}_${palette.name}_${target.width}x${target.height}`;
    const buffer = getOrCreateBuffer(target, type, cacheKey);
    // Check if buffer creation failed OR if it was retrieved from cache (meaning drawing is already done)
    if (!buffer || getCachedTexture(type, cacheKey)) return buffer; 

    const seed = $fx.rand() * 10000;
    buffer.randomSeed(seed);
    buffer.noiseSeed(seed+1);

    const defaultSkyColor = [200, 220, 255];
    const defaultSkyLinesColor = [180, 200, 230];

    const sky = palette.sky ?? defaultSkyColor;
    const skyLines = palette.skyLines ?? defaultSkyLinesColor;

    const skyColor1 = buffer.color(sky[0], sky[1]*0.9, sky[2]*0.7); // Bright, slightly yellow sky
    const skyColor2 = buffer.color(sky[0] * 0.9, sky[1] * 0.95, sky[2]); // Slightly lighter/yellower
    const mountainColor1 = buffer.color(skyLines[0], skyLines[1], skyLines[2], 180); // Use safe value
    const mountainColor2 = buffer.color(skyLines[0] * 0.8, skyLines[1] * 0.8, skyLines[2] * 0.9, 150); // Use safe value
    const mountainColor3 = buffer.color(skyLines[0] * 0.6, skyLines[1] * 0.6, skyLines[2] * 0.7, 120); // Use safe value

    buffer.background(skyColor1);
    buffer.noStroke();

    // Draw layers of mountains using noise
    const drawMountainLayer = (yOffset, maxHeight, noiseScale, color) => {
        buffer.fill(color);
        buffer.beginShape();
        buffer.vertex(0, buffer.height); // Bottom left
        buffer.vertex(0, yOffset);   // Top left edge

        // Generate mountain curve using noise
        const detail = buffer.width / 15; // Number of segments
        for (let x = 0; x <= buffer.width; x += detail) {
            let noiseVal = buffer.noise(x * noiseScale, yOffset * 0.1);
            let h = buffer.map(noiseVal, 0, 1, buffer.height - maxHeight, buffer.height - yOffset);
            buffer.vertex(x, h);
        }

        buffer.vertex(buffer.width, yOffset); // Top right edge
        buffer.vertex(buffer.width, buffer.height); // Bottom right
        buffer.endShape(buffer.CLOSE);
    };

    drawMountainLayer(buffer.height * 0.2, buffer.height * 0.6, 0.003, mountainColor3);
    drawMountainLayer(buffer.height * 0.1, buffer.height * 0.45, 0.004, mountainColor2);
    drawMountainLayer(0, buffer.height * 0.3, 0.005, mountainColor1);

    // Subtle mist overlay
    buffer.fill(skyColor1.levels[0], skyColor1.levels[1], skyColor1.levels[2], 30);
    buffer.rect(0, 0, buffer.width, buffer.height);

    return cacheTexture(type, cacheKey, buffer);
}

// 2. Quiet Library
function _drawQuietLibrary(target, palette, type) {
    const cacheKey = `${type}_${palette.name}_${target.width}x${target.height}`;
    const buffer = getOrCreateBuffer(target, type, cacheKey);
    if (!buffer || getCachedTexture(type, cacheKey)) return buffer; 

    const seed = $fx.rand() * 10000;
    buffer.randomSeed(seed);

    // Define fallback colors
    const defaultWallColor = [200, 190, 180]; // Beige-ish fallback
    const defaultShelfColor = [100, 80, 60]; // Dark brown fallback
    const defaultDotColor = [180, 180, 180]; // Grey fallback for dots
    const defaultSkyLinesColor = [150, 150, 170]; // Muted blue/grey fallback
    const defaultMoundFillColor = [120, 140, 100]; // Muted green fallback
    const defaultGroundColor = [90, 70, 50]; // Another brown fallback
    const randomBookColor = [buffer.random(50,150), buffer.random(50,100), buffer.random(30,80)];
    
    // Safely access palette properties with fallbacks
    const wall = palette.sky ?? defaultWallColor;
    const ground = palette.ground ?? defaultGroundColor;
    const dotsR = palette.dots?.r?.[0] ?? defaultDotColor[0];
    const dotsG = palette.dots?.g?.[0] ?? defaultDotColor[1];
    const dotsB = palette.dots?.b?.[0] ?? defaultDotColor[2];
    const skyLines = palette.skyLines ?? defaultSkyLinesColor;
    const moundFill = palette.moundBody?.fill ?? defaultMoundFillColor;
    
    const wallColor = buffer.color(wall[0] * 0.8, wall[1] * 0.8, wall[2] * 0.7);
    const shelfColor = buffer.color(ground[0] * 0.5, ground[1] * 0.5, ground[2] * 0.4);
    
    const bookColors = [
        buffer.color(dotsR, dotsG, dotsB), // Uses safe values
        buffer.color(skyLines[0], skyLines[1], skyLines[2]), // Uses safe value
        buffer.color(moundFill[0], moundFill[1], moundFill[2]), // Uses safe value
        buffer.color(ground[0], ground[1], ground[2]), // Uses safe value
        buffer.color(randomBookColor[0], randomBookColor[1], randomBookColor[2])
    ];
    
    buffer.background(wallColor);
    
    const shelfHeight = buffer.height / buffer.random(4, 7);
    const bookWidthMin = shelfHeight * 0.15;
    const bookWidthMax = shelfHeight * 0.4;
    const bookHeightVariance = shelfHeight * 0.1;
    
    for (let y = 0; y < buffer.height; y += shelfHeight) {
        // Draw shelf
        buffer.fill(shelfColor);
        buffer.rect(0, y + shelfHeight * 0.9, buffer.width, shelfHeight * 0.1);
        
        // Draw books
        let currentX = buffer.random(0, bookWidthMax * 0.5);
        while (currentX < buffer.width) {
            const bookW = buffer.random(bookWidthMin, bookWidthMax);
            const bookH = shelfHeight * 0.85 - buffer.random(-bookHeightVariance, bookHeightVariance);
            const bookY = y + shelfHeight * 0.9 - bookH;
            buffer.fill(bookColors[Math.floor(buffer.random() * bookColors.length)]);
            buffer.rect(currentX, bookY, bookW, bookH);
            currentX += bookW + buffer.random(2, 5); // Add gap
        }
    }
    
    return cacheTexture(type, cacheKey, buffer);
}

// 3. Abstract Burst
function _drawAbstractBurst(target, palette, type) {
    const cacheKey = `${type}_${palette.name}_${target.width}x${target.height}`;
    const buffer = getOrCreateBuffer(target, type, cacheKey);
    if (!buffer || getCachedTexture(type, cacheKey)) return buffer; 

    const seed = $fx.rand() * 10000;
    buffer.randomSeed(seed);

    const defaultSkyColor = [200, 220, 255];
    const defaultDotsColor = [220, 220, 220];
    const defaultSkyLinesColor = [180, 200, 230];
    const defaultMoundFillColor = [120, 140, 100];

    const sky = palette.sky ?? defaultSkyColor;
    const dotsR = palette.dots?.r?.[0] ?? defaultDotsColor[0];
    const dotsG = palette.dots?.g?.[0] ?? defaultDotsColor[1];
    const dotsB = palette.dots?.b?.[0] ?? defaultDotsColor[2];
    const skyLines = palette.skyLines ?? defaultSkyLinesColor;
    const moundFill = palette.moundBody?.fill ?? defaultMoundFillColor;

    const bgColor = buffer.color(sky[0], sky[1], sky[2]);
    const burstColors = [
        buffer.color(dotsR, dotsG, dotsB, 150), // Use safe values
        buffer.color(skyLines[0], skyLines[1], skyLines[2], 120), // Use safe value
        buffer.color(moundFill[0], moundFill[1], moundFill[2], 100) // Use safe value
    ];

    buffer.background(bgColor);
    
    // Determine burst center
    const centerX = buffer.width * buffer.random(0.3, 0.7);
    const centerY = buffer.height * buffer.random(0.3, 0.7);
    const numLines = buffer.random(50, 150);
    const maxRadius = buffer.dist(0, 0, buffer.width, buffer.height);

    for (let i = 0; i < numLines; i++) {
        const angle = buffer.random(buffer.TWO_PI);
        const startRadius = buffer.random(0, maxRadius * 0.2);
        const endRadius = buffer.random(startRadius, maxRadius * 1.2);
        const x1 = centerX + buffer.cos(angle) * startRadius;
        const y1 = centerY + buffer.sin(angle) * startRadius;
        const x2 = centerX + buffer.cos(angle) * endRadius;
        const y2 = centerY + buffer.sin(angle) * endRadius;
        
        buffer.strokeWeight(buffer.random(1, 4));
        buffer.stroke(burstColors[Math.floor(buffer.random() * burstColors.length)]);
        buffer.line(x1, y1, x2, y2);
    }

    return cacheTexture(type, cacheKey, buffer);
}

// 4. Sunny Day
function _drawSunnyDay(target, palette, type) {
    const cacheKey = `${type}_${palette.name}_${target.width}x${target.height}`;
    const buffer = getOrCreateBuffer(target, type, cacheKey);
    if (!buffer || getCachedTexture(type, cacheKey)) return buffer; 

    const seed = $fx.rand() * 10000;
    buffer.randomSeed(seed);
    buffer.noiseSeed(seed+1);

    const defaultSkyColor = [240, 220, 200]; // Light beige fallback
    const defaultGroundColor = [210, 180, 140]; // Default sand

    const sky = palette.sky ?? defaultSkyColor;
    const ground = palette.ground ?? defaultGroundColor;

    const skyColorTop = buffer.color(sky[0], sky[1]*0.9, sky[2]*0.7); // Bright, slightly yellow sky
    const skyColorBottom = buffer.color(sky[0] * 0.9, sky[1] * 0.95, sky[2]); // Slightly lighter/yellower
    const sunColor = buffer.color(255, 220, 80);
    const cloudColor = buffer.color(255, 255, 255, 200);

    // Sky gradient
    buffer.noStroke();
    for (let y = 0; y < buffer.height; y++) {
        let inter = y / buffer.height;
        let c = buffer.lerpColor(skyColorTop, skyColorBottom, inter);
        buffer.stroke(c); // Use stroke for thin lines to draw gradient
        buffer.line(0, y, buffer.width, y);
    }
    buffer.noStroke();

    // Sun
    buffer.fill(sunColor);
    const sunSize = buffer.width * buffer.random(0.1, 0.2);
    buffer.ellipse(buffer.width * buffer.random(0.6, 0.9), buffer.height * buffer.random(0.1, 0.3), sunSize, sunSize);

    // Clouds (simple layered ellipses)
    buffer.fill(cloudColor);
    const numClouds = buffer.random(3, 8);
    for (let i = 0; i < numClouds; i++) {
        const cloudX = buffer.random(buffer.width);
        const cloudY = buffer.random(buffer.height * 0.1, buffer.height * 0.6);
        const cloudW = buffer.random(buffer.width * 0.1, buffer.width * 0.3);
        const cloudH = buffer.random(buffer.width * 0.05, buffer.width * 0.15);
        const parts = floor(buffer.random(3, 7)); // Ensure integer
        buffer.fill(cloudColor);
        for(let j=0; j<parts; j++) {
            buffer.ellipse(
                cloudX + buffer.random(-cloudW * 0.3, cloudW * 0.3),
                cloudY + buffer.random(-cloudH * 0.3, cloudH * 0.3),
                cloudW * buffer.random(0.5, 1.0), 
                cloudH * buffer.random(0.5, 1.0)
            );
        }
    }
    
    return cacheTexture(type, cacheKey, buffer);
}

// --- END: New Background Implementation Functions (Batch 1) ---


// --- START: New Background Implementation Functions (Batch 2) ---

// 5. Candy Land
function _drawCandyLand(target, palette, type) {
    const cacheKey = `${type}_${palette.name}_${target.width}x${target.height}`;
    const buffer = getOrCreateBuffer(target, type, cacheKey);
    if (!buffer || getCachedTexture(type, cacheKey)) return buffer; 

    const seed = $fx.rand() * 10000;
    buffer.randomSeed(seed);
    
    // Fallback colors
    const defaultCandyColor = [255, 105, 180]; // Pink
    
    const candyR = palette.dots?.r ? palette.dots.r[0] : defaultCandyColor[0];
    const candyG = palette.dots?.g ? palette.dots.g[0] : defaultCandyColor[1];
    const candyB = palette.dots?.b ? palette.dots.b[0] : defaultCandyColor[2];

    const defaultSkyColor = [240, 220, 200]; // Light beige fallback
    const defaultGroundColor = [200, 180, 150]; // Light brown fallback

    const sky = palette.sky ?? defaultSkyColor;
    const ground = palette.ground ?? defaultGroundColor;

    const bgColor = buffer.color(sky[0], sky[1], sky[2], 180); // Pastel sky
    const groundColor = buffer.color(ground[0], ground[1], ground[2], 200);
    const candyColors = [
        buffer.color(candyR, candyG, candyB), // Uses safe values
        buffer.color(255, 182, 193), // Light Pink
        buffer.color(173, 216, 230), // Light Blue
        buffer.color(144, 238, 144), // Light Green
        buffer.color(255, 255, 150), // Light Yellow
    ];

    buffer.background(bgColor);

    // Ground
    buffer.fill(groundColor);
    buffer.noStroke();
    buffer.rect(0, buffer.height * 0.7, buffer.width, buffer.height * 0.3);

    // Lollipops
    const numLollipops = floor(buffer.random(3, 7));
    for (let i = 0; i < numLollipops; i++) {
        const stickH = buffer.random(buffer.height * 0.2, buffer.height * 0.5);
        const stickW = stickH * 0.05;
        const headD = stickH * buffer.random(0.3, 0.6);
        const x = buffer.random(buffer.width);
        const y = buffer.height * 0.75 - stickH;
        
        buffer.fill(245, 245, 245); // Stick color
        buffer.rect(x - stickW / 2, y, stickW, stickH);
        buffer.fill(candyColors[floor(buffer.random() * candyColors.length)]);
        buffer.ellipse(x, y, headD, headD);
    }
    
    // Gumdrops (simple hills)
    const numGumdrops = floor(buffer.random(5, 10));
    for(let i=0; i<numGumdrops; i++){
        buffer.fill(candyColors[floor(buffer.random() * candyColors.length)]);
        const dropW = buffer.random(buffer.width * 0.05, buffer.width * 0.15);
        const dropH = dropW * buffer.random(0.8, 1.2);
        const dropX = buffer.random(buffer.width);
        const dropY = buffer.height * 0.7 + dropH * 0.5;
        buffer.ellipse(dropX, dropY, dropW, dropH);
    }

    return cacheTexture(type, cacheKey, buffer);
}

// 6. Stormy Sky
function _drawStormySky(target, palette, type) {
    // target IS the buffer provided by bufferManager.getBuffer
    // This function now ONLY draws the static sky gradient
    // and initializes the storm state for animation if needed.

    const seed = $fx.rand() * 10000; // Base seed from fxrand
    // Consistent seed for initial state generation (derived from type/palette)
    const stateSeed = (type + palette.name).split("").reduce((acc, char) => (acc * 31 + char.charCodeAt(0)) | 0, 0);

    target.noiseSeed(seed + 1); // Use base seed for gradient noise

    // --- Color Setup ---
    const defaultSkyColor = [50, 20, 10];
    const sky = palette.sky ?? defaultSkyColor;
    const skyColor1 = target.color(sky[0] * 0.3, sky[1] * 0.3, sky[2] * 0.4);
    const skyColor2 = target.color(sky[0] * 0.5, sky[1] * 0.5, sky[2] * 0.6);

    // --- Draw Static Sky Gradient --- (Always drawn to the background buffer)
    target.noStroke();
    for (let y = 0; y < target.height; y++) {
        let inter = target.noise(y * 0.01, seed * 0.02);
        let c = target.lerpColor(skyColor1, skyColor2, inter);
        target.stroke(c);
        target.line(0, y, target.width, y);
    }
    target.noStroke();

    // --- Initialize Storm State for Animation (if not already done) ---
    let stormState = getStateProperty('storm');
    if (!stormState) {
        // Use derived, consistent seed for initial cloud/lightning state
        const initialRandom = $fx.rand();

        const initialClouds = [];
        const numClouds = 10 + floor($fx.rand() * 6); // 10-15 clouds

        for (let i = 0; i < numClouds; i++) {
            const x = $fx.rand() * target.width;
            const y = $fx.rand() * target.height * 0.6; // Keep clouds higher
            const baseSize = ($fx.rand() * 0.20 + 0.15) * target.width; // width * 0.15 to 0.35
            const parts = 6 + floor($fx.rand() * 7); // 6-12 parts
            const cloudPoints = [];
            for(let j=0; j<parts; j++) {
               const sizeWRatio = $fx.rand() * 0.6 + 0.4; // 0.4 to 1.0
               const sizeW = baseSize * sizeWRatio;
               const sizeHRatio = $fx.rand() * 0.3 + 0.4; // 0.4 to 0.7
               cloudPoints.push({
                    // Use $fx.rand() mapped to the range [-0.5, 0.5]
                    offX: ($fx.rand() - 0.5) * baseSize,
                    offY: ($fx.rand() - 0.5) * baseSize * 0.4, // scale Y offset range
                    sizeW: sizeW,
                    sizeH: sizeW * sizeHRatio
               });
           }
           initialClouds.push({
               x: x, // Initial X position
               y: y, // Initial Y position
               points: cloudPoints
               // No noiseOffset or speed needed for static clouds
           });
       }

       stormState = {
           clouds: initialClouds,
           lightning: {
               active: false,
               timer: 0,
               duration: 0,
               points: [],
               lastStrikeTime: -Infinity,
               minInterval: 3000,
               maxInterval: 4000,
               nextStrikeTime: $fx.rand() * 5000 + 2000
           }
       };
       updateState('storm', stormState);
       console.log("Initialized storm state:", stormState);
    }
    // --- End State Initialization ---

    // Cloud and lightning drawing logic has been removed.
    // It will be handled by drawStormySkyAnimation function.

    // No return needed
}

// 7. Volcanic Plain
function _drawVolcanicPlain(target, palette, type) {
    const cacheKey = `${type}_${palette.name}_${target.width}x${target.height}`;
    const buffer = getOrCreateBuffer(target, type, cacheKey);
    if (!buffer || getCachedTexture(type, cacheKey)) return buffer; 

    const seed = $fx.rand() * 10000;
    buffer.randomSeed(seed);

    const defaultSkyColor = [240, 220, 200]; // Light beige fallback
    const defaultGroundColor = [180, 140, 100]; // Light brown fallback

    const sky = palette.sky ?? defaultSkyColor;
    const ground = palette.ground ?? defaultGroundColor;

    const skyColor = buffer.color(sky[0] * 0.4, sky[1] * 0.2, sky[2] * 0.1, 200); // Dark, reddish sky
    const groundColor = buffer.color(ground[0] * 0.3, ground[1] * 0.3, ground[2] * 0.3); // Use safe value
    const crackColor = buffer.color(255, buffer.random(50, 150), 0, 100); // Fiery cracks
    const lavaColor = buffer.color(255, buffer.random(80, 180), 20, 180);

    buffer.background(skyColor);

    // Ground
    buffer.fill(groundColor);
    buffer.noStroke();
    buffer.rect(0, buffer.height * 0.6, buffer.width, buffer.height * 0.4);

    // Cracks in the ground (jagged lines)
    buffer.strokeWeight(buffer.random(1, 4));
    const numCracks = floor(buffer.random(15, 40));
    for (let i = 0; i < numCracks; i++) {
        buffer.stroke(crackColor);
        let x1 = buffer.random(buffer.width);
        let y1 = buffer.random(buffer.height * 0.6, buffer.height);
        let angle = buffer.random(buffer.TWO_PI);
        let len = buffer.random(buffer.width * 0.05, buffer.width * 0.2);
        let x2 = x1 + buffer.cos(angle) * len;
        let y2 = y1 + buffer.sin(angle) * len;
        // Simple jagged line
        let midX = (x1 + x2) / 2 + buffer.random(-len * 0.3, len * 0.3);
        let midY = (y1 + y2) / 2 + buffer.random(-len * 0.3, len * 0.3);
        buffer.line(x1, y1, midX, midY);
        buffer.line(midX, midY, x2, y2);
    }
    
    // Small lava pools
    buffer.noStroke();
    const numPools = floor(buffer.random(3, 8));
    for (let i = 0; i < numPools; i++) {
        buffer.fill(lavaColor);
        let poolX = buffer.random(buffer.width);
        let poolY = buffer.random(buffer.height * 0.65, buffer.height * 0.95);
        let poolW = buffer.random(buffer.width * 0.02, buffer.width * 0.1);
        let poolH = poolW * buffer.random(0.4, 0.8);
        buffer.ellipse(poolX, poolY, poolW, poolH);
    }

    return cacheTexture(type, cacheKey, buffer);
}

// 8. Underwater World
function _drawUnderwaterWorld(target, palette, type) {
    const cacheKey = `${type}_${palette.name}_${target.width}x${target.height}`;
    const buffer = getOrCreateBuffer(target, type, cacheKey);
    if (!buffer || getCachedTexture(type, cacheKey)) return buffer; 

    const seed = $fx.rand() * 10000;
    buffer.randomSeed(seed);
    buffer.noiseSeed(seed+1);

    const defaultSkyColor = [100, 150, 200]; // Default blue
    const defaultGroundColor = [210, 180, 140]; // Default sand
    const defaultDotsColor = [100, 200, 100]; // Default green

    const sky = palette.sky ?? defaultSkyColor;
    const ground = palette.ground ?? defaultGroundColor;
    const dotsG = palette.dots?.g ?? defaultDotsColor;

    const waterColorTop = buffer.color(sky[0] * 0.6, sky[1] * 0.8, sky[2]); // Lighter blue/green
    const waterColorBottom = buffer.color(sky[0] * 0.2, sky[1] * 0.4, sky[2] * 0.8); // Deeper blue
    const sandColor = buffer.color(ground[0] * 1.2, ground[1] * 1.1, ground[2] * 0.8); // Lighter sand - Use safe value
    const bubbleColor = buffer.color(200, 220, 255, 80);
    const seaweedColor = buffer.color(dotsG[0] * 0.6, dotsG[1], dotsG[2] * 0.5, 150); // Use safe value (accessing elements of dotsG)

    // Water gradient
    buffer.noStroke();
    for (let y = 0; y < buffer.height; y++) {
        let inter = y / buffer.height;
        let c = buffer.lerpColor(waterColorTop, waterColorBottom, inter);
        buffer.stroke(c); // Use stroke for thin lines to draw gradient
        buffer.line(0, y, buffer.width, y);
    }
    buffer.noStroke();

    // Sandy bottom
    buffer.fill(sandColor);
    buffer.beginShape();
    buffer.vertex(0, buffer.height);
    for (let x = 0; x <= buffer.width; x += 20) {
        let y = buffer.height * 0.8 + buffer.noise(x * 0.01, seed * 0.1) * buffer.height * 0.2;
        buffer.vertex(x, y);
    }
    buffer.vertex(buffer.width, buffer.height);
    buffer.endShape(buffer.CLOSE);

    // Bubbles rising
    const numBubbles = floor(buffer.random(20, 50));
    for (let i = 0; i < numBubbles; i++) {
        buffer.fill(bubbleColor);
        let bubbleX = buffer.random(buffer.width);
        let bubbleY = buffer.random(buffer.height);
        let bubbleD = buffer.random(2, 10);
        buffer.ellipse(bubbleX, bubbleY, bubbleD, bubbleD);
    }

    // Seaweed (wavy lines)
    const numSeaweed = floor(buffer.random(5, 15));
    buffer.stroke(seaweedColor);
    buffer.strokeWeight(buffer.random(2, 5));
    buffer.noFill();
    for (let i = 0; i < numSeaweed; i++) {
        let plantX = buffer.random(buffer.width);
        let plantBaseY = buffer.height * 0.8 + buffer.noise(plantX * 0.01, seed*0.1) * buffer.height * 0.2 - 5; // Anchor slightly above ground noise
        let plantH = buffer.random(buffer.height * 0.1, buffer.height * 0.4);
        buffer.beginShape();
        for (let y = 0; y < plantH; y += 5) {
            let sway = buffer.sin(y * 0.1 + seed + i) * 10;
            buffer.vertex(plantX + sway, plantBaseY - y);
        }
        buffer.endShape();
    }

    return cacheTexture(type, cacheKey, buffer);
}

// --- END: New Background Implementation Functions (Batch 2) ---



// --- START: New Background Implementation Functions (Batch 3) ---

// 9. Tech Grid
function _drawTechGrid(target, palette, type) {
    const cacheKey = `${type}_${palette.name}_${target.width}x${target.height}`;
    const buffer = getOrCreateBuffer(target, type, cacheKey);
    if (!buffer || getCachedTexture(type, cacheKey)) return buffer; 

    const seed = $fx.rand() * 10000;
    buffer.randomSeed(seed);

    // Fallback colors
    const defaultSkyColor = [10, 10, 10]; // Dark fallback
    const defaultSkyLinesColor = [100, 100, 100]; // Grey fallback
    const defaultDotColor = [150, 150, 150]; // Light Grey fallback

    const sky = palette.sky ?? defaultSkyColor;
    const skyLines = palette.skyLines ?? defaultSkyLinesColor; // Use skyLines instead of lines
    const dots = palette.dots ?? { r: [defaultDotColor[0]], g: [defaultDotColor[1]], b: [defaultDotColor[2]] }; // Provide default structure for dots

    const lineColor = skyLines; // Directly use the safe skyLines value
    const dotColor = [dots.r?.[0] ?? defaultDotColor[0], dots.g?.[0] ?? defaultDotColor[1], dots.b?.[0] ?? defaultDotColor[2]]; // Safe access within dots

    const bgColor = buffer.color(sky[0] * 0.1, sky[1] * 0.1, sky[2] * 0.1); // Very dark background
    const gridColor = buffer.color(lineColor[0], lineColor[1], lineColor[2], 80); // Use palette lines color with fallback
    const glowColor = buffer.color(dotColor[0], dotColor[1], dotColor[2], 150); // Use palette dots color with fallback

    buffer.background(bgColor);

    // Perspective Grid Lines
    buffer.stroke(gridColor);
    buffer.strokeWeight(1);
    const horizonY = buffer.height * 0.4;
    const vanishingPointX = buffer.width / 2;
    const numHorizontalLines = 10;
    const numVerticalLines = 20;

    // Horizontal lines (getting closer towards horizon)
    for (let i = 1; i <= numHorizontalLines; i++) {
        const y = horizonY + (buffer.height - horizonY) * (i / numHorizontalLines) ** 2;
        buffer.line(0, y, buffer.width, y);
    }

    // Vertical lines (radiating from vanishing point)
    for (let i = 0; i <= numVerticalLines; i++) {
        const xScreen = buffer.width * (i / numVerticalLines);
        const depthFactor = 2; // Controls how far the lines extend 'into' the screen
        const xProjected = vanishingPointX + (xScreen - vanishingPointX) * depthFactor;
        buffer.line(vanishingPointX, horizonY, xProjected, buffer.height);
    }

    // Glowing Nodes (at some intersections)
    buffer.noStroke();
    buffer.fill(glowColor);
    const numNodes = floor(buffer.random(15, 30));
    for (let i = 0; i < numNodes; i++) {
        const hLineIndex = floor(buffer.random(1, numHorizontalLines));
        const vLineIndex = floor(buffer.random(numVerticalLines));
        
        const y = horizonY + (buffer.height - horizonY) * (hLineIndex / numHorizontalLines) ** 2;
        
        // Find intersection X for the vertical line at this Y
        const xScreen = buffer.width * (vLineIndex / numVerticalLines);
        const t = (y - horizonY) / (buffer.height - horizonY);
        const x = vanishingPointX + (xScreen - vanishingPointX) * (t + 1); // Approximation for intersection x

        if (x > 0 && x < buffer.width) { // Only draw if on screen
            const nodeSize = buffer.random(2, 6);
            buffer.ellipse(x, y, nodeSize, nodeSize);
        }
    }

    return cacheTexture(type, cacheKey, buffer);
}

// 10. Forest Clearing
function _drawForestClearing(target, palette, type) {
    const cacheKey = `${type}_${palette.name}_${target.width}x${target.height}`;
    const buffer = getOrCreateBuffer(target, type, cacheKey);
    if (!buffer || getCachedTexture(type, cacheKey)) return buffer; 

    const seed = $fx.rand() * 10000;
    buffer.randomSeed(seed);
    buffer.noiseSeed(seed+1);

    // Fallback colors
    const defaultSkyColor = [180, 220, 255]; // Light blue
    const defaultGroundColor = [100, 140, 80]; // Greenish brown
    const defaultSkyLinesColor = [100, 60, 20]; // Brownish fallback for trunk (was lines)
    const defaultLeafColor = [50, 150, 50]; // Greenish fallback for leaf

    const sky = palette.sky ?? defaultSkyColor;
    const ground = palette.ground ?? defaultGroundColor;
    const skyLines = palette.skyLines ?? defaultSkyLinesColor; // Use skyLines instead of lines for trunk color base
    const dots = palette.dots ?? { r: [defaultLeafColor[0]], g: [defaultLeafColor[1]], b: [defaultLeafColor[2]] }; // Default structure for leaf color base

    const trunkR = skyLines[0]; // Using skyLines as base
    const trunkG = skyLines[1];
    const trunkB = skyLines[2];

    const leafR = dots.r?.[0] ?? defaultLeafColor[0]; 
    const leafG = dots.g?.[0] ?? defaultLeafColor[1];
    const leafB = dots.b?.[0] ?? defaultLeafColor[2];

    const skyColor = buffer.color(sky[0], sky[1], sky[2]);
    const groundColor = buffer.color(ground[0] * 0.8, ground[1], ground[2] * 0.6); // Greener ground - Use safe value
    const treeTrunkColor = buffer.color(trunkR * 0.5, trunkG * 0.3, trunkB * 0.2); // Browner using fallback base
    const treeLeafColor1 = buffer.color(leafR * 0.5, leafG, leafB * 0.3, 200); // Using fallback base
    const treeLeafColor2 = buffer.color(leafR * 0.7, leafG * 1.2, leafB * 0.5, 180); // Using fallback base

    buffer.background(skyColor);

    // Ground
    buffer.fill(groundColor);
    buffer.noStroke();
    buffer.rect(0, buffer.height * 0.7, buffer.width, buffer.height * 0.3);

    // Trees at the edges
    buffer.noStroke();
    const drawTree = (x, baseWidth, height) => {
        // Trunk
        buffer.fill(treeTrunkColor);
        buffer.rect(x - baseWidth / 2, buffer.height * 0.7 - height * 0.8, baseWidth, height * 0.8);
        // Leaves (simple layered ellipses)
        const canopyLevels = 3;
        const canopyWidth = baseWidth * 5;
        const canopyHeight = height * 0.7;
        for (let i = 0; i < canopyLevels; i++) {
            const levelY = buffer.height * 0.7 - height * 0.8 + canopyHeight * (i * 0.2) - canopyHeight*0.3;
            const levelW = canopyWidth * (1 - i * 0.2);
            const levelH = canopyHeight * (0.6 - i*0.1);
            buffer.fill(i % 2 === 0 ? treeLeafColor1 : treeLeafColor2);
            buffer.ellipse(x, levelY, levelW, levelH);
        }
    };

    const numTrees = floor(buffer.random(6, 12));
    for (let i = 0; i < numTrees; i++) {
        const treeHeight = buffer.random(buffer.height * 0.2, buffer.height * 0.6);
        const treeWidth = treeHeight * buffer.random(0.05, 0.1);
        let treeX;
        if (buffer.random() > 0.5) { // Left side
            treeX = buffer.random(buffer.width * -0.1, buffer.width * 0.3);
        } else { // Right side
            treeX = buffer.random(buffer.width * 0.7, buffer.width * 1.1);
        }
        drawTree(treeX, treeWidth, treeHeight);
    }
    
     // Subtle light shafts (optional)
    if (buffer.random() > 0.5) {
        buffer.strokeWeight(1);
        const numShafts = floor(buffer.random(2, 5));
        for(let i=0; i<numShafts; i++) {
            const shaftX = buffer.random(buffer.width);
            const angle = buffer.random(buffer.PI * 0.4, buffer.PI * 0.6); // Mostly downwards
            const length = buffer.random(buffer.height * 0.5, buffer.height);
            const endX = shaftX + buffer.cos(angle) * length;
            const endY = buffer.sin(angle) * length;
            buffer.stroke(255, 255, 200, buffer.random(5, 15)); // Faint yellow light
            buffer.line(shaftX, 0, endX, endY);
        }
    }

    return cacheTexture(type, cacheKey, buffer);
}

// 11. Cursed Realm
function _drawCursedRealm(target, palette, type) {
    const cacheKey = `${type}_${palette.name}_${target.width}x${target.height}`;
    const buffer = getOrCreateBuffer(target, type, cacheKey);
    if (!buffer || getCachedTexture(type, cacheKey)) return buffer; 

    const seed = $fx.rand() * 10000;
    buffer.randomSeed(seed);
    buffer.noiseSeed(seed+1);

    // Fallback color
    const defaultEyeColor = [255, 100, 0]; // Orange/Red

    const eyeR = palette.dots?.r ? palette.dots.r[0] : defaultEyeColor[0];
    const eyeG = palette.dots?.g ? palette.dots.g[0] : defaultEyeColor[1];
    const eyeB = palette.dots?.b ? palette.dots.b[0] : defaultEyeColor[2];

    const defaultSkyColor = [20, 10, 30]; // Dark purple fallback
    const defaultGroundColor = [30, 30, 30]; // Dark grey fallback

    const sky = palette.sky ?? defaultSkyColor;
    const ground = palette.ground ?? defaultGroundColor;

    const skyColor1 = buffer.color(sky[0] * 0.2, sky[1] * 0.1, sky[2] * 0.3); // Dark purple/red
    const skyColor2 = buffer.color(sky[0] * 0.1, sky[1] * 0.2, sky[2] * 0.1); // Dark green/black
    const groundColor = buffer.color(ground[0] * 0.2, ground[1] * 0.2, ground[2] * 0.2); // Very dark ground
    const eyeColor = buffer.color(eyeR, eyeG * 0.2, eyeB * 0.2, 180); // Glowing red/orange with fallback
    const mistColor = buffer.color(50, 50, 50, 50);

    // Swirly, dark sky gradient
    buffer.noStroke();
    for (let y = 0; y < buffer.height; y++) {
        let inter = buffer.noise(y * 0.01, seed * 0.02); // Use noise for uneven blending
        let c = buffer.lerpColor(skyColor1, skyColor2, inter);
        buffer.stroke(c);
        buffer.line(0, y, buffer.width, y);
    }
    buffer.noStroke();

    // Jagged ground
    buffer.fill(groundColor);
    buffer.beginShape();
    buffer.vertex(0, buffer.height);
    for (let x = 0; x <= buffer.width; x += 15) {
        let y = buffer.height * 0.7 + buffer.random(-buffer.height * 0.05, buffer.height * 0.05) + buffer.noise(x * 0.02, seed*0.1) * buffer.height * 0.1;
        buffer.vertex(x, clamp(y, buffer.height*0.6, buffer.height));
    }
    buffer.vertex(buffer.width, buffer.height);
    buffer.endShape(buffer.CLOSE);

    // Floating/Watching Eyes
    buffer.noStroke();
    const numEyes = floor(buffer.random(5, 15));
    for (let i = 0; i < numEyes; i++) {
        buffer.fill(eyeColor);
        let eyeX = buffer.random(buffer.width);
        let eyeY = buffer.random(buffer.height * 0.6); // In the sky/mist area
        let eyeW = buffer.random(buffer.width * 0.01, buffer.width * 0.03);
        let eyeH = eyeW * buffer.random(0.6, 0.8);
        buffer.ellipse(eyeX, eyeY, eyeW, eyeH);
        buffer.fill(0); // Pupil
        buffer.ellipse(eyeX, eyeY, eyeW * 0.3, eyeH * 0.5);
    }
    
    // Ground Mist
    buffer.fill(mistColor);
    const numMistPatches = 10;
    for(let i=0; i< numMistPatches; i++) {
        const mistX = buffer.random(buffer.width);
        const mistY = buffer.random(buffer.height * 0.65, buffer.height);
        const mistW = buffer.random(buffer.width * 0.2, buffer.width * 0.6);
        const mistH = buffer.random(buffer.height * 0.05, buffer.height * 0.2);
        buffer.ellipse(mistX, mistY, mistW, mistH);
    }

    return cacheTexture(type, cacheKey, buffer);
}

// 12. Desert Oasis
function _drawDesertOasis(target, palette, type) {
    const cacheKey = `${type}_${palette.name}_${target.width}x${target.height}`;
    const buffer = getOrCreateBuffer(target, type, cacheKey);
    if (!buffer || getCachedTexture(type, cacheKey)) return buffer; 

    const seed = $fx.rand() * 10000;
    buffer.randomSeed(seed);
    buffer.noiseSeed(seed+1);

    // Fallback color
    const defaultWaterColor = [60, 100, 200]; // Blue
    
    const waterR = palette.dots?.b ? palette.dots.r[0] : defaultWaterColor[0]; // Assuming R component might exist even if B is primarily used
    const waterG = palette.dots?.b ? palette.dots.g[0] : defaultWaterColor[1]; // Assuming G component might exist
    const waterB = palette.dots?.b ? palette.dots.b[0] : defaultWaterColor[2]; // Primary blue component

    const defaultSkyColor = [240, 220, 200]; // Light beige fallback
    const defaultGroundColor = [200, 180, 150]; // Light brown fallback

    const sky = palette.sky ?? defaultSkyColor;
    const ground = palette.ground ?? defaultGroundColor;

    const skyColor = buffer.color(sky[0], sky[1]*0.9, sky[2]*0.7); // Bright, slightly yellow sky
    const sandColorLight = buffer.color(ground[0], ground[1], ground[2]);
    const sandColorDark = buffer.color(ground[0]*0.9, ground[1]*0.9, ground[2]*0.85);
    const waterColor = buffer.color(waterR*0.5, waterG*0.7, waterB, 200); // Blue from dots with fallback
    const palmTrunkColor = buffer.color(139, 69, 19); // Brown
    const palmLeafColor = buffer.color(34, 139, 34); // Forest Green

    // Sky
    buffer.background(buffer.color(sky[0], sky[1], sky[2]));

    // Sand Dunes using noise for wavy effect
    buffer.noStroke();
    for (let y = floor(buffer.height * 0.5); y < buffer.height; y++) {
        let inter = buffer.noise(y * 0.02, seed * 0.1) * 0.6 + 0.4; // Bias towards darker sand lower down
        let c = buffer.lerpColor(sandColorLight, sandColorDark, inter);
        buffer.stroke(c); // Use stroke for thin lines to draw gradient
        buffer.line(0, y, buffer.width, y);
    }
    buffer.noStroke();

    // Oasis Pool
    buffer.fill(waterColor);
    const oasisX = buffer.width * buffer.random(0.3, 0.7);
    const oasisY = buffer.height * buffer.random(0.75, 0.85);
    const oasisW = buffer.width * buffer.random(0.2, 0.4);
    const oasisH = oasisW * buffer.random(0.3, 0.5);
    buffer.ellipse(oasisX, oasisY, oasisW, oasisH);

    // Palm Trees near the oasis
    const numPalms = floor(buffer.random(2, 5));
    for (let i = 0; i < numPalms; i++) {
        const palmX = oasisX + buffer.random(-oasisW * 0.4, oasisW * 0.4);
        const palmY = oasisY + buffer.random(-oasisH * 0.2, oasisH * 0.2); // Base near water
        const palmH = buffer.random(buffer.height * 0.15, buffer.height * 0.3);
        const trunkW = palmH * 0.08;

        // Trunk
        buffer.fill(palmTrunkColor);
        buffer.rect(palmX - trunkW / 2, palmY - palmH, trunkW, palmH);

        // Leaves (simple radiating lines/curves)
        buffer.stroke(palmLeafColor);
        buffer.strokeWeight(trunkW * 0.5);
        buffer.noFill();
        const numLeaves = 6;
        const leafLength = palmH * 0.5;
        for (let j = 0; j < numLeaves; j++) {
            const angle = buffer.random(buffer.PI * 0.4, buffer.PI * 1.2); // Radiate mostly up and out
            const endX = palmX + buffer.cos(angle) * leafLength;
            const endY = palmY - palmH + buffer.sin(angle) * leafLength;
            const cp1X = palmX + buffer.cos(angle + 0.3) * leafLength * 0.5;
            const cp1Y = palmY - palmH + buffer.sin(angle + 0.3) * leafLength * 0.5;
            const cp2X = palmX + buffer.cos(angle - 0.3) * leafLength * 0.7;
            const cp2Y = palmY - palmH + buffer.sin(angle - 0.3) * leafLength * 0.7;
            buffer.bezier(palmX, palmY - palmH, cp1X, cp1Y, cp2X, cp2Y, endX, endY);
        }
        buffer.noStroke(); // Reset stroke
    }

    return cacheTexture(type, cacheKey, buffer);
}


// --- END: New Background Implementation Functions (Batch 3) ---

// Local clamp function (remove if using globally from utils.js)
function clamp(value, min, max) {
  return Math.max(min, Math.min(value, max));
}
// Add map if not globally available (p5 provides it)
// function map(value, start1, stop1, start2, stop2) { ... }


// --- Exports ---
window.drawBackground = drawBackground;
window.drawWaveAnimation = drawWaveAnimation;
window.BackgroundTypes = BackgroundTypes; // Expose constants if needed
window.ALL_BACKGROUND_TYPES = ALL_BACKGROUND_TYPES; // Expose list if needed

// --- Add the new animation function below ---

// Draws the animated elements (STATIC clouds, timed lightning) for the Stormy Sky background
// Called from the main draw loop in index.js after the background buffer is drawn
function drawStormySkyAnimation(target, state) {
    // target here is the main p5 canvas (p instance from index.js)
    const stormState = state.storm; // Get the initialized state
    if (!stormState) {
        // console.warn("Storm state not initialized, skipping animation.");
        return; // Exit if state hasn't been created by _drawStormySky yet
    }

    // --- Define Colors ---
    // Using slightly different alpha for variation, or pick one
    const cloudColor = target.color(60, 60, 70, 190); // Single darker cloud color
    const lightningColor = target.color(230, 230, 255, 200); // Slightly more intense

    // --- Draw Static Clouds ---
    // Clouds are defined once in stormState and drawn every frame at the same position
    target.noStroke();
    target.fill(cloudColor);
    for (const cloud of stormState.clouds) {
        // Draw each part of the cloud cluster
        for (const point of cloud.points) {
            target.ellipse(cloud.x + point.offX, cloud.y + point.offY, point.sizeW, point.sizeH);
        }
    }

    // --- Handle Lightning Animation ---
    const lightning = stormState.lightning;
    const currentTime = target.millis(); // Get current time in milliseconds

    // Check if it's time for a new strike (and one isn't already active)
    if (!lightning.active && currentTime >= lightning.nextStrikeTime) {
        lightning.active = true;
        // Use $fx.rand() for duration (scaled)
        lightning.duration = 150 + $fx.rand() * 150; // Strike duration 150-300 ms
        lightning.timer = lightning.duration;
        lightning.lastStrikeTime = currentTime;
        // Calculate time for the *next* strike using the 3-4 second interval
        lightning.nextStrikeTime = currentTime + lightning.minInterval + ($fx.rand() * (lightning.maxInterval - lightning.minInterval));

        // Generate new lightning bolt path using $fx.rand()
        lightning.points = [];
        // Start near top-middle
        const startX = target.width * 0.5 + ($fx.rand() - 0.5) * target.width * 0.4; // Middle 40%
        const startY = 0;
        // End somewhere in the upper half
        const endY = ($fx.rand() * 0.4 + 0.2) * target.height; // Strike 20%-60% down
        const segments = 5 + floor($fx.rand() * 4); // 5-8 segments
        let currentX = startX;
        let currentY = startY;
        lightning.points.push({ x: currentX, y: currentY });

        for (let i = 0; i < segments; i++) {
            // Calculate next point with jaggedness using $fx.rand()
            const jagX = ($fx.rand() - 0.5) * target.width * 0.15; // Horizontal deviation
            const nextYStep = (endY - currentY) / (segments - i + 1); // Step towards end Y
            const nextY = currentY + nextYStep + ($fx.rand() - 0.5) * 20; // Vertical deviation
            const nextX = currentX + jagX;

            currentX = target.constrain(nextX, 0, target.width); // Keep within canvas bounds
            currentY = target.max(currentY, nextY); // Ensure Y progresses downwards generally
            lightning.points.push({ x: currentX, y: currentY });
        }
        // Ensure the last point is roughly at the target endY
        if (lightning.points.length > 1) {
            lightning.points[lightning.points.length - 1].y = target.min(lightning.points[lightning.points.length - 1].y, endY * 1.1);
        }
    }

    // Draw active lightning strike
    if (lightning.active) {
        target.stroke(lightningColor);
        // Use $fx.rand() for stroke weight
        target.strokeWeight($fx.rand() * 1.5 + 1); // Weight 1-2.5
        target.noFill();
        target.beginShape();
        for (const p of lightning.points) {
            target.vertex(p.x, p.y);
        }
        target.endShape();

        // Update timer using p5's deltaTime for frame-rate independence
        lightning.timer -= target.deltaTime;
        if (lightning.timer <= 0) {
            lightning.active = false;
            lightning.points = []; // Clear points after strike finishes
        }
    }

    // NOTE: We are modifying properties of the `lightning` object which is part
    // of the `stormState` object held in the global `state`. This direct modification
    // is generally okay for nested objects/arrays in JavaScript state management
    // unless specific immutability patterns are enforced elsewhere. No explicit `updateState` needed here.
}

// --- END OF FILE src/rendering/backgroundManager.js ---