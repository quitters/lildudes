// --- START OF FILE src/rendering/face.js ---

/**
 * Face rendering functions for the Mound Mascot project.
 * Handles drawing eyes, mouth, and cheeks based on current emote and personality.
 * Face elements now scale relative to canvas size.
 */

// Note: EMOTE_MAX_FRAMES is expected to be available globally from core/config.js

/**
 * Main face drawing function. Called within a translated context (origin at face center).
 * Handles different emotes, animations, personality variations, and special eyes.
 * @param {number} emote - The current emote code/ID (e.g., 0, -1, 9, 1-8, etc.).
 * @param {number} frameCountInEmote - The number of frames elapsed since the current emote started.
 * @param {p5.Graphics | p5.Renderer} [target=window] - The buffer or canvas to draw onto. // ADDED TARGET PARAM
 */
function drawFace(emote, frameCountInEmote, target = window) { // ADDED TARGET PARAM
  const state = getState(); // Assumes getState is available globally
  if (!state || !state.palette || !state.palette.cheeks || typeof target.width === 'undefined') {
      console.warn("Cannot draw face: State, palette, or target width missing.");
      return; // Cannot draw without state/palette or target dimensions
  }
  const { personalityType, hasMysteryEyes, initialMood } = state;

  // --- Calculate Scale Factor ---
  // Assume original design targeted a 600px wide canvas. Scale relative to current width.
  const referenceWidth = 600;
  // Ensure target.width is accessed correctly (it's a property, not a function)
  const currentWidth = target.width;
  const faceScaleFactor = Math.max(0.5, currentWidth / referenceWidth); // Don't scale below 50%

  // --- Base Expression Values (SCALED) ---
  // Define original design values and scale them
  const original = {
      eyeW: 12, eyeH: 22, eyeOffsetX: 48, eyeOffsetY: -12,
      mouthCurve: 0, cheekSize: 12, mouthWidth: 32, baseStrokeWeight: 4,
      cheekOffsetX: 32, cheekOffsetY: 5, mouthOffsetY: 10
  };

  let eyeW = original.eyeW * faceScaleFactor;
  let eyeH = original.eyeH * faceScaleFactor;
  let eyeOffsetX = original.eyeOffsetX * faceScaleFactor;
  let eyeOffsetY = original.eyeOffsetY * faceScaleFactor; // Scale Y offset too
  let mouthCurve = original.mouthCurve; // Curve value itself might not scale directly
  let cheekSize = original.cheekSize * faceScaleFactor;
  let mouthWidth = original.mouthWidth * faceScaleFactor;
  let strokeWeight = Math.max(1, original.baseStrokeWeight * faceScaleFactor); // Ensure minimum weight
  let cheekOffsetX = original.cheekOffsetX * faceScaleFactor;
  let cheekOffsetY = original.cheekOffsetY * faceScaleFactor;
  let mouthOffsetY = original.mouthOffsetY * faceScaleFactor;

  let drawStandardFeatures = true; // Flag to control drawing standard eyes/mouth/cheeks

  // --- Apply Personality Modifications to Scaled Base ---
  switch (personalityType) {
    case "playful":
      eyeW = (original.eyeW + 2) * faceScaleFactor; mouthCurve = 3; break;
    case "sleepy":
      eyeH = (original.eyeH - 6) * faceScaleFactor; eyeOffsetY = (original.eyeOffsetY + 2) * faceScaleFactor; mouthCurve = 0; break;
    case "curious":
      eyeW = (original.eyeW + 3) * faceScaleFactor; eyeH = (original.eyeH + 2) * faceScaleFactor; mouthCurve = 1; break;
    case "grumpy":
      eyeW = (original.eyeW - 1) * faceScaleFactor; eyeOffsetY = (original.eyeOffsetY - 2) * faceScaleFactor; mouthCurve = -4; break;
    case "cheerful":
      eyeW = (original.eyeW + 2) * faceScaleFactor; eyeH = (original.eyeH - 2) * faceScaleFactor; cheekSize = (original.cheekSize + 3) * faceScaleFactor; mouthCurve = 6; break;
    case "shy":
      eyeW = (original.eyeW - 1) * faceScaleFactor; eyeOffsetY = (original.eyeOffsetY - 2) * faceScaleFactor; eyeOffsetX = (original.eyeOffsetX - 2) * faceScaleFactor; mouthCurve = 1; break;
  }

  // --- Handle Initial Mood / Non-Standard Emotes ---
  if (emote !== initialMood && (emote < 1 || emote > 8)) {
      switch (emote) {
          case -1: mouthCurve = -3; break;
          case -2: mouthCurve = -8; eyeH *= 0.9; break;
          case 9: mouthCurve = 5; break;
          case 10: mouthCurve = 10; cheekSize = (original.cheekSize + 3) * faceScaleFactor; break;
          case 11: // Surprised (static)
              eyeW = (original.eyeW + 4) * faceScaleFactor; eyeH = (original.eyeH + 4) * faceScaleFactor; mouthCurve = 0;
              _drawEyes(eyeOffsetX, eyeOffsetY, eyeW, eyeH, eyeH, target, strokeWeight); // Pass target & weight
              _drawCheeks(state, cheekOffsetX, cheekOffsetY, cheekSize * 0.8, target); // Pass scaled offsets & target
              _drawSurprisedMouth(0.9, personalityType, target, faceScaleFactor); // Pass target & scale
              drawStandardFeatures = false;
              break;
          case 12: // Sleepy (static)
              eyeH = (original.eyeH * 0.4) * faceScaleFactor; mouthCurve = 0;
              break;
      }
  }

  // --- Handle Active Emote Animations (1-8) ---
  const emoteDuration = EMOTE_MAX_FRAMES || 48;
  let progress = clamp(frameCountInEmote / emoteDuration, 0, 1);
  let easedProgress = 0.5 - 0.5 * target.cos(progress * PI); // Use target.cos
  let fadeOutProgress = 1.0 - easedProgress;

  // Store calculated values before switch
  let currentMouthCurve = mouthCurve;
  let currentCheekSize = cheekSize;
  let currentEyeH = eyeH;
  let currentEyeW = eyeW;

  // Special transformations need push/pop
  let applyTransform = false;
  target.push(); // Start potential transform block

  switch (emote) {
    case 1: // Wink
      const winkEyeH = Math.max(3 * faceScaleFactor, currentEyeH * fadeOutProgress);
      _drawEyes(eyeOffsetX, eyeOffsetY, currentEyeW, currentEyeH, winkEyeH, target, strokeWeight); // Pass target & weight
      _drawCheeks(state, cheekOffsetX, cheekOffsetY, currentCheekSize, target); // Pass scaled offsets & target
      _drawMouth(mouthOffsetY, mouthWidth, (currentMouthCurve > 0 ? currentMouthCurve + 2 * easedProgress : 2 * easedProgress), target, strokeWeight); // Pass offsets & target
      drawStandardFeatures = false;
      break;

    case 2: // Tongue Out
      _drawEyes(eyeOffsetX, eyeOffsetY, currentEyeW, currentEyeH, currentEyeH, target, strokeWeight);
      _drawCheeks(state, cheekOffsetX, cheekOffsetY, currentCheekSize + (3 * faceScaleFactor) * easedProgress, target);
      _drawTongue(frameCountInEmote, personalityType, target, faceScaleFactor); // Pass target & scale
      drawStandardFeatures = false;
      break;

    case 3: // "No" Shake Head
      const shakeAngle = target.radians(10 + (personalityType === 'grumpy' ? 5 : 0)) * target.sin(progress * PI * 3);
      target.rotate(shakeAngle);
      currentMouthCurve = Math.min(currentMouthCurve, -2);
      applyTransform = true;
      break;

    case 4: // "Yes" Nod
       const nodScale = 1 + 0.1 * target.sin(progress * PI * 3);
       target.scale(1, nodScale);
       currentMouthCurve = Math.max(currentMouthCurve, 2);
       applyTransform = true;
       break;

    case 5: // Surprised (Animated)
      const surpriseFactor = (personalityType === 'shy' || personalityType === 'curious') ? 1.2 : (personalityType === 'grumpy' ? 0.8 : 1.0);
      const surpriseSize = 1 + 0.3 * easedProgress * surpriseFactor;
      _drawEyes(eyeOffsetX, eyeOffsetY, currentEyeW * surpriseSize, currentEyeH * surpriseSize, currentEyeH * surpriseSize, target, strokeWeight);
      _drawCheeks(state, cheekOffsetX, cheekOffsetY, currentCheekSize * (1 - 0.2 * easedProgress), target);
      _drawSurprisedMouth(easedProgress, personalityType, target, faceScaleFactor);
      drawStandardFeatures = false;
      break;

    case 6: // Sleepy (Animated)
      const sleepyFactor = (personalityType === 'sleepy') ? 1.5 : 1.0;
      currentEyeH = Math.max(3 * faceScaleFactor, currentEyeH * (1 - 0.7 * easedProgress * sleepyFactor));
      currentMouthCurve = 0;
      break;

    case 7: // Blushing
      const blushFactor = (personalityType === 'shy') ? 1.5 : (personalityType === 'grumpy' ? 0.5 : 1.0);
      currentCheekSize = currentCheekSize + (8 * faceScaleFactor) * easedProgress * blushFactor;
      currentMouthCurve = Math.max(currentMouthCurve, 1) + 4 * easedProgress;
      currentEyeH *= (1 - 0.1 * easedProgress);
      break;

    case 8: // Shocked / Special
      const shockFactor = (personalityType === 'curious' ? 1.3 : 1.0);
      const shockSize = 1 + 0.4 * easedProgress * shockFactor;
      _drawEyes(eyeOffsetX, eyeOffsetY, currentEyeW * shockSize * 1.1, currentEyeH * shockSize * 1.1, currentEyeH * shockSize * 1.1, target, strokeWeight);
      _drawCheeks(state, cheekOffsetX, cheekOffsetY, currentCheekSize * 0.6, target);
      _drawShockedMouth(easedProgress, personalityType, target, faceScaleFactor); // Pass target & scale
      drawStandardFeatures = false;
      break;

     case "blink":
        const blinkDuration = 15;
        const blinkProgressRaw = clamp(frameCountInEmote / blinkDuration, 0, 1);
        const blinkEased = (blinkProgressRaw <= 0.5)
            ? (0.5 - 0.5 * target.cos((blinkProgressRaw / 0.5) * PI))
            : (0.5 - 0.5 * target.cos(((1.0 - blinkProgressRaw) / 0.5) * PI));
        currentEyeH = Math.max(2 * faceScaleFactor, currentEyeH * (1 - blinkEased));
        currentMouthCurve = mouthCurve; // Use original base personality mouth during blink
        break;
  }

  // --- Draw Standard Features (if not handled by specific emote) ---
  if (drawStandardFeatures) {
    _drawEyes(eyeOffsetX, eyeOffsetY, currentEyeW, currentEyeH, currentEyeH, target, strokeWeight);
    _drawCheeks(state, cheekOffsetX, cheekOffsetY, currentCheekSize, target);
    _drawMouth(mouthOffsetY, mouthWidth, currentMouthCurve, target, strokeWeight);
  }

  // Pop the potential transform matrix
  target.pop();

  // --- Draw Mystery Eyes (if applicable) ---
  // Drawn outside the transform block
  if (hasMysteryEyes && emote !== "blink") {
    _drawMysteryEyes(eyeOffsetX, eyeOffsetY, target, faceScaleFactor); // Pass scale
  }
}

