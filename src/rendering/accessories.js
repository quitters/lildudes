// --- START OF FILE src/rendering/accessories.js ---

/**
 * Accessory rendering functions for the Mound Mascot project.
 * Draws different accessories based on the current state.
 * Accessory elements now scale relative to canvas size.
 */

/**
 * Main accessory drawing function.
 * Calls the appropriate drawing function based on state.accessoryType.
 * Assumes it's called within a p5.js drawing context (e.g., inside drawFaceAndAccessories)
 * where the origin is already translated to the face center.
 * @param {p5.Graphics | p5.Renderer} [target=window] - The target to draw on.
 * @param {number} [faceScaleFactor=1.0] - The scaling factor based on canvas size.
 */
function drawAccessory(target = window, faceScaleFactor = 1.0) { // Added faceScaleFactor
  const state = getState(); // Assumes getState is available globally
  if (!state || !state.hasAccessory || !state.accessoryType || state.accessoryType === 'none') {
    return; // No accessory to draw
  }

  // Ensure palette exists
  if (!state.palette || !state.palette.mound) {
     console.warn("Cannot draw accessory: Palette data missing from state.");
     return;
  }

  // Dispatch to specific accessory drawing function, passing state, target, and scale factor
  switch (state.accessoryType) {
    case "hat":
      _drawHat(state, target, faceScaleFactor);
      break;
    case "bow":
      _drawBow(state, target, faceScaleFactor);
      break;
    case "glasses":
      _drawGlasses(state, target, faceScaleFactor);
      break;
    case "crown":
      _drawCrown(state, target, faceScaleFactor);
      break;
    case "halo":
      _drawHalo(state, target, faceScaleFactor);
      break;
    case "eyebrows":
      _drawEyebrows(state, target, faceScaleFactor);
      break;
    case "ribbon":
      _drawRibbon(state, target, faceScaleFactor);
      break;
    default:
      console.warn(`Unknown accessory type: ${state.accessoryType}`);
  }
}

// --- Private Helper Functions for Drawing Specific Accessories (SCALED) ---

/**
 * Draws a top hat. Positioned relative to the mound's apex.
 * @param {object} state
 * @param {p5.Graphics | p5.Renderer} target
 * @param {number} faceScaleFactor
 */
function _drawHat(state, target = window, faceScaleFactor = 1.0) {
  target.push();

  const original = {
      offsetAboveApex: -35, // Lowered further
      brimW: 130, brimH: 32,         // Reduced ~20%
      bodyW: 95, bodyH: 95, bodyCorner: 12, bodyOffsetY: 0, // Reduced ~20%
      bandOffsetY: -48, bandW: 105, bandH: 20, bandCorner: 4, // Reduced ~20%
      strokeW: 1.5
  };

  // Calculate position relative to the mound's top, scaling the distance
  const yOffsetToApex = -(state.faceY - state.apexY); // Distance from face center up to apex

  // Calculate the unscaled Y position relative to the face center
  const unscaledFinalY = yOffsetToApex - original.offsetAboveApex;

  console.log(`[DrawHat] faceY: ${state.faceY?.toFixed(2)}, apexY: ${state.apexY?.toFixed(2)}`);
  console.log(`[DrawHat] yOffsetToApex: ${yOffsetToApex?.toFixed(2)}, offsetAboveApex: ${original.offsetAboveApex}`);
  console.log(`[DrawHat] Unscaled Final Y (relative to face center): ${unscaledFinalY?.toFixed(2)}`);
  console.log(`[DrawHat] faceScaleFactor: ${faceScaleFactor}`);

  target.translate(0, unscaledFinalY);

  // Apply scaling *after* translation, affecting only the hat's drawing size
  target.scale(faceScaleFactor);

  // Scaled dimensions (these are now implicitly handled by target.scale)
  const brimW = original.brimW;
  const brimH = original.brimH;
  const bodyW = original.bodyW;
  const bodyH = original.bodyH;
  const bodyCorner = original.bodyCorner;
  const bodyOffsetY = original.bodyOffsetY; // Relative Y position of body top from brim center
  const bandOffsetY = original.bandOffsetY;
  const bandW = original.bandW;
  const bandH = original.bandH;
  const bandCorner = original.bandCorner;
  const strokeW = Math.max(1, original.strokeW);

  // Hat colors
  target.fill(50, 50, 50);
  target.stroke(30, 30, 30);
  target.strokeWeight(strokeW);

  // Brim (wider ellipse)
  target.ellipse(0, 0, brimW, brimH);

  // Hat body (taller rectangle, adjust Y position based on scaled bodyH)
  target.fill(60, 60, 60);
  target.rect(-bodyW / 2, bodyOffsetY - bodyH, bodyW, bodyH, bodyCorner, bodyCorner, 0, 0); // Y is top offset

  // Hat band
  target.fill(150, 40, 40);
  target.noStroke();
  target.rect(-bandW / 2, bandOffsetY, bandW, bandH, bandCorner);

  target.pop();
}

