// --- START OF FILE src/rendering/mound.js ---

/**
 * Mound Rendering functions for the Mound Mascot project.
 * Handles drawing the mound's base shape and applying textures/patterns.
 * Does NOT handle geometry generation, glow, or animation updates.
 */

/**
 * Draws the main mound shape based on the vertices stored in the state.
 * Applies base color and shine effect if enabled. Calls texture/pattern functions.
 * @param {p5.Graphics | p5.Renderer} [target=window] - The buffer or canvas to draw onto.
 */
function drawMoundBase(target = window) {
  const state = getState();
  if (!state || !state.moundVertices || state.moundVertices.length < 3 || !state.palette) {
    // console.warn("drawMoundBase: Cannot draw - missing state, vertices, or palette.");
    return; // Cannot draw without essential data
  }
  const { moundVertices, palette, isShiny, apexY } = state;

  target.push();
  target.noStroke();

  // --- Draw Base Color ---
  const moundBaseColor = target.color(palette.mound[0], palette.mound[1], palette.mound[2]);

  if (isShiny) {
    // --- Shiny Appearance ---
    // Apply a vertical gradient for a metallic/shiny look
    target.beginShape();
    for (const v of moundVertices) {
        // Calculate interpolation factor based on vertex Y position
        const t = target.map(v.y, apexY, target.height, 0, 1); // 0 at apex, 1 at bottom
        // Interpolate between base color and a lighter highlight color
        const highlightColor = target.color(
            Math.min(255, palette.mound[0] + 60),
            Math.min(255, palette.mound[1] + 60),
            Math.min(255, palette.mound[2] + 60)
        );
        // Apply color - Use vertex colors if possible (though p5 shape doesn't directly support varying vertex colors easily this way)
        // As a workaround, we could draw segments or use a texture map.
        // Simpler approach: Draw the solid shape first, then overlay gradients/highlights.

        // For now, draw solid base first, highlights added later if needed by shimmer effect
        target.vertex(v.x, v.y);
    }
    target.fill(moundBaseColor); // Fill with base color for now
    target.endShape(target.CLOSE);

    // Add subtle reflective highlight near the top (can be refined)
    target.fill(255, 255, 255, 15); // Very subtle white highlight
    target.beginShape();
    for (let i=0; i < moundVertices.length; i++) {
        const v = moundVertices[i];
        // Apply highlight only to the top ~30% of the mound
        if (v.y < apexY + (target.height - apexY) * 0.3) {
            target.vertex(v.x, v.y);
        } else if (i > 0 && moundVertices[i-1].y < apexY + (target.height - apexY) * 0.3) {
            // Ensure the last point inside the highlight area is included
             target.vertex(v.x, v.y);
        }
    }
     // Find first/last vertex in the highlight zone to close the shape correctly
     let firstIndex = -1, lastIndex = -1;
     for (let i=0; i < moundVertices.length; i++) {
         if (moundVertices[i].y < apexY + (target.height - apexY) * 0.3) {
             if (firstIndex === -1) firstIndex = i;
             lastIndex = i;
         }
     }
     if(firstIndex !== -1 && lastIndex !== -1 && firstIndex !== lastIndex) {
        // Close along the bottom edge of the highlight area if possible
         target.vertex(moundVertices[lastIndex].x, apexY + (target.height - apexY) * 0.3);
         target.vertex(moundVertices[firstIndex].x, apexY + (target.height - apexY) * 0.3);
     }
    target.endShape(target.CLOSE);


  } else {
    // --- Regular Matte Appearance ---
    target.fill(moundBaseColor);
    target.beginShape();
    for (const v of moundVertices) {
      target.vertex(v.x, v.y);
    }
    target.endShape(target.CLOSE);

    // Apply palette-specific textures
    if (!state.hasPattern) {
        applyPaletteTexture(target);
    }
  }

  // --- Draw Pattern (if enabled) --- Apply AFTER base color/texture
  if (state.hasPattern) {
    drawMoundPattern(target);
  } else if (!isShiny) {
      // Apply texture even if there's no pattern (for non-shiny)
      applyPaletteTexture(target);
  }

  target.pop();
}

/**
 * Applies texture effects based on the current palette.
 * Calls the base noise texture and potentially palette-specific textures.
 * @param {p5.Graphics | p5.Renderer} target - The buffer or canvas to draw onto.
 */
