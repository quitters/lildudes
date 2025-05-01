// --- START OF FILE src/interaction/inputs.js ---

/**
 * Input handling for the Mound Mascot project.
 * Manages key presses for emotes, debug, saving, showcase toggle,
 * and delegates to showcase handler when active. Manages Controls Help UI.
 */

/**
 * Initializes input handlers, primarily setting up the Controls Help UI toggle.
 */
function initInputHandlers() {
  setupControlsHelpToggle();
  console.log("Input handlers initialized.");
}

/**
 * Sets up the event listener for the Controls Help toggle button.
 */
function setupControlsHelpToggle() {
  // Ensure DOM is ready
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    _setupHelpUI();
  } else {
    document.addEventListener('DOMContentLoaded', _setupHelpUI);
  }
}

/** Internal helper to attach listeners to Controls Help UI elements. */
function _setupHelpUI() {
    const controlsButton = document.getElementById('show-controls-button');
    const controlsHelp = document.getElementById('controls-help');

    if (controlsButton && controlsHelp) {
        controlsButton.addEventListener('click', () => {
            const isHidden = controlsHelp.classList.toggle('controls-hidden');
            controlsButton.textContent = isHidden ? '?' : '×'; // Use '×' for close
            controlsButton.title = isHidden ? 'Show controls' : 'Hide controls';
        });

        // Optional: Briefly show controls on load then hide
        /*
        setTimeout(() => {
            if(controlsHelp.classList.contains('controls-hidden')) { // Only show if hidden
                 controlsHelp.classList.remove('controls-hidden');
                 controlsButton.textContent = '×';
                 controlsButton.title = 'Hide controls';
                 setTimeout(() => {
                     controlsHelp.classList.add('controls-hidden');
                     controlsButton.textContent = '?';
                     controlsButton.title = 'Show controls';
                 }, 5000); // Hide after 5 seconds
            }
        }, 2500);
        */
    } else {
        console.warn("Controls Help UI elements ('show-controls-button', 'controls-help') not found.");
    }
}


/**
 * Unified key press handler for the application.
 * Called by p5.js. Delegates actions based on application mode (normal or showcase).
 */
function handleKeyPressed() {
  // Ensure state and dependent functions are available
  if (typeof getState !== 'function' || typeof key === 'undefined' || typeof keyCode === 'undefined') {
      if (!window._keyInputWarned) console.warn("Cannot handle key press: Dependencies missing.");
      window._keyInputWarned = true;
      return;
  }

  const state = getState();

  // --- Mode-Based Routing ---
  if (state.showcaseActive) {
    // --- Showcase Mode ---
    if (typeof handleShowcaseInput === 'function') {
      handleShowcaseInput(key, keyCode); // Delegate to showcase handler
    } else {
      console.warn("handleShowcaseInput function not found.");
    }
    // Prevent default browser action for keys used in showcase (arrows, space)
    if (keyCode === LEFT_ARROW || keyCode === RIGHT_ARROW || keyCode === UP_ARROW || keyCode === DOWN_ARROW || key === ' ') {
       // return false; // p5.js way to prevent default
    }
  } else {
    // --- Normal Mode ---
    const keyLower = key.toLowerCase();

    if (key >= '1' && key <= '8') {
      // Emote Keys (1-8)
      const emoteKey = parseInt(key);
      if (typeof triggerEmoteByKey === 'function') {
        triggerEmoteByKey(emoteKey); // Trigger emote (animation/emotes.js)
      } else {
        console.warn("triggerEmoteByKey function not found.");
      }
      // No need to call feedback/memory here, triggerEmoteByKey should handle it
    }
    else if (keyLower === 'd') {
      // Debug Toggle / Log Details
      if (typeof logMoundDetails === 'function') logMoundDetails(); // Log details (core/logging.js)
      const debugPanel = document.getElementById('debug-panel');
      const debugButton = document.getElementById('debug-button');
      if (debugPanel && debugButton) {
          const isActive = debugPanel.classList.toggle('active');
           if (isActive && typeof populateDebugContent === 'function') {
              populateDebugContent(); // Populate when opened
           }
      } else {
          console.warn("Debug panel elements not found.");
      }
    }
    else if (keyLower === 'r') {
      // Reset/Reload (Requires $fx context)
      if (state.$fx && typeof state.$fx.rand === 'function' && typeof state.$fx.rand.reset === 'function') {
        console.log("Resetting fxrand and reloading...");
        state.$fx.rand.reset(); // Reset fxrand state
        window.location.reload();
      } else {
        console.warn("Cannot reset: $fx.rand.reset not available.");
      }
    }
    else if (keyLower === 's') {
      // Save Canvas
      if (typeof saveCanvas === 'function') {
        const filename = `mound-mascot-${state.$fx?.hash || 'dev'}`;
        saveCanvas(filename, 'png');
        console.log(`Canvas saved as ${filename}.png`);
      } else {
         console.warn("saveCanvas function not available.");
      }
    }
    else if (keyLower === 'p') {
      // Save Preview Image (for static preview generation)
       if (typeof saveCanvas === 'function') {
          saveCanvas('image', 'png'); // Save as 'image.png' for preview.html
          console.log("Preview image saved as image.png");
      } else {
         console.warn("saveCanvas function not available.");
      }
    }
    else if (keyLower === 'b') {
      // Toggle Background Showcase
      if (typeof toggleShowcase === 'function') {
        toggleShowcase(); // Function from interaction/backgroundShowcase.js
      } else {
        console.warn("toggleShowcase function not found.");
      }
    }
     // Prevent default browser action for spacebar if used
     // if (key === ' ') return false;
  }
}

// --- Assign to p5.js global ---
// This ensures p5 calls our unified handler
window.keyPressed = handleKeyPressed;

// --- Exports ---
// Export initialization function
window.initInputHandlers = initInputHandlers;

// --- END OF FILE src/interaction/inputs.js ---