/**
 * Draws a bow. Positioned slightly below the face center.
 * @param {object} state
 * @param {p5.Graphics | p5.Renderer} target
 * @param {number} faceScaleFactor
 */
function _drawBow(state, target = window, faceScaleFactor = 1.0) {
  target.push();

  const original = {
      offsetY: 35,
      loopW: 45, loopH: 25,
      knotSize: 18, knotOffsetY: -2,
      ribbonLen: 55, ribbonW: 12, ribbonIndent: 5,
      strokeW: 1
  };

  // Scaled values
  const offsetY = original.offsetY * faceScaleFactor;
  const loopW = original.loopW * faceScaleFactor;
  const loopH = original.loopH * faceScaleFactor;
  const knotSize = original.knotSize * faceScaleFactor;
  const knotOffsetY = original.knotOffsetY * faceScaleFactor;
  const ribbonLen = original.ribbonLen * faceScaleFactor;
  const ribbonW = original.ribbonW * faceScaleFactor;
  const ribbonIndent = original.ribbonIndent * faceScaleFactor;
  const strokeW = Math.max(1, original.strokeW * faceScaleFactor);

  // Position bow slightly below the face center
  target.translate(0, offsetY);

  const mainColor = target.color(state.palette.cheeks[0] || 255, state.palette.cheeks[1] || 100, state.palette.cheeks[2] || 150);
  const darkColor = target.color(target.red(mainColor) * 0.8, target.green(mainColor) * 0.8, target.blue(mainColor) * 0.8);

  target.stroke(darkColor);
  target.strokeWeight(strokeW);
  target.fill(mainColor);

  // Left loop
  target.beginShape();
  target.vertex(0, 0);
  target.bezierVertex(-loopW * 0.7, -loopH * 0.8, -loopW, loopH * 0.5, 0, 0);
  target.endShape(target.CLOSE);
  // Right loop
  target.beginShape();
  target.vertex(0, 0);
  target.bezierVertex(loopW * 0.7, -loopH * 0.8, loopW, loopH * 0.5, 0, 0);
  target.endShape(target.CLOSE);

  // Center knot
  target.fill(darkColor);
  target.ellipse(0, knotOffsetY, knotSize, knotSize);

  // Trailing ribbons
  target.fill(mainColor);
  target.noStroke();
  const ribbonStartX = 5 * faceScaleFactor; // Scale offset from center
  const ribbonStartY = 2 * faceScaleFactor;
  const ribbonControl1X = ribbonW; // Scale control points based on ribbonW
  const ribbonControl1Y = ribbonLen * 0.4;
  const ribbonControl2X = ribbonW * 0.8;
  const ribbonControl2Y = ribbonLen * 0.8;
  const ribbonEndX = ribbonW * 0.4;
  const ribbonEndY = ribbonLen;
  const ribbonBottomY = ribbonLen - ribbonIndent;
  const ribbonCurveControlY = ribbonLen * 0.6;
  const ribbonReturnControlX = 3 * faceScaleFactor;
  const ribbonReturnControlY = 5 * faceScaleFactor;

  // Left ribbon
  target.beginShape();
  target.vertex(-ribbonStartX, ribbonStartY);
  target.bezierVertex(-ribbonControl1X, ribbonControl1Y, -ribbonControl2X, ribbonControl2Y, -ribbonEndX, ribbonEndY);
  target.vertex(0, ribbonBottomY);
  target.bezierVertex(0, ribbonCurveControlY, -ribbonReturnControlX, ribbonReturnControlY, -ribbonStartX, ribbonStartY);
  target.endShape(target.CLOSE);
  // Right ribbon
  target.beginShape();
  target.vertex(ribbonStartX, ribbonStartY);
  target.bezierVertex(ribbonControl1X, ribbonControl1Y, ribbonControl2X, ribbonControl2Y, ribbonEndX, ribbonEndY);
  target.vertex(0, ribbonBottomY);
  target.bezierVertex(0, ribbonCurveControlY, ribbonReturnControlX, ribbonReturnControlY, ribbonStartX, ribbonStartY);
  target.endShape(target.CLOSE);

  target.pop();
}