function applyPaletteTexture(target) {
  const state = getState();
  if (!state || !state.palette || state.isShiny) return; // Don't texture shiny mounds

  // Apply base noise texture for general depth/variation
  _applyNoiseTexture(target, state);

  // Apply palette-specific overlay textures
  switch (state.palette.name) {
    case "desert":
    case "golden":
      _applyDesertTexture(target, state);
      break;
    case "forest":
    case "mint":
      _applyForestTexture(target, state);
      break;
    case "ocean":
      _applyOceanTexture(target, state);
      break;
    case "moonlight":
    case "twilight":
      _applyNightTexture(target, state);
      break;
    case "cursed":
       _applyCursedTexture(target, state);
       break;
    // Add other cases for specific palette textures if needed
  }

  // Apply subtle vertical gradient for lighting/depth
  _applyDepthGradient(target, state);
}

/**
 * Draws the specified pattern onto the mound area.
 * @param {p5.Graphics | p5.Renderer} target - The buffer or canvas to draw onto.
 */
function drawMoundPattern(target) {
  const state = getState();
  if (!state || !state.hasPattern || state.patternType === 'none' || !state.palette) return;

  target.push();
  // --- Define Clipping Path using Mound Vertices --- //
  target.drawingContext.save(); // Save context state before clipping
  target.beginShape();
  for (const v of state.moundVertices) {
    target.vertex(v.x, v.y);
  }
  target.endShape(target.CLOSE);
  target.drawingContext.clip(); // Clip subsequent drawing to this path
  // --- End Clipping Path --- //

  // Determine pattern color (keep it simple for SOURCE_IN, alpha doesn't matter much)
  const patternBaseColor = target.color(state.palette.mound[0], state.palette.mound[1], state.palette.mound[2]);
  // Use a slightly lighter or darker shade for contrast
  const patternColor = target.color(
      target.lerp(patternBaseColor.levels[0], 255, 0.15), // Slightly lighter
      target.lerp(patternBaseColor.levels[1], 255, 0.15),
      target.lerp(patternBaseColor.levels[2], 255, 0.15)
      // Alpha is ignored by SOURCE_IN, it takes the destination alpha
  );
  target.fill(patternColor); // Apply the pattern color
  target.noStroke(); // Patterns usually don't need strokes

  // Call specific pattern drawing function
  switch (state.patternType) {
    case "stripes":
      _drawStripePattern(target, state);
      break;
    case "spots":
      _drawSpotPattern(target, state);
      break;
    case "grid":
      _drawGridPattern(target, state);
      break;
  }
  target.drawingContext.restore(); // Restore context to remove clip
  target.pop();
}


// --- Private Texture & Pattern Drawing Helpers ---

/** Applies a base Perlin noise texture for subtle highlights/shadows. */
function _applyNoiseTexture(target, state) {
   const { moundVertices, apexY } = state;
   const boundingBox = calculateBoundingBox(moundVertices);
   if (!boundingBox) return;

   target.push(); // Isolate blend mode
   target.blendMode(target.OVERLAY); // Blend noise with base color

   const noiseScale = 0.035; // Slightly larger scale noise
   const noiseStrength = 10; // Subtle strength
   const detailLevel = typeof getDetailLevel === 'function' ? getDetailLevel("texture") : { stepSize: 6 };
   const step = detailLevel.stepSize; // Use performance setting

   target.noStroke();
   for (let y = Math.floor(apexY / step) * step; y < boundingBox.maxY; y += step) {
       for (let x = Math.floor(boundingBox.minX / step) * step; x < boundingBox.maxX; x += step) {
           // Quick check: only proceed if center of cell might be inside
           if (y > boundingBox.minY) {
               // Check midpoint of the rect for efficiency
               if (pointInPolygon(x + step / 2, y + step / 2, moundVertices)) {
                   let noiseVal = target.noise(x * noiseScale, y * noiseScale);
                   if (noiseVal > 0.6) { // Highlights
                       target.fill(255, 255, 255, target.map(noiseVal, 0.6, 1, 0, noiseStrength));
                       target.rect(x, y, step, step);
                   } else if (noiseVal < 0.4) { // Shadows (use dark color for OVERLAY)
                       // Note: For OVERLAY, black deepens shadows, white brightens highlights
                       target.fill(0, 0, 0, target.map(noiseVal, 0.4, 0, 0, noiseStrength)); // Use black for overlay shadows
                       target.rect(x, y, step, step);
                   }
               }
           }
       }
   }
   target.blendMode(target.BLEND); // Reset blend mode
   target.pop();
}

