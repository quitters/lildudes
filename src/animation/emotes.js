// --- START OF FILE src/animation/emotes.js ---

/**
 * Emote system and expression handling for the Mound Mascot project.
 * Manages triggering emotes, animation timing, blinking, and personality influence.
 */

// EMOTE_MAX_FRAMES is expected to be global via core/config.js

// Mapping from internal state mood codes to emote trigger keys (1-8)
// Used for clarity when triggering based on mood codes
const MOOD_TO_EMOTE_KEY = {
   0: 1, // Neutral -> Key 1
  '-1': 2, // Slight Frown -> Key 2
  '-2': 3, // Sad -> Key 3
   9: 4, // Happy -> Key 4
  10: 5, // Very Happy -> Key 5
  11: 6, // Surprised -> Key 6
  12: 7, // Sleepy -> Key 7
  99: 8  // Special -> Key 8 (Map a special code if needed)
};

// Mapping from standard emote keys (1-8) back to mood codes where applicable
// Useful for understanding what expression an emote key represents
const EMOTE_KEY_TO_MOOD = {
  1: 0,  // Neutral
  2: -1, // Slight Frown
  3: -2, // Sad
  4: 9,  // Happy
  5: 10, // Very Happy
  6: 11, // Surprised
  7: 12, // Sleepy
  8: 99  // Special (doesn't map directly to a simple mood)
};


/**
 * Initializes the emote system state variables.
 * Sets the initial mood based on personality.
 */
function initEmoteSystem() {
  const state = getState(); // Assumes getState is available
  if (!state || !state.personalityType) {
      console.error("Cannot init emotes: State or personalityType missing.");
      return;
  }
  const { personalityType } = state;

  // Determine initial mood based on personality (using mood codes)
  let initialMood = 0; // Default neutral
  // Use weighted random select based on personality weights defined in traits.js
  let moodWeights = {}; // Define weights as per traits.js logic
   if (personalityType === "shy") moodWeights = { '0': 4, '-1': 4, '-2': 1, '9': 0.5, '10': 0, '11': 0, '12': 0.5 };
   else if (personalityType === "playful") moodWeights = { '0': 3, '-1': 0.5, '-2': 0, '9': 3.5, '10': 2, '11': 1, '12': 0 };
   else if (personalityType === "grumpy") moodWeights = { '0': 2, '-1': 4, '-2': 3, '9': 0, '10': 0, '11': 0, '12': 1 };
   else if (personalityType === "cheerful") moodWeights = { '0': 2, '-1': 0, '-2': 0, '9': 4, '10': 3, '11': 1, '12': 0 };
   else if (personalityType === "sleepy") moodWeights = { '0': 3, '-1': 1, '-2': 0.5, '9': 0, '10': 0, '11': 0, '12': 4 };
   else if (personalityType === "curious") moodWeights = { '0': 3, '-1': 0, '-2': 0, '9': 2, '10': 0, '11': 4, '12': 1 };
   else moodWeights = { '0': 1 }; // Fallback

  const initialMoodStr = weightedRandomSelect(moodWeights) || "0"; // Uses util function
  initialMood = parseInt(initialMoodStr);

  console.log(`Setting initial mood to ${initialMood} (${getMoodName(initialMood)}) based on personality: ${personalityType}`);

  // Reset all emote-related state properties
  updateStateProperties({
    initialMood: initialMood,
    currentEmote: initialMood, // Start in the initial mood state
    emoteFrame: 0,
    blinkTimer: 0,
    emoteMemory: [], // Reset interaction memory related to emotes
    emoteHistory: {} // Reset history counts
  });
}

/**
 * Triggers a standard temporary emote animation (using keys 1-8).
 * Updates the state to start the emote and resets the frame counter.
 * Records the emote in interaction memory.
 * @param {number} emoteKey - The emote key (1-8) corresponding to the desired expression.
 */
function triggerEmoteByKey(emoteKey) {
    // Ensure valid key
    if (emoteKey < 1 || emoteKey > 8) {
        console.warn(`Invalid emote key: ${emoteKey}. Triggering neutral (1).`);
        emoteKey = 1;
    }

    const state = getState();
    if (!state) return;

    // Update state to show the new emote
    updateStateProperties({
        currentEmote: emoteKey, // Use the 1-8 key directly
        emoteFrame: 0
    });

    // Update interaction memory (pass the key)
    if (typeof updateInteractionMemory === 'function') {
        updateInteractionMemory(emoteKey);
    } else {
        console.warn("updateInteractionMemory function not found.");
    }

    // Provide visual feedback
     if (typeof addInteractionFeedback === 'function') {
        addInteractionFeedback();
    }
}

/**
 * Updates the emote animation frame count and handles transitions back to the initial mood.
 * Also manages blinking. Should be called once per frame in the main draw loop.
 */