/**
 * Draws glasses. Positioned relative to the face center.
 * @param {object} state
 * @param {p5.Graphics | p5.Renderer} target
 * @param {number} faceScaleFactor
 */
function _drawGlasses(state, target = window, faceScaleFactor = 1.0) {
  target.push();

  const original = {
    // Assuming base eye position from face.js original values
    eyeOffsetX: 48, eyeOffsetY: -12,
    lensSize: 24,
    bridgeArcHeight: 15,
    earpieceLen: 5, // This was implicitly size, make explicit
    frameWeight: 4, earpieceWeight: 3,
    glareSizeFactor: 0.5, glareOffsetFactor: 0.2
  };

  // Scaled values
  const eyeOffsetX = original.eyeOffsetX * faceScaleFactor;
  const eyeOffsetY = original.eyeOffsetY * faceScaleFactor;
  const lensSize = original.lensSize * faceScaleFactor;
  const bridgeArcHeight = original.bridgeArcHeight * faceScaleFactor;
  const earpieceLen = original.earpieceLen * faceScaleFactor;
  const frameWeight = Math.max(1, original.frameWeight * faceScaleFactor);
  const earpieceWeight = Math.max(1, original.earpieceWeight * faceScaleFactor);
  const glareSize = lensSize * original.glareSizeFactor;
  const glareOffsetX = lensSize * original.glareOffsetFactor;
  const glareOffsetY = lensSize * original.glareOffsetFactor;


  target.noFill();
  target.stroke(40, 40, 40);
  target.strokeWeight(frameWeight);

  // Left lens frame
  target.ellipse(-eyeOffsetX, eyeOffsetY, lensSize, lensSize);
  // Right lens frame
  target.ellipse(eyeOffsetX, eyeOffsetY, lensSize, lensSize);

  // Bridge (curved slightly)
  target.arc(0, eyeOffsetY, eyeOffsetX * 1.8, bridgeArcHeight, 0, PI); // Width depends on eyeOffsetX

  // Earpieces
  target.strokeWeight(earpieceWeight);
  target.line(-eyeOffsetX - lensSize / 2, eyeOffsetY, -eyeOffsetX - lensSize / 2 - earpieceLen, eyeOffsetY - earpieceLen * 0.5); // Angled slightly
  target.line(eyeOffsetX + lensSize / 2, eyeOffsetY, eyeOffsetX + lensSize / 2 + earpieceLen, eyeOffsetY - earpieceLen * 0.5);

  // Optional lens glare
  if (!state.hasMysteryEyes) {
     target.fill(255, 255, 255, 40);
     target.noStroke();
     target.arc(-eyeOffsetX + glareOffsetX, eyeOffsetY - glareOffsetY, glareSize, glareSize, -PI/4, PI * 0.8);
     target.arc(eyeOffsetX - glareOffsetX, eyeOffsetY - glareOffsetY, glareSize, glareSize, PI * 0.2, PI * 1.2);
  }

  target.pop();
}

/**
 * Draws a crown. Positioned relative to the mound's apex.
 * @param {object} state
 * @param {p5.Graphics | p5.Renderer} target
 * @param {number} faceScaleFactor
 */