/** Applies a subtle top-to-bottom darkening gradient. */
function _applyDepthGradient(target, state) {
   const { moundVertices, apexY, palette } = state;
   const boundingBox = calculateBoundingBox(moundVertices);
   if (!boundingBox) return;

   target.push(); // Isolate blend mode
   target.blendMode(target.MULTIPLY); // Multiply blend works well for darkening

   const gradientSteps = 20; // More steps for smoother gradient
   const gradientHeight = boundingBox.maxY - apexY;

   target.noStroke();
   // We need to draw the gradient onto the mound shape itself
   // Option 1: Clip - complex
   // Option 2: Draw gradient rects and rely on blend mode over the existing mound shape
   // Let's try option 2 with MULTIPLY blend mode.

   for (let i = 0; i < gradientSteps; i++) {
     const y1 = apexY + (i / gradientSteps) * gradientHeight;
     const y2 = apexY + ((i + 1) / gradientSteps) * gradientHeight;

     // Darken more towards the bottom - use a gray value for MULTIPLY
     // Closer to white (255) = less effect, closer to black (0) = more darkening
     const gradientFactor = target.map(i, 0, gradientSteps - 1, 0.95, 0.65); // Adjust range for desired darkness
     const gradientColor = target.color(255 * gradientFactor); // Grayscale for MULTIPLY

     target.fill(gradientColor);
     target.rect(boundingBox.minX, y1, boundingBox.width, y2 - y1);
   }
   target.blendMode(target.BLEND); // Reset blend mode
   target.pop();
}

/** Placeholder for Desert/Golden specific texture */
function _applyDesertTexture(target, state) {
    const { moundVertices, apexY } = state;
    const boundingBox = calculateBoundingBox(moundVertices);
    if (!boundingBox) return;
    const detailLevel = typeof getDetailLevel === 'function' ? getDetailLevel("effects") : { multiplier: 1.0 };
    const grainCount = Math.floor(300 * detailLevel.multiplier);

    target.noStroke();
    for (let i = 0; i < grainCount; i++) {
        let x = target.random(boundingBox.minX, boundingBox.maxX);
        let y = target.random(apexY + 30, boundingBox.maxY - 10);
        if (pointInPolygon(x, y, moundVertices)) {
            target.fill(255, 255, 255, target.random(3, 10)); // White grains
            target.ellipse(x, y, target.random(1, 3), target.random(1, 3));
        }
    }
    // console.log("Applied Desert Texture");
}

/** Placeholder for Forest/Mint specific texture */
function _applyForestTexture(target, state) {
    // Example: Subtle vein-like patterns
    // console.log("Applied Forest Texture");
}

/** Placeholder for Ocean specific texture */
function _applyOceanTexture(target, state) {
    // Example: Subtle horizontal wave patterns
    // console.log("Applied Ocean Texture");
}

/** Placeholder for Night specific texture */
function _applyNightTexture(target, state) {
    // Example: Very subtle sparkles
     const { moundVertices, apexY } = state;
    const boundingBox = calculateBoundingBox(moundVertices);
    if (!boundingBox) return;
    const detailLevel = typeof getDetailLevel === 'function' ? getDetailLevel("effects") : { multiplier: 1.0 };
    const sparkleCount = Math.floor(50 * detailLevel.multiplier);

    target.noStroke();
    target.fill(255, 255, 255, 15);
     for (let i = 0; i < sparkleCount; i++) {
        let x = target.random(boundingBox.minX, boundingBox.maxX);
        let y = target.random(apexY + 20, boundingBox.maxY - 20);
         if (pointInPolygon(x, y, moundVertices)) {
            target.ellipse(x, y, target.random(1, 2.5), target.random(1, 2.5));
        }
    }
    // console.log("Applied Night Texture");
}

/** Placeholder for Cursed specific texture */
function _applyCursedTexture(target, state) {
    // Example: Darker noise, maybe some subtle dark streaks
    // console.log("Applied Cursed Texture");
}