// --- Private Helper Functions (Modified for Scaling) ---

/** Draws the eyes. Can handle winking one eye. */
function _drawEyes(offsetX, offsetY, width, height, leftEyeHeight = height, target, strokeWeight) {
  target.fill(0); // Eyes are black
  target.noStroke();
  // Left eye (potentially different height for wink)
  target.ellipse(-offsetX, offsetY, width, leftEyeHeight);
  // Right eye
  target.ellipse(offsetX, offsetY, width, height);
}

/** Draws the cheeks using palette color. */
function _drawCheeks(state, offsetX, offsetY, size, target) { // Added offsetX, offsetY
   const cheekColor = state.palette.cheeks;
   target.fill(cheekColor[0], cheekColor[1], cheekColor[2]);
   target.noStroke();
   target.ellipse(-offsetX, offsetY, size, size); // Use scaled offsets
   target.ellipse(offsetX, offsetY, size, size);
}

/** Draws the mouth based on a curve value. */
function _drawMouth(offsetY, width, curve, target, strokeWeight) { // Added offsetY, width, strokeWeight
  target.push();
  target.translate(0, offsetY); // Use scaled offset Y
  target.noFill();
  target.stroke(0); // Black mouth
  target.strokeWeight(strokeWeight); // Use scaled weight
  target.strokeCap(ROUND);

  const maxCurveHeight = 15 * (strokeWeight / 4); // Scale max curve height with stroke weight

  if (Math.abs(curve) < 1) { // Neutral mouth (straight line)
    target.line(-width / 2, 0, width / 2, 0);
  } else {
     const curveHeight = clamp(curve * 1.5, -maxCurveHeight, maxCurveHeight); // Use scaled max height
     target.beginShape();
     target.vertex(-width / 2, 0);
     target.quadraticVertex(0, curveHeight, width / 2, 0);
     target.endShape();
  }
  target.pop();
}

