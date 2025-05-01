// --- START OF FILE src/animation/idle.js ---

/**
 * Idle animation management for the Mound Mascot project.
 * Handles non-interactive automatic animations like bobbing, looking around,
 * and squash/stretch when no specific emote is active.
 */

/**
 * Initializes idle animation state variables.
 */
function initIdleAnimation() {
  // Reset idle state variables
  updateStateProperties({
      idleTimer: 0, // Timer controlling when to change idle state
      idleState: 0, // 0: None, 1: Bob, 2: Look, 3: Squash/Stretch
      breathePhase: 0 // Separate phase for subtle breathing (might be part of mound anim instead)
  });
  console.log("Idle animation system initialized.");
}

/**
 * Updates the idle state periodically based on personality and chance.
 * Determines which idle action (if any) should be active.
 * Should be called once per frame in the main animation update logic.
 */
function updateIdleState() {
  // Ensure p5 frameCount and state functions are available
  if (typeof frameCount === 'undefined' || typeof getState !== 'function') {
    if (!window._idleUpdateWarned) console.warn("Cannot update idle state: frameCount or state functions missing.");
    window._idleUpdateWarned = true;
    return;
  }

  const state = getState();
  const { idleTimer, currentEmote, initialMood, personalityType, $fx } = state;

  // Don't update idle state during first few seconds or during preview
  if (frameCount < 120 || $fx?.isPreview) return;

  // Only consider changing idle state if the mascot is in its default mood
  if (currentEmote === initialMood) {
    const updatedIdleTimer = idleTimer + 1;

    // Check roughly every 3-5 seconds (adjust interval based on desired frequency)
    const checkInterval = 90 + randomInt(0, 60); // 3-5 seconds at 30fps
    if (updatedIdleTimer > checkInterval) {
      updateState('idleTimer', 0); // Reset timer

      // Determine chance of performing an idle action based on personality
      let idleActionChance = 0.20; // Base 20% chance
      switch (personalityType) {
        case "playful": idleActionChance = 0.40; break;
        case "sleepy": idleActionChance = 0.10; break; // Less fidgety
        case "curious": idleActionChance = 0.35; break;
        case "grumpy": idleActionChance = 0.15; break; // Mostly still
        case "cheerful": idleActionChance = 0.30; break;
        case "shy": idleActionChance = 0.12; break; // Very still
      }

      if (randomChance(idleActionChance)) {
        // Choose an idle action based on weighted personality preferences
        // Idle states: 0: None, 1: Bob, 2: Look, 3: Squash/Stretch
        let idleWeights = { 1: 1, 2: 1, 3: 1 }; // Default equal weights

        switch (personalityType) {
          case "playful": idleWeights = { 1: 3, 2: 4, 3: 3 }; break; // Looks and bobs
          case "sleepy": idleWeights = { 1: 2, 2: 0.5, 3: 4 }; break; // Stretches/yawns, little looking
          case "curious": idleWeights = { 1: 1, 2: 5, 3: 1 }; break; // Looks around a lot
          case "grumpy": idleWeights = { 1: 1, 2: 2, 3: 1 }; break; // Occasional look
          case "cheerful": idleWeights = { 1: 4, 2: 2, 3: 3 }; break; // Bobs happily
          case "shy": idleWeights = { 1: 3, 2: 0.5, 3: 2 }; break; // Subtle bob/stretch
        }
        const selectedIdleState = parseInt(weightedRandomSelect(idleWeights) || "1"); // Default to bob
        updateState('idleState', selectedIdleState);
        // console.log(`Idle action started: ${selectedIdleState}`);
      } else {
        // If chance fails, ensure idle state is 0 (inactive)
        if (state.idleState !== 0) {
           updateState('idleState', 0);
           // console.log("Idle action stopped.");
        }
      }
    } else {
      // Increment timer if not checking yet
      updateState('idleTimer', updatedIdleTimer);
    }
  } else {
     // If not in initial mood, ensure idle state is inactive and reset timer
     if (state.idleState !== 0) updateState('idleState', 0);
     if (state.idleTimer !== 0) updateState('idleTimer', 0);
  }
}

/**
 * Applies the visual transformation (translate, scale) for the current idle animation state.
 * Should be called within the face/accessory drawing context (e.g., in drawFaceAndAccessories)
 * ONLY when the mascot is in its initial/idle mood.
 */
function applyIdleTransform() {
  // Ensure p5 context and state functions are available
  if (typeof frameCount === 'undefined' || typeof getState !== 'function') {
      if (!window._idleApplyWarned) console.warn("Cannot apply idle transform: frameCount or state functions missing.");
      window._idleApplyWarned = true;
      return;
  }

  const state = getState();
  // IMPORTANT: Only apply if actually in idle state (currentEmote === initialMood was checked by caller)
  const { idleState, personalityType } = state;

  if (idleState <= 0) return; // No active idle animation

  // Apply transformation based on the active idleState
  switch (idleState) {
    case 1: // Bobbing
      let bobAmount = 3;
      let bobSpeed = 0.08;
      if (personalityType === "cheerful") { bobAmount = 4; bobSpeed = 0.1; }
      else if (personalityType === "sleepy") { bobAmount = 2; bobSpeed = 0.06; }
      const bobY = sin(frameCount * bobSpeed) * bobAmount;
      translate(0, bobY);
      break;

    case 2: // Looking Around
      let lookAmount = 12;
      let lookSpeed = 0.04;
      if (personalityType === "curious") { lookAmount = 18; lookSpeed = 0.05; }
      else if (personalityType === "shy") { lookAmount = 8; lookSpeed = 0.03; }
      const lookX = sin(frameCount * lookSpeed) * lookAmount;
      translate(lookX, 0);
      break;

    case 3: // Squash/Stretch
      let squashAmount = 0.04;
      let squashSpeed = 0.07;
      if (personalityType === "playful") { squashAmount = 0.06; squashSpeed = 0.09; }
      else if (personalityType === "grumpy") { squashAmount = 0.03; squashSpeed = 0.06; }
      const squashFactor = 1 + sin(frameCount * squashSpeed) * squashAmount;
      // Scale vertically and horizontally inversely around the base (approx y=0 in translated context)
      // translate(0, (1 - squashFactor) * -30); // Adjust origin slightly based on squash
      scale(1 / squashFactor, squashFactor);
      break;
  }
}

/**
 * Updates animation timers related to idle behavior (like breathePhase).
 * Should be called once per frame.
 */
function updateIdleTimers() {
   // Ensure state function available
   if (typeof getState !== 'function') return;
   const state = getState();
   if (!state || state.$fx?.isPreview) return; // Don't update timers during preview

   // Update breathe phase (used for subtle background breathing animation)
   // Consider moving this if breathing is part of the main mound animation type
   const updatedBreathePhase = (state.breathePhase || 0) + 0.03; // Adjust speed as needed
   updateState('breathePhase', updatedBreathePhase % TWO_PI); // Keep phase within 0-TWO_PI
}


// --- Exports ---
window.initIdleAnimation = initIdleAnimation;
window.updateIdleState = updateIdleState;
window.applyIdleTransform = applyIdleTransform;
window.updateIdleTimers = updateIdleTimers;

// --- END OF FILE src/animation/idle.js ---