function _drawCrown(state, target = window, faceScaleFactor = 1.0) {
  target.push();

  const original = {
      offsetAboveApex: 0, // Pixels relative to apex point
      crownW: 56, crownH: 15, crownCorner: 2, // Reduced ~20%
      numSpikes: 5, spikeH: 20,              // Reduced ~20%
      topJewelSize: 6, topJewelHighlight: 2,  // Reduced ~20%
      bottomJewelSize: 4,                   // Reduced ~20%
      jewelColor: state.crownJewelColor || '#ff0000', // Default red
      strokeW: 1.5
  };

  // New Logic: Position directly relative to apexY
  const targetCanvasY = state.apexY + original.offsetAboveApex;
  const finalTranslateY = targetCanvasY - state.faceY; // Translate from current faceY context to targetCanvasY

  // --- Debug Logging --- 
  console.log(`[DrawCrown] apexY: ${state.apexY?.toFixed(2)}, faceY: ${state.faceY?.toFixed(2)}`);
  console.log(`[DrawCrown] offsetAboveApex: ${original.offsetAboveApex}`);
  console.log(`[DrawCrown] targetCanvasY: ${targetCanvasY?.toFixed(2)}, finalTranslateY: ${finalTranslateY?.toFixed(2)}`);
  // --- End Debug Logging ---

  // Translate from face center to the desired absolute Y position
  target.translate(0, finalTranslateY);
  target.scale(faceScaleFactor);

  // Scaled dimensions
  const crownW = original.crownW * faceScaleFactor;
  const crownH = original.crownH * faceScaleFactor;
  const crownCorner = original.crownCorner * faceScaleFactor;
  const spikeH = original.spikeH * faceScaleFactor;
  const spikeBaseW = crownW / original.numSpikes; // Keep spike base relative to scaled width
  const topJewelSize = original.topJewelSize * faceScaleFactor;
  const topJewelHighlight = original.topJewelHighlight * faceScaleFactor;
  const bottomJewelSize = original.bottomJewelSize * faceScaleFactor;
  const bottomJewelHighlight = original.bottomJewelHighlight * faceScaleFactor;
  const strokeW = Math.max(1, original.strokeW * faceScaleFactor);

  const goldColor = target.color(255, 215, 0);
  const shadowColor = target.color(200, 160, 0);

  target.stroke(shadowColor);
  target.strokeWeight(strokeW);
  target.fill(goldColor);

  // Base band
  target.rect(-crownW / 2, 0, crownW, crownH, crownCorner);

  // Spikes
  for (let i = 0; i < original.numSpikes; i++) {
    const xBase = -crownW / 2 + i * spikeBaseW;
    const spikeTipX = xBase + spikeBaseW / 2;
    // Use noise for slight height variation, scaled
    const spikeTipY = -spikeH * (0.7 + target.noise(i * 0.5) * 0.3);

    target.beginShape();
    target.vertex(xBase, 0);
    target.vertex(spikeTipX, spikeTipY);
    target.vertex(xBase + spikeBaseW, 0);
    target.endShape(target.CLOSE);

    // Top Jewel
    target.fill(original.jewelColor); // Use static color
    target.noStroke();
    target.ellipse(spikeTipX, spikeTipY, topJewelSize, topJewelSize);
    target.fill(255, 255, 255, 150);
    target.ellipse(spikeTipX - topJewelHighlight * 0.3, spikeTipY - topJewelHighlight * 0.3, topJewelHighlight, topJewelHighlight); // Adjust highlight pos slightly

    // Restore fill/stroke for next spike base
    target.fill(goldColor);
    target.stroke(shadowColor);
  }

  // Jewels on base band
  target.noStroke();
  target.fill(original.jewelColor); // Use static color
  target.ellipse(-crownW / 4, crownH / 2, bottomJewelSize, bottomJewelSize);
  target.ellipse(crownW / 4, crownH / 2, bottomJewelSize, bottomJewelSize);
  target.fill(255, 255, 255, 150);
  target.ellipse(-crownW / 4 - bottomJewelHighlight * 0.3, crownH / 2 - bottomJewelHighlight * 0.3, bottomJewelHighlight, bottomJewelHighlight);
  target.ellipse(crownW / 4 - bottomJewelHighlight * 0.3, crownH / 2 - bottomJewelHighlight * 0.3, bottomJewelHighlight, bottomJewelHighlight);

  target.pop();
}

/**
 * Draws a halo. Positioned hovering above the mound apex.
 * @param {object} state
 * @param {p5.Graphics | p5.Renderer} target
 * @param {number} faceScaleFactor
 */