function updateEmoteAnimation() {
  // Ensure p5 frameCount and state functions are available
  if (typeof frameCount === 'undefined' || typeof getState !== 'function') {
      if (!window._emoteUpdateWarned) console.warn("Cannot update emotes: frameCount or state functions missing.");
      window._emoteUpdateWarned = true;
      return;
  }

  const state = getState();
  const { currentEmote, emoteFrame, initialMood, $fx } = state;

  // Skip updates during fxhash preview
  if ($fx?.isPreview) return;

  // --- Update Active Emote Timer ---
  const isActiveEmote = currentEmote >= 1 && currentEmote <= 8; // Standard timed emotes are 1-8

  if (isActiveEmote) {
    const updatedFrame = emoteFrame + 1;
    const emoteDuration = EMOTE_MAX_FRAMES || 48; // Use global constant or default

    if (updatedFrame > emoteDuration) {
      // Emote finished, return to the initial mood state
      updateStateProperties({
          currentEmote: initialMood,
          emoteFrame: 0
      });
      // console.log(`Emote ${currentEmote} finished, returning to initial mood ${initialMood}`);
    } else {
      // Continue emote animation
      updateState('emoteFrame', updatedFrame);
    }
  } else if (currentEmote !== initialMood && currentEmote !== "blink") {
      // Safety check: If currentEmote is somehow not the initial mood and not an active emote (1-8) or blink,
      // force it back to the initial mood to prevent getting stuck.
      console.warn(`Correcting invalid emote state: ${currentEmote}. Resetting to initial mood: ${initialMood}`);
      updateStateProperties({
          currentEmote: initialMood,
          emoteFrame: 0
      });
  }


  // --- Handle Blinking ---
  // Blink only when in the initial mood state (not during active emotes 1-8)
  if (currentEmote === initialMood) {
     _updateBlinking(state);
  } else if (currentEmote === "blink") {
     // If currently blinking, advance blink frame count
     const updatedFrame = emoteFrame + 1;
     const blinkDuration = 15; // Make blink relatively quick
     if (updatedFrame > blinkDuration) {
         // Blink finished, return to initial mood
         updateStateProperties({
             currentEmote: initialMood,
             emoteFrame: 0,
             blinkTimer: 0 // Reset blink timer immediately after blink finishes
         });
     } else {
         updateState('emoteFrame', updatedFrame);
     }
  }

}

/** Internal helper to manage blinking logic. */
function _updateBlinking(state) {
  // Ensure necessary values exist
   if (typeof frameCount === 'undefined' || !state) return;

  const { blinkTimer, personalityType, initialMood } = state;

  // Don't blink during first few seconds
  if (frameCount < 120) return;

  // Increment timer
  const updatedBlinkTimer = blinkTimer + 1;

  // Determine blink interval and chance based on personality
  let blinkInterval = 120; // Default ~4 seconds at 30fps
  let blinkChance = 0.8;
  switch (personalityType) {
      case "sleepy": blinkInterval = 90; blinkChance = 0.9; break;
      case "curious": blinkInterval = 150; blinkChance = 0.7; break;
      case "grumpy": blinkInterval = 180; blinkChance = 0.75; break;
      case "playful": blinkInterval = 100; blinkChance = 0.85; break;
      case "shy": blinkInterval = 80; blinkChance = 0.9; break;
  }

  // Check if it's time to potentially blink
  if (updatedBlinkTimer > blinkInterval) {
    if (randomChance(blinkChance)) { // Use utility function
      // Trigger blink pseudo-emote
      updateStateProperties({
          currentEmote: "blink",
          emoteFrame: 0,
          blinkTimer: updatedBlinkTimer // Keep timer going until blink ends? Or reset now? Resetting after seems better.
      });
    } else {
      // If didn't blink, just reset the timer
      updateState('blinkTimer', 0);
    }
  } else {
    // If not time yet, just update timer
    updateState('blinkTimer', updatedBlinkTimer);
  }
}

/**
 * Gets the descriptive name for a given mood code.
 * @param {number} moodValue - The internal mood code (e.g., 0, -1, 9).
 * @returns {string} The descriptive name (e.g., "Neutral", "Sad", "Happy").
 */
function getMoodName(moodValue) {
  switch (moodValue) {
    case -2: return "Sad";
    case -1: return "Slight Frown";
    case 0: return "Neutral";
    case 9: return "Happy";
    case 10: return "Very Happy";
    case 11: return "Surprised";
    case 12: return "Sleepy";
    case 99: return "Special"; // If using 99 for special
    default: return `Unknown (${moodValue})`;
  }
}

// --- Exports ---
window.initEmoteSystem = initEmoteSystem;
window.triggerEmoteByKey = triggerEmoteByKey; // Renamed for clarity (expects 1-8)
window.updateEmoteAnimation = updateEmoteAnimation;
window.getMoodName = getMoodName; // Export mood name helper

// --- END OF FILE src/animation/emotes.js ---