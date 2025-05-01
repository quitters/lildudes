// --- START OF FILE src/interaction/feedback.js ---

/**
 * Visual feedback for user interactions in the Mound Mascot project.
 * Currently triggers particle effects.
 */

/**
 * Initializes the feedback system (currently no specific initialization needed).
 */
function initInteractionFeedback() {
  // Placeholder for any future feedback system setup
  // console.log("Interaction feedback system initialized.");
}

/**
 * Triggers standard visual feedback for a user interaction.
 * Currently calls the function to create interaction particles.
 * Assumes createInteractionParticles is available globally from effects/particles.js.
 */
function addInteractionFeedback() {
  if (typeof createInteractionParticles === 'function') {
    createInteractionParticles();
  } else {
    console.warn("addInteractionFeedback: createInteractionParticles function not found.");
  }
}

// --- Exports ---
window.initInteractionFeedback = initInteractionFeedback;
window.addInteractionFeedback = addInteractionFeedback;

// --- END OF FILE src/interaction/feedback.js ---