function _drawHalo(state, target = window, faceScaleFactor = 1.0) {
  target.push();

  const original = {
      offsetAboveApex: 10, // Pixels relative to apex point
      haloW: 70, haloH: 25,
      numLayers: 8, maxLayerWeight: 4, minLayerWeight: 1,
      maxAlpha: 120, minAlpha: 5,
      layerWStep: 4, layerHStep: 2,
      sparkleSize: 4
  };

  // New Logic: Position directly relative to apexY
  const targetCanvasY = state.apexY + original.offsetAboveApex;
  const finalTranslateY = targetCanvasY - state.faceY; // Translate from current faceY context to targetCanvasY

  // --- Debug Logging --- 
  console.log(`[DrawHalo] apexY: ${state.apexY?.toFixed(2)}, faceY: ${state.faceY?.toFixed(2)}`);
  console.log(`[DrawHalo] offsetAboveApex: ${original.offsetAboveApex}`);
  console.log(`[DrawHalo] targetCanvasY: ${targetCanvasY?.toFixed(2)}, finalTranslateY: ${finalTranslateY?.toFixed(2)}`);
  // --- End Debug Logging ---

  // Translate from face center to the desired absolute Y position
  target.translate(0, finalTranslateY);
  target.scale(faceScaleFactor);

  // Scaled dimensions
  const haloW = original.haloW * faceScaleFactor;
  const haloH = original.haloH * faceScaleFactor;
  const layerWStep = original.layerWStep * faceScaleFactor;
  const layerHStep = original.layerHStep * faceScaleFactor;
  const sparkleSize = original.sparkleSize * faceScaleFactor;
  const maxLayerWeight = Math.max(1, original.maxLayerWeight * faceScaleFactor);
  const minLayerWeight = Math.max(0.5, original.minLayerWeight * faceScaleFactor);


  const baseColor = target.color(255, 225, 100);

  target.noFill();

  // Draw multiple ellipses for glow
  for (let i = 0; i < original.numLayers; i++) {
    const ratio = i / (original.numLayers - 1); // Correct ratio calculation
    const alpha = target.map(ratio, 0, 1, original.maxAlpha, original.minAlpha);
    const weight = target.map(ratio, 0, 1, maxLayerWeight, minLayerWeight);
    const w = haloW + i * layerWStep;
    const h = haloH + i * layerHStep;
    target.stroke(target.red(baseColor), target.green(baseColor), target.blue(baseColor), alpha);
    target.strokeWeight(weight);
    target.ellipse(0, 0, w, h);
  }

  // Add subtle animated sparkle
  const time = typeof target.millis === 'function' ? target.millis() * 0.00005 : target.frameCount * 0.05; // Use time if available
  const sparkleAngle = (time) % TWO_PI;
  const sparkleX = target.cos(sparkleAngle) * haloW * 0.5;
  const sparkleY = target.sin(sparkleAngle) * haloH * 0.5;
  target.fill(255, 255, 220, 200);
  target.noStroke();
  target.ellipse(sparkleX, sparkleY, sparkleSize, sparkleSize);

  target.pop();
}

/**
 * Draws expressive eyebrows. Positioned relative to the face center.
 * @param {object} state
 * @param {p5.Graphics | p5.Renderer} target
 * @param {number} faceScaleFactor
 */