/** Draws the tongue sticking out. */
function _drawTongue(frameCountInEmote, personalityType, target, scaleFactor) { // Added scaleFactor
  target.push();
  const mouthOffsetY = 10 * scaleFactor; // Scale offset
  const mouthWidth = 35 * scaleFactor;
  const mouthHeight = 25 * scaleFactor;
  target.translate(0, mouthOffsetY);

  // Mouth opening
  target.fill(0);
  target.noStroke();
  target.arc(0, 0, mouthWidth, mouthHeight, 0, PI);

  // Tongue
  const tongueColor = target.color(255, 100, 120);
  target.fill(tongueColor);

  let tongueWagSpeed = 0.3;
  let baseTongueStickOut = 10 * scaleFactor; // Scale stick out base
  let tongueWidth = 18 * scaleFactor;
  let tongueHeight = 14 * scaleFactor;
  let highlightOffsetY = -2 * scaleFactor;
  let highlightWidth = 12 * scaleFactor;
  let highlightHeight = 5 * scaleFactor;


  if (personalityType === 'playful') { tongueWagSpeed = 0.5; baseTongueStickOut *= 1.2; }
  if (personalityType === 'grumpy') { tongueWagSpeed = 0.2; baseTongueStickOut *= 0.8; }

  const wagAngle = target.sin(frameCountInEmote * tongueWagSpeed) * (PI / 16);
  const currentStickOut = (5 * scaleFactor) + baseTongueStickOut * (0.5 - 0.5 * target.cos(clamp(frameCountInEmote / 15, 0, 1) * PI));

  target.rotate(wagAngle);
  target.ellipse(0, currentStickOut, tongueWidth, tongueHeight);

  // Add subtle highlight
  target.fill(255, 150, 170);
  target.ellipse(0, currentStickOut + highlightOffsetY, highlightWidth, highlightHeight);

  target.pop();
}

