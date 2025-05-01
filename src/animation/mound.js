// --- START OF FILE src/animation/mound.js ---

/**
 * Mound Shape Animation System for the Mound Mascot project.
 * Handles the deformation of mound vertices based on the selected animation type,
 * intensity, phase, and personality-specific easing.
 */

/**
 * Initializes mound animation state variables.
 */
function initMoundAnimation() {
  updateStateProperties({
      animationPhase: 0,
      secondaryPhase: 0,
      animationNeedsUpdate: true // Needs update on first frame
  });
  console.log("Mound animation system initialized.");
}

/**
 * Updates the mound vertex positions based on the current animation state.
 * Should be called once per frame (or less frequently based on performance).
 * Skips calculation if animation type is 'none' or if performance dictates skipping.
 */
function updateMoundVertices() {
  // Ensure p5 context and state functions are available
  if (typeof width === 'undefined' || typeof getState !== 'function' || typeof shouldPerformOperation !== 'function') {
      if (!window._moundUpdateWarned) console.warn("Cannot update mound vertices: Dependencies missing.");
      window._moundUpdateWarned = true;
      return;
  }

  const state = getState();
  const { moundVertices, moundAnimationType, animationNeedsUpdate } = state;

  // Skip if no animation type, vertices missing, or update not needed
  if (moundAnimationType === "none" || !moundVertices || moundVertices.length < 3) {
    // Ensure flag is false if no animation
    if (state.animationNeedsUpdate) updateState('animationNeedsUpdate', false);
    return;
  }

  // Check if performance allows animation update this frame
  if (!shouldPerformOperation("animation")) {
      // updateState('animationNeedsUpdate', false); // Keep flag true until it actually runs? No, let performance dictate.
      return; // Skip update this frame
  }

  // --- Perform Vertex Update ---
  // Create a new array for updated vertices to avoid issues if state updates mid-process elsewhere
  const updatedVertices = []; // Will be filled with updated {x, y, origX, origY, isKeyVertex}

  for (let i = 0; i < moundVertices.length; i++) {
      const vert = moundVertices[i];
      // Calculate animated position using the helper function
      const animPos = _calculateAnimatedVertexPosition(vert.origX, vert.origY, state);

      // Update vertex positions, keeping original coords intact
      updatedVertices.push({
          x: animPos.x,
          y: animPos.y,
          origX: vert.origX,
          origY: vert.origY,
          isKeyVertex: vert.isKeyVertex
      });
  }


  // Update the state with the new vertex positions
  updateState('moundVertices', updatedVertices);

  // Mark that the update has been performed for this cycle
  updateState('animationNeedsUpdate', false);
}


/**
 * Calculates the animated position for a single vertex based on state parameters.
 * Internal helper function.
 * @param {number} originalX - The original x-coordinate (before any animation).
 * @param {number} originalY - The original y-coordinate (before any animation).
 * @param {object} state - The current application state.
 * @returns {object} The new animated coordinates {x, y}.
 */