function _drawEyebrows(state, target = window, faceScaleFactor = 1.0) {
  target.push();

  const original = {
      // Assuming base eye position from face.js original values
      eyeOffsetX: 48, eyeOffsetY: -12,
      eyebrowOffsetY: -18, // Offset above eye pos
      eyebrowLength: 30, // Total length of line was 30 (-15 to 15)
      strokeW: 5
  };

   // Scaled values
  const eyeOffsetX = original.eyeOffsetX * faceScaleFactor;
  const eyeOffsetY = original.eyeOffsetY * faceScaleFactor;
  const eyebrowY = eyeOffsetY + (original.eyebrowOffsetY * faceScaleFactor); // Scaled offset from scaled eye pos
  const eyebrowHalfLen = (original.eyebrowLength / 2) * faceScaleFactor;
  const strokeW = Math.max(1, original.strokeW * faceScaleFactor);


  target.strokeWeight(strokeW);
  target.stroke(40, 40, 40);
  target.strokeCap(ROUND); // Make eyebrows slightly rounded

  // Determine angle based on personality and current emote
  let baseAngle = 0;
  let angleVariation = PI / 16;

  // Use numeric emote codes (handle string "blink" case)
  const currentEmoteNum = typeof state.currentEmote === 'number' ? state.currentEmote : state.initialMood;

  if (state.personalityType === 'grumpy') baseAngle = -PI / 12;
  else if (state.personalityType === 'surprised' || currentEmoteNum === 5 || currentEmoteNum === 11) baseAngle = PI / 10;
  else if (state.personalityType === 'sad' || currentEmoteNum === -2 || currentEmoteNum === 3) baseAngle = -PI/10;
  else if (state.personalityType === 'sleepy') angleVariation = PI / 24;

  // Add animation based on frameCount
  const time = typeof target.millis === 'function' ? target.millis() * 0.0005 : target.frameCount * 0.05;
  const animAngle = target.sin(time + state.personalityType.length) * angleVariation;

  // Left eyebrow
  target.push();
  target.translate(-eyeOffsetX, eyebrowY);
  target.rotate(-baseAngle - animAngle);
  target.line(-eyebrowHalfLen, 0, eyebrowHalfLen, 0);
  target.pop();

  // Right eyebrow
  target.push();
  target.translate(eyeOffsetX, eyebrowY);
  target.rotate(baseAngle + animAngle);
  target.line(-eyebrowHalfLen, 0, eyebrowHalfLen, 0);
  target.pop();

  target.pop();
}

/**
 * Draws a ribbon. Positioned below the face center.
 * @param {object} state
 * @param {p5.Graphics | p5.Renderer} target
 * @param {number} faceScaleFactor
 */