/** Draws a surprised mouth (O shape). */
function _drawSurprisedMouth(progress, personalityType, target, scaleFactor) { // Added scaleFactor
  target.push();
  const mouthOffsetY = 10 * scaleFactor;
  target.translate(0, mouthOffsetY);
  target.fill(0);
  target.noStroke();

  let baseSize = 18 * scaleFactor; // Scale base size
  let expansion = 0.4;
  if (personalityType === 'shy') { baseSize *= 0.9; expansion = 0.5; }
  if (personalityType === 'grumpy') { baseSize *= 0.8; expansion = 0.3; }

  const mouthSize = baseSize * (1 + expansion * progress);
  target.ellipse(0, 0, mouthSize * 0.9, mouthSize);
  target.pop();
}

/** Draws a shocked mouth (larger O shape). */
function _drawShockedMouth(progress, personalityType, target, scaleFactor) { // Added scaleFactor
  target.push();
  const mouthOffsetY = 12 * scaleFactor; // Scale offset
  target.translate(0, mouthOffsetY);
  target.fill(0);
  target.noStroke();

  let baseSize = 22 * scaleFactor; // Scale base size
  let expansion = 0.5;
  if (personalityType === 'curious') { baseSize *= 1.1; expansion = 0.6; }
  if (personalityType === 'grumpy') { baseSize *= 0.8; expansion = 0.4; }

  const mouthSize = baseSize * (1 + expansion * progress);
  target.ellipse(0, 0, mouthSize, mouthSize);
  target.pop();
}

/** Draws special mystery eyes. */
function _drawMysteryEyes(offsetX, offsetY, target, scaleFactor) { // Added scaleFactor
  const glowColor = target.color(200, 255, 220, 150);
  const pupilColor = target.color(50, 200, 100);
  const starInnerR = 2 * scaleFactor; // Scale star size
  const starOuterR = 5 * scaleFactor;
  const glowBaseSize = 10 * scaleFactor; // Scale glow size

  target.push();
  target.noStroke();

  // Glow effect behind eyes
  for (let i = 3; i > 0; i--) {
      target.fill(red(glowColor), green(glowColor), blue(glowColor), 50 / i);
      target.ellipse(-offsetX, offsetY, glowBaseSize * i, glowBaseSize * i);
      target.ellipse(offsetX, offsetY, glowBaseSize * i, glowBaseSize * i);
  }

  // Draw star-shaped pupils
  target.fill(pupilColor);
  _drawStarLocal(-offsetX, offsetY, starInnerR, starOuterR, 5, target); // Use local helper, pass target
  _drawStarLocal(offsetX, offsetY, starInnerR, starOuterR, 5, target);

  target.pop();
}

// --- Local Helper Functions ---

/** Local helper to draw a star shape. */
function _drawStarLocal(cx, cy, innerR, outerR, points, target) { // Added target
  let angleStep = TWO_PI / (points * 2);
  target.beginShape();
  for (let i = 0; i < points * 2; i++) {
    let r = (i % 2 === 0) ? outerR : innerR;
    // Use target's cos/sin
    let sx = cx + target.cos(i * angleStep - PI / 2) * r;
    let sy = cy + target.sin(i * angleStep - PI / 2) * r;
    target.vertex(sx, sy);
  }
  target.endShape(CLOSE);
}

// Clamp function (local helper)
function clamp(value, min, max) {
  return Math.max(min, Math.min(value, max));
}

// --- Exports ---
window.drawFace = drawFace;

// --- END OF FILE src/rendering/face.js ---