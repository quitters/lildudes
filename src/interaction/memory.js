// --- START OF FILE src/interaction/memory.js ---

/**
 * Interaction Memory System for the Mound Mascot project.
 * Tracks user interactions (emote triggers), identifies patterns and milestones,
 * and triggers personalized responses like messages or special animations.
 */

/**
 * Initializes the interaction memory object in the global state.
 */
function initInteractionMemory() {
  updateState('interactionMemory', {
    interactions: {},       // Counts per emote key (1-8)
    favoriteEmoteKey: null, // Stores the most frequent emote key (1-8)
    lastInteractions: [],   // Stores the keys (1-8) of the last ~5 interactions
    totalInteractions: 0,
    milestones: {           // Flags for one-time milestone reactions
      hasTenInteractions: false,
      hasTwentyInteractions: false,
      hasThirtyInteractions: false
    }
  });
  console.log("Interaction memory initialized.");
}

/**
 * Updates the interaction memory when a standard emote (1-8) is triggered.
 * Calculates favorite emote, checks for milestones and patterns, and triggers reactions.
 * @param {number} emoteKey - The key (1-8) of the triggered emote.
 */
function updateInteractionMemory(emoteKey) {
  // Ensure valid emote key and state functions
  if (emoteKey < 1 || emoteKey > 8 || typeof getState !== 'function') {
    return;
  }

  const state = getState();
  // Ensure memory object exists, initialize if not (shouldn't happen if init called)
  const memory = state.interactionMemory || { interactions: {}, lastInteractions: [], totalInteractions: 0, milestones: {}, favoriteEmoteKey: null };
  // Create a deep copy to modify safely if needed, though direct update might be fine here
   const currentInteractions = { ...(memory.interactions || {}) };
   const currentLastInteractions = [...(memory.lastInteractions || [])];
   const currentMilestones = { ...(memory.milestones || {}) };


  // --- Update Counts & History ---
  const interactionType = String(emoteKey); // Use string key for object property safety
  currentInteractions[interactionType] = (currentInteractions[interactionType] || 0) + 1;
  const newTotalInteractions = (memory.totalInteractions || 0) + 1;

  // Add to recent history (keep last 5)
  currentLastInteractions.unshift(emoteKey); // Store the number key
  if (currentLastInteractions.length > 5) {
    currentLastInteractions.pop();
  }

  // --- Determine Favorite Emote ---
  let maxCount = 0;
  let favoriteKey = memory.favoriteEmoteKey; // Keep previous if no new favorite
  for (const [key, count] of Object.entries(currentInteractions)) {
    if (count > maxCount) {
      maxCount = count;
      favoriteKey = parseInt(key); // Store as number
    }
  }

  // --- Check Milestones ---
  let milestoneTriggered = null;
  if (newTotalInteractions >= 10 && !currentMilestones.hasTenInteractions) {
    currentMilestones.hasTenInteractions = true;
    milestoneTriggered = "ten_interactions";
  } else if (newTotalInteractions >= 20 && !currentMilestones.hasTwentyInteractions) {
    currentMilestones.hasTwentyInteractions = true;
    milestoneTriggered = "twenty_interactions";
  } else if (newTotalInteractions >= 30 && !currentMilestones.hasThirtyInteractions) {
    currentMilestones.hasThirtyInteractions = true;
    milestoneTriggered = "thirty_interactions";
  }

  // --- Update State ---
  // Update memory object in one go
  updateState('interactionMemory', {
      interactions: currentInteractions,
      favoriteEmoteKey: favoriteKey,
      lastInteractions: currentLastInteractions,
      totalInteractions: newTotalInteractions,
      milestones: currentMilestones
  });

  // --- Trigger Reactions ---
  // Prioritize milestone reactions over pattern reactions
  if (milestoneTriggered) {
    triggerSpecialReaction(milestoneTriggered); // Pass type
  } else if (detectPattern(currentLastInteractions)) {
    // Only trigger pattern reaction if no milestone was hit this interaction
    triggerPatternReaction(currentLastInteractions);
  }
}

/**
 * Triggers a special reaction based on interaction milestones.
 * Reads necessary info (favorite emote, personality) from state.
 * @param {string} milestone - Identifier for the milestone (e.g., "ten_interactions").
 */
function triggerSpecialReaction(milestone) {
  const state = getState();
  if (!state || !state.interactionMemory) return;

  const favoriteKey = state.interactionMemory.favoriteEmoteKey;
  const personality = state.personalityType;
  let message = "";
  let reactionEmoteKey = null; // Emote key (1-8) to trigger

  switch (milestone) {
    case "ten_interactions":
      if (favoriteKey) {
          reactionEmoteKey = favoriteKey; // Repeat favorite emote
          message = `I like when you make me ${getEmoteName(favoriteKey)}!`;
      } else {
          reactionEmoteKey = 4; // Default happy if no favorite yet
          message = "Thanks for interacting!";
      }
      break;

    case "twenty_interactions":
      if (personality === "playful" || personality === "cheerful") {
        reactionEmoteKey = 5; // Big smile
        message = "We're becoming friends! This is fun!";
      } else if (personality === "shy") {
        reactionEmoteKey = 4; // Happy smile (progress!)
        message = "I'm getting used to you...";
      } else if (personality === "grumpy") {
        reactionEmoteKey = 1; // Neutral (reluctant acceptance)
        message = "Hm. You're still here.";
      } else { // Curious, Sleepy
        reactionEmoteKey = 4; // Happy smile
        message = "You interact a lot!";
      }
      break;

    case "thirty_interactions":
      // Trigger a special animation instead of just an emote
      triggerSpecialAnimation(); // Defined below
      message = "Wow! You really seem to like me!";
      // No immediate emote change, let the special animation play
      break;
  }

  // Trigger emote reaction if one was chosen
  if (reactionEmoteKey && typeof triggerEmoteByKey === 'function') {
    triggerEmoteByKey(reactionEmoteKey);
  }

  // Show message if generated
  if (message) {
    updateStateProperties({
        message: message,
        messageTimer: 150 // Show for ~2.5 seconds
    });
  }
}