function _drawRibbon(state, target = window, faceScaleFactor = 1.0) {
    target.push();

    const original = {
        offsetY: 45,
        bandW: 90, bandH: 16, bandCorner: 4, bandHighlightH: 7,
        knotW: 28, knotH: 20, knotHighlightW: 20, knotHighlightH: 8, knotHighlightOffsetY: -2,
        tailLen: 60, tailW: 18, tailKnotOffsetX: 8, tailKnotOffsetY: 8, tailBottomIndent: 8,
        highlightTailOffsetFactor: 0.8, highlightTailLengthFactor: 0.7, highlightTailReturnOffsetFactor: 0.6,
        strokeW: 1
    };

    // Scaled values
    const offsetY = original.offsetY * faceScaleFactor;
    const bandW = original.bandW * faceScaleFactor;
    const bandH = original.bandH * faceScaleFactor;
    const bandCorner = original.bandCorner * faceScaleFactor;
    const bandHighlightH = original.bandHighlightH * faceScaleFactor;
    const knotW = original.knotW * faceScaleFactor;
    const knotH = original.knotH * faceScaleFactor;
    const knotHighlightW = original.knotHighlightW * faceScaleFactor;
    const knotHighlightH = original.knotHighlightH * faceScaleFactor;
    const knotHighlightOffsetY = original.knotHighlightOffsetY * faceScaleFactor;
    const tailLen = original.tailLen * faceScaleFactor;
    const tailW = original.tailW * faceScaleFactor;
    const tailKnotOffsetX = original.tailKnotOffsetX * faceScaleFactor;
    const tailKnotOffsetY = original.tailKnotOffsetY * faceScaleFactor;
    const tailBottomIndent = original.tailBottomIndent * faceScaleFactor;
    const strokeW = Math.max(1, original.strokeW * faceScaleFactor);

    target.translate(0, offsetY);

    const mainColor = target.color(state.palette.cheeks[0] || 255, state.palette.cheeks[1] || 80, state.palette.cheeks[2] || 80);
    const highlightColor = target.color(Math.min(255, target.red(mainColor) + 50), Math.min(255, target.green(mainColor) + 50), Math.min(255, target.blue(mainColor) + 50));
    const shadowColor = target.color(target.red(mainColor) * 0.7, target.green(mainColor) * 0.7, target.blue(mainColor) * 0.7);

    // Ribbon band
    target.fill(mainColor);
    target.stroke(shadowColor);
    target.strokeWeight(strokeW);
    target.rect(-bandW / 2, -bandH / 2, bandW, bandH, bandCorner); // Center vertically

    // Band highlight
    target.noStroke();
    target.fill(highlightColor);
    target.rect(-bandW / 2, -bandH / 2, bandW, bandHighlightH, bandCorner, bandCorner, 0, 0);

    // Center knot
    target.fill(mainColor);
    target.stroke(shadowColor);
    target.ellipse(0, 0, knotW, knotH); // Centered knot
    target.noStroke();
    target.fill(highlightColor);
    target.ellipse(0, knotHighlightOffsetY, knotHighlightW, knotHighlightH);

    // Ribbon ends (tails) - define scaled control points
    const tailControl1X = tailW * 1.2;
    const tailControl1Y = tailLen * 0.3;
    const tailControl2X = tailW * 0.8;
    const tailControl2Y = tailLen * 0.7;
    const tailEndX = tailW * 0.4;
    const tailEndY = tailLen;
    const tailBottomY = tailLen - tailBottomIndent;
    const tailCurveControlY = tailLen * 0.6;
    const tailReturnControlX = 5 * faceScaleFactor;
    const tailReturnControlY = 15 * faceScaleFactor;

    target.fill(mainColor);
    target.stroke(shadowColor);
    // Left tail
    target.beginShape();
    target.vertex(-tailKnotOffsetX, tailKnotOffsetY);
    target.bezierVertex(-tailControl1X, tailControl1Y, -tailControl2X, tailControl2Y, -tailEndX, tailEndY);
    target.vertex(0, tailBottomY);
    target.bezierVertex(0, tailCurveControlY, -tailReturnControlX, tailReturnControlY, -tailKnotOffsetX, tailKnotOffsetY);
    target.endShape(target.CLOSE);
    // Right tail
    target.beginShape();
    target.vertex(tailKnotOffsetX, tailKnotOffsetY);
    target.bezierVertex(tailControl1X, tailControl1Y, tailControl2X, tailControl2Y, tailEndX, tailEndY);
    target.vertex(0, tailBottomY);
    target.bezierVertex(0, tailCurveControlY, tailReturnControlX, tailReturnControlY, tailKnotOffsetX, tailKnotOffsetY);
    target.endShape(target.CLOSE);

    // Tail highlights - define scaled control points
    const hlControl1X = tailW * original.highlightTailOffsetFactor;
    const hlControl1Y = tailLen * 0.2;
    const hlControl2X = tailW * 0.5;
    const hlControl2Y = tailLen * 0.5;
    const hlEndX = tailW * 0.3;
    const hlEndY = tailLen * original.highlightTailLengthFactor;
    const hlReturnCurveY = tailLen * original.highlightTailReturnOffsetFactor;
    const hlReturnControlX = 3 * faceScaleFactor;
    const hlReturnControlY = 12 * faceScaleFactor;

    target.noStroke();
    target.fill(highlightColor);
    // Left highlight
    target.beginShape();
    target.vertex(-tailKnotOffsetX, tailKnotOffsetY);
    target.bezierVertex(-hlControl1X, hlControl1Y, -hlControl2X, hlControl2Y, -hlEndX, hlEndY);
    target.bezierVertex(-hlReturnControlX * 0.6, hlReturnCurveY, -hlReturnControlX, hlReturnControlY, -tailKnotOffsetX, tailKnotOffsetY);
    target.endShape(target.CLOSE);
    // Right highlight
    target.beginShape();
    target.vertex(tailKnotOffsetX, tailKnotOffsetY);
    target.bezierVertex(hlControl1X, hlControl1Y, hlControl2X, hlControl2Y, hlEndX, hlEndY);
    target.bezierVertex(hlReturnControlX * 0.6, hlReturnCurveY, hlReturnControlX, hlReturnControlY, tailKnotOffsetX, tailKnotOffsetY);
    target.endShape(target.CLOSE);

    target.pop();
}


// --- Exports ---
window.drawAccessory = drawAccessory;

// --- END OF FILE src/rendering/accessories.js ---