function _calculateAnimatedVertexPosition(originalX, originalY, state) {
  const {
    moundAnimationType,
    animationIntensity,
    animationPhase,
    secondaryPhase,
    apexY,
    personalityType
  } = state;

  // Ensure p5 context available for calculations
  if (typeof width === 'undefined' || typeof height === 'undefined' || typeof sin !== 'function') {
      return { x: originalX, y: originalY }; // Return original if p5 context missing
  }

  // Calculate normalized position relative to mound center/apex
  const centerX = width / 2;
  // Normalize X (-1 to 1 relative to width/2)
  const normalizedX = (originalX - centerX) / (width / 2);
   // Normalize Y (0 at apex, potentially > 1 at base)
  const moundHeight = height - apexY; // Approximate height
  const normalizedY = (originalY - apexY) / (moundHeight || 1); // Avoid division by zero


  // Calculate distance from center (0 to ~1+)
  // Optional optimization: Only calculate if needed by specific animation types
  let distFromCenter = 0;
  if (moundAnimationType === "pulse" || moundAnimationType === "breathe") {
      // Use a slightly cheaper distance approximation if needed, or precise for accuracy
      distFromCenter = Math.sqrt(normalizedX * normalizedX + normalizedY * normalizedY);
      distFromCenter = Math.min(1.5, distFromCenter); // Clamp to avoid extreme values at base
  }

  // Apply Easing based on animation phase, type, and personality
  // Map main phase (0 to TWO_PI) to easing input (0 to 1 and back to 0)
  const phaseProgress = (animationPhase % TWO_PI) / TWO_PI;
  // Use easing function from easing.js
  const easedProgress = applyEasing(phaseProgress, moundAnimationType, personalityType);
  // Convert eased progress (0-1) back to a sinusoidal-like value (-1 to 1) for displacement
  // Using sin directly on eased phase can be complex; mapping 0-1 back to -1 to 1 is often simpler.
  // Or, use the eased value directly if the animation logic expects 0-1. Let's try mapping back.
  const mainDisplacement = Math.sin(phaseProgress * TWO_PI) * easedProgress; // Modulate sine wave by eased value
  // Alternative: const mainDisplacement = (easedProgress * 2) - 1; // Map 0-1 directly to -1 to 1 (less smooth)


  // Secondary phase for more complex motion
  const secondaryDisplacement = Math.sin(secondaryPhase);

  // --- Calculate Offsets Based on Animation Type ---
  let offsetX = 0;
  let offsetY = 0;
  const baseStrength = 8 * animationIntensity; // Base multiplier for offset strength

  switch (moundAnimationType) {
    case "jello":
      // More horizontal stretch/squash, vertical wobble
      offsetX = mainDisplacement * normalizedY * baseStrength * 1.2; // Stronger horizontal effect based on height
      offsetY = Math.cos(animationPhase + normalizedX * PI) * (1-normalizedY) * baseStrength * 0.6; // Vertical counter-wobble
      break;

    case "breathe":
      // Radial expansion/contraction from center
      const breatheFactor = 0.7 + 0.3 * mainDisplacement; // Gentle expansion/contraction factor (0.7 to 1.3 approx)
      // Offset proportional to distance from center, more horizontal than vertical
      offsetX = normalizedX * distFromCenter * breatheFactor * baseStrength * 0.5;
      offsetY = normalizedY * distFromCenter * breatheFactor * baseStrength * 0.3;
      break;

    case "wobble":
      // Side-to-side motion, more pronounced at top
      offsetX = mainDisplacement * (1 - normalizedY * 0.5) * baseStrength * 1.5; // Strong side motion, less at base
      offsetY = secondaryDisplacement * normalizedY * baseStrength * 0.3; // Subtle vertical movement
      break;

    case "pulse":
      // Radial pulse, intensity based on distance from center
      const pulseFactor = 0.8 + 0.2 * mainDisplacement; // Pulsing factor (0.8 to 1.2 approx)
      offsetX = normalizedX * distFromCenter * pulseFactor * baseStrength * 0.6;
      offsetY = normalizedY * distFromCenter * pulseFactor * baseStrength * 0.6;
      break;

    case "sway":
      // Gentle side-to-side rocking motion
      offsetX = mainDisplacement * baseStrength * 0.8; // Consistent horizontal shift
       // Add slight vertical movement based on horizontal position for a 'lean'
      offsetY = Math.sin(animationPhase * 0.5 + normalizedX * PI * 0.8) * normalizedY * baseStrength * 0.2;
      break;
  }

  // Apply calculated offsets to the original vertex position
  return {
    x: originalX + offsetX,
    y: originalY + offsetY
  };
}


/**
 * Updates the animation phase variables based on time and performance.
 * Should be called once per frame after vertex updates.
 */
function updateAnimationPhases() {
  // Ensure p5 context and state functions are available
  if (typeof frameRate !== 'function' || typeof getState !== 'function') {
      if (!window._phaseUpdateWarned) console.warn("Cannot update animation phases: Dependencies missing.");
      window._phaseUpdateWarned = true;
      return;
  }

  const state = getState();
  const { moundAnimationType, animationPhase, secondaryPhase, personalityType, $fx } = state;

  // Skip during preview or if no animation
  if ($fx?.isPreview || moundAnimationType === "none") return;

  // --- Calculate Speed Multipliers ---
  // Base speed factor - adjust this to control overall animation speed
  const baseSpeed = 0.02;
  // Performance adjustment - slower animation at low FPS to reduce perceived lag
  const perfFactor = Math.min(1.0, (frameRate() / 30.0) * 0.8 + 0.2); // Scale speed between 20%-100% based on FPS vs 30 target
  // Personality adjustment
  let personalityFactor = 1.0;
  if (personalityType === "playful" || personalityType === "cheerful") personalityFactor = 1.2;
  else if (personalityType === "sleepy" || personalityType === "grumpy") personalityFactor = 0.8;

  // --- Determine Phase Increments ---
  let phaseIncrement = baseSpeed;
  let secondaryPhaseIncrement = baseSpeed * 0.6; // Secondary usually slower

  // Adjust speed based on animation type
  switch (moundAnimationType) {
      case "jello": phaseIncrement *= 1.3; secondaryPhaseIncrement *= 0.8; break;
      case "breathe": phaseIncrement *= 0.9; secondaryPhaseIncrement *= 0.5; break;
      case "wobble": phaseIncrement *= 0.8; secondaryPhaseIncrement *= 0.4; break;
      case "pulse": phaseIncrement *= 1.1; secondaryPhaseIncrement *= 0.7; break;
      case "sway": phaseIncrement *= 0.7; secondaryPhaseIncrement *= 0.3; break;
  }

  // --- Update Phases ---
  const newPhase = (animationPhase + phaseIncrement * perfFactor * personalityFactor) % TWO_PI;
  const newSecondaryPhase = (secondaryPhase + secondaryPhaseIncrement * perfFactor * personalityFactor) % TWO_PI;

  updateStateProperties({
      animationPhase: newPhase,
      secondaryPhase: newSecondaryPhase,
      animationNeedsUpdate: true // Flag that next frame should calculate vertex positions
  });
}


// --- Exports ---
window.initMoundAnimation = initMoundAnimation;
window.updateMoundVertices = updateMoundVertices; // Changed name for clarity
window.updateAnimationPhases = updateAnimationPhases;

// --- END OF FILE src/animation/mound.js ---