/** Draws horizontal stripes clipped to the mound shape. */
function _drawStripePattern(target, state) {
  const { moundVertices, apexY } = state;
  const boundingBox = calculateBoundingBox(moundVertices);
  if (!boundingBox) return;

  const stripeHeight = 10;
  const stripeSpacing = 20;

  for (let y = apexY; y < boundingBox.maxY; y += stripeSpacing) {
    // Draw rect for the stripe for this row
    // This is faster than checking pointInPolygon for every pixel
    // Find min/max x for this y level within the polygon
    let minX = target.width;
    let maxX = 0;
    let foundPoint = false;
    // Simplified check: iterate through vertices to find rough x range at y
     for(const v of moundVertices) {
         // Check segments that cross this y level
         // This is complex, use simpler approximation: full width rect
         // Or use a clipping mask if available/performant
     }
     // Simple approach: Draw full width rect, relying on fill color alpha
     target.rect(boundingBox.minX, y, boundingBox.maxX - boundingBox.minX, stripeHeight);

     // More accurate (but slower):
     /*
     target.beginShape();
     let inShape = false;
     for(let x = boundingBox.minX; x < boundingBox.maxX; x += 5) { // Check points along the line
         if (pointInPolygon(x, y, moundVertices)) {
             if (!inShape) { target.beginShape(); inShape = true; }
             target.vertex(x, y);
             target.vertex(x, y + stripeHeight); // Draw vertical segment down
         } else if (inShape) {
             target.endShape(); inShape = false;
         }
     }
     if (inShape) target.endShape();
     */
  }
}

/** Draws spots clipped to the mound shape. */
function _drawSpotPattern(target, state) {
  const { moundVertices, apexY } = state;
  const boundingBox = calculateBoundingBox(moundVertices);
  if (!boundingBox) return;
  const detailLevel = typeof getDetailLevel === 'function' ? getDetailLevel("effects") : { multiplier: 1.0 };
  const spotCount = Math.floor(40 * detailLevel.multiplier); // Fewer, larger spots

  for (let i = 0; i < spotCount; i++) {
    const x = target.random(boundingBox.minX, boundingBox.maxX);
    const y = target.random(apexY + 10, boundingBox.maxY - 10);
    const size = target.random(15, 35); // Larger spots

    // Check center point is inside before drawing
    if (pointInPolygon(x, y, moundVertices)) {
      target.ellipse(x, y, size, size);
    }
  }
}

/** Draws a grid pattern clipped to the mound shape. */
function _drawGridPattern(target, state) {
  const { moundVertices } = state;
  const boundingBox = calculateBoundingBox(moundVertices);
  if (!boundingBox) return;

  // Instead of trying to get the current fill as a stroke,
  // just use the pattern color directly that was set before this function was called
  // The fill color is already set by drawMoundPattern
  const currentFill = target.color(target.drawingContext.fillStyle);
  target.stroke(currentFill);
  target.strokeWeight(1);
  target.noFill();

  const gridSize = 30;

  // Draw clipped lines (complex to do efficiently without masks)
  // Approximation: Draw full grid lines and rely on mound base being drawn over them
  // This isn't ideal. A better approach uses masks or iterates segments.

  // Simplified approach (less accurate clipping):
  for (let y = boundingBox.minY; y < boundingBox.maxY; y += gridSize) {
      target.line(boundingBox.minX, y, boundingBox.maxX, y);
  }
   for (let x = boundingBox.minX; x < boundingBox.maxX; x += gridSize) {
      target.line(x, boundingBox.minY, x, boundingBox.maxY);
  }
}

// --- Helper Functions ---

/** Calculates bounding box. */
function calculateBoundingBox(vertices) {
  // (Implementation copied from effects.js - consider moving to utils.js)
  if (!vertices || vertices.length === 0) return null;
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const v of vertices) {
    minX = Math.min(minX, v.x);
    maxX = Math.max(maxX, v.x);
    minY = Math.min(minY, v.y);
    maxY = Math.max(maxY, v.y);
  }
  const padding = 5;
  return { minX: minX - padding, maxX: maxX + padding, minY: minY - padding, maxY: maxY + padding };
}

// --- Exports ---
window.drawMoundBase = drawMoundBase;
window.applyPaletteTexture = applyPaletteTexture; // Might be needed by bufferManager
window.drawMoundPattern = drawMoundPattern; // Might be needed by bufferManager

// --- END OF FILE src/rendering/mound.js ---