/**
 * Detects simple patterns (repetition, alternation) in recent interactions.
 * @param {Array<number>} recentInteractions - Array of recent emote keys (1-8).
 * @returns {string | null} The type of pattern detected ("repetition", "alternation") or null.
 */
function detectPattern(recentInteractions) {
  if (!recentInteractions || recentInteractions.length < 3) return null;

  // Repetition: A, A, A
  if (recentInteractions[0] === recentInteractions[1] && recentInteractions[1] === recentInteractions[2]) {
    return "repetition";
  }

  // Alternation: A, B, A, B, A (requires length 5)
  if (recentInteractions.length >= 5 &&
      recentInteractions[0] === recentInteractions[2] &&
      recentInteractions[2] === recentInteractions[4] &&
      recentInteractions[1] === recentInteractions[3] &&
      recentInteractions[0] !== recentInteractions[1]) { // Ensure A and B are different
    return "alternation";
  }

  return null;
}

/**
 * Triggers a reaction based on detected interaction patterns.
 * @param {Array<number>} patternInteractions - The sequence of interactions forming the pattern.
 */
function triggerPatternReaction(patternInteractions) {
    const state = getState();
    if (!state) return;
    const personality = state.personalityType;
    const patternType = detectPattern(patternInteractions); // Re-detect to be sure

    let message = "";
    let reactionEmoteKey = null;

    if (patternType === "repetition") {
        const repeatedEmote = patternInteractions[0];
        if (personality === "playful") {
            reactionEmoteKey = 6; // Surprised
            message = `Again? You really like ${getEmoteName(repeatedEmote)}!`;
        } else if (personality === "grumpy") {
            reactionEmoteKey = 2; // Slight frown
            message = "Okay, okay, I get it.";
        } else { // Shy, Curious, Sleepy, Cheerful
            reactionEmoteKey = repeatedEmote; // Mimic
            message = "Hehe, like this?";
        }
    } else if (patternType === "alternation") {
        if (personality === "curious") {
             reactionEmoteKey = 6; // Surprised
             message = "Ooh, a pattern!";
        } else if (personality === 'playful') {
            reactionEmoteKey = 2; // Tongue out / Teasing
            message = "Trying to trick me?";
        } else {
             reactionEmoteKey = 4; // Happy / Acknowledgment
             message = "I see what you did there!";
        }
    }

    // Trigger reaction
     if (reactionEmoteKey && typeof triggerEmoteByKey === 'function') {
        triggerEmoteByKey(reactionEmoteKey);
    }
    if (message) {
        updateStateProperties({ message: message, messageTimer: 120 }); // Show for ~2 seconds
    }
}


/**
 * Triggers a special, short animation effect based on personality.
 * Used as a milestone reward. Sets the 'specialAnimation' state.
 */
function triggerSpecialAnimation() {
  const state = getState();
  if (!state) return;
  const personality = state.personalityType;

  let animType = "bounce"; // Default effect
  let intensity = 1.0;
  let duration = 75; // Frames

  switch (personality) {
    case "playful": case "cheerful":
      animType = "bounce"; intensity = 1.5; duration = 90; break;
    case "shy":
      animType = "blush"; intensity = 1.2; duration = 70; break; // Blush effect
    case "grumpy":
      animType = "wiggle"; intensity = 0.8; duration = 50; break; // Reluctant wiggle
    case "sleepy":
        animType = "pulse"; intensity = 0.7; duration = 90; break; // Slow pulse
    case "curious":
       animType = "party"; intensity = 1.0; duration = 80; break; // Confetti/sparkles
  }

  updateState('specialAnimation', {
    type: animType,
    duration: duration, // Duration in frames
    initialDuration: duration, // Store initial for progress calculation
    intensity: intensity
  });
  console.log(`Triggered special animation: ${animType}`);
}


/**
 * Helper function to get a friendly display name for an emote key (1-8).
 * @param {number} emoteKey - The emote key (1-8).
 * @returns {string} A user-friendly description.
 */
function getEmoteName(emoteKey) {
  // Use the key-to-mood mapping where applicable
  const moodCode = EMOTE_KEY_TO_MOOD[emoteKey];
  if (moodCode !== undefined && moodCode !== 99) {
      // Use the main getMoodName function for consistency
      if (typeof window.getMoodName === 'function') { // Check if global function exists
         return window.getMoodName(moodCode).toLowerCase();
      } else {
         // Fallback internal mapping if global isn't ready/available
          switch(moodCode) {
              case 0: return "neutral";
              case -1: return "a bit sad";
              case -2: return "sad";
              case 9: return "happy";
              case 10: return "very happy";
              case 11: return "surprised";
              case 12: return "sleepy";
              default: return "a face";
          }
      }
  } else if (emoteKey === 8) {
      return "surprised"; // Or whatever key 8 represents ('Special'?)
  } else {
      return `emote ${emoteKey}`; // Fallback
  }
}

// --- Exports ---
window.initInteractionMemory = initInteractionMemory;
window.updateInteractionMemory = updateInteractionMemory;
// triggerSpecialReaction, detectPattern, triggerPatternReaction, triggerSpecialAnimation are mostly internal helpers called by updateInteractionMemory

// --- END OF FILE src/interaction/memory.js ---