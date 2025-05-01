// --- START OF FILE src/interaction/backgroundShowcase.js ---

/**
 * Background Showcase Mode Manager for the Mound Mascot project.
 * Handles state, navigation, and UI overlay for showcasing different backgrounds.
 */

/**
 * Initializes the state variables required for the background showcase mode.
 * Should be called once during setup.
 */
function initShowcase() {
    // Ensure ALL_BACKGROUND_TYPES is available from backgroundManager.js
    const bgTypes = window.ALL_BACKGROUND_TYPES || ["gradient", "hills", "dots", "noise", "grid", "stars", "waves", "stripes", "forest_hills"]; // Fallback list

    updateStateProperties({
        showcaseActive: false,
        showcaseIndex: 0,
        showcaseTypes: [...bgTypes] // Store a copy of available types
    });
    console.log("Background Showcase initialized.");
}

/**
 * Toggles the background showcase mode on or off by updating the state.
 */
function toggleShowcase() {
    const state = getState();
    if (!state) return;

    const newActiveState = !state.showcaseActive;
    updateState('showcaseActive', newActiveState);

    console.log(`Background Showcase ${newActiveState ? 'activated' : 'deactivated'}.`);

    // If activating, log the current background
    if (newActiveState) {
        const currentBg = state.showcaseTypes[state.showcaseIndex];
        console.log(`Showcase starting with: ${currentBg}`);
         // Optional: Reset mound visibility or position if desired during showcase
         // updateState('showMoundInShowcase', false);
    } else {
        // Optional: Restore mound visibility/position when exiting
         // updateState('showMoundInShowcase', true);
    }

    // Ensure p5 loop is running when showcase starts/stops
    if (typeof loop === 'function') loop();
}

/**
 * Navigates to the next background in the showcase list.
 */
function nextShowcaseBg() {
    const state = getState();
    if (!state || !state.showcaseActive || !state.showcaseTypes?.length) return;

    const newIndex = (state.showcaseIndex + 1) % state.showcaseTypes.length;
    updateState('showcaseIndex', newIndex);
    console.log(`Showcase next: ${state.showcaseTypes[newIndex]} (${newIndex + 1}/${state.showcaseTypes.length})`);
    if (typeof loop === 'function') loop(); // Ensure redraw
}

/**
 * Navigates to the previous background in the showcase list.
 */
function prevShowcaseBg() {
    const state = getState();
    if (!state || !state.showcaseActive || !state.showcaseTypes?.length) return;

    const newIndex = (state.showcaseIndex - 1 + state.showcaseTypes.length) % state.showcaseTypes.length;
    updateState('showcaseIndex', newIndex);
    console.log(`Showcase previous: ${state.showcaseTypes[newIndex]} (${newIndex + 1}/${state.showcaseTypes.length})`);
     if (typeof loop === 'function') loop(); // Ensure redraw
}

/**
 * Jumps to a specific background index in the showcase list.
 * @param {number} index - The 0-based index of the background type to show.
 */
function gotoShowcaseBg(index) {
    const state = getState();
    if (!state || !state.showcaseActive || !state.showcaseTypes?.length) return;

    if (index >= 0 && index < state.showcaseTypes.length) {
        updateState('showcaseIndex', index);
        console.log(`Showcase jump: ${state.showcaseTypes[index]} (${index + 1}/${state.showcaseTypes.length})`);
         if (typeof loop === 'function') loop(); // Ensure redraw
    } else {
        console.warn(`Invalid showcase index: ${index}`);
    }
}

/**
 * Handles keyboard input specifically when showcase mode is active.
 * Called by the main key handler in inputs.js.
 * @param {string} key - The key pressed (e.g., 'ArrowLeft', '1', 'b').
 * @param {number} keyCode - The keyCode of the key pressed.
 */
function handleShowcaseInput(key, keyCode) {
    const keyLower = key.toLowerCase();

    switch (key) {
        case 'ArrowRight':
        case 'ArrowDown':
            nextShowcaseBg();
            break;
        case 'ArrowLeft':
        case 'ArrowUp':
            prevShowcaseBg();
            break;
        default:
             if (keyLower === 'b') {
                toggleShowcase(); // Exit showcase
             } else if (keyLower === 'd') {
                // Toggle general debug mode if needed, or add specific showcase debug
                updateState('debugMode', !getStateProperty('debugMode', false));
                console.log(`Debug mode toggled: ${getStateProperty('debugMode')}`);
             } else if (key >= '1' && key <= '9') {
                // Jump to background by number (1-based index)
                const index = parseInt(key) - 1;
                gotoShowcaseBg(index);
             }
            break;
    }
}

/**
 * Draws the UI overlay text when showcase mode is active.
 * Should be called at the end of the main draw loop if showcase is active.
 */
function drawShowcaseUI() {
    const state = getState();
    if (!state || !state.showcaseActive || !state.showcaseTypes?.length) return;

    const currentBgName = state.showcaseTypes[state.showcaseIndex];
    const currentIndex = state.showcaseIndex + 1;
    const totalCount = state.showcaseTypes.length;

    push(); // Isolate styles

    // Semi-transparent background box for text
    fill(0, 0, 0, 150); // Dark semi-transparent
    noStroke();
    rectMode(CORNER); // Use corner mode for simple rect positioning
    const boxHeight = 70;
    rect(0, height - boxHeight, width, boxHeight);

    // Display text
    fill(255); // White text
    textSize(14);
    textAlign(LEFT, TOP);
    textFont('monospace'); // Use monospace for alignment

    const textPadding = 10;
    text(`BG Showcase: [${currentIndex}/${totalCount}] ${currentBgName}`, textPadding, height - boxHeight + textPadding);
    text(`Controls: ←/→ Arrows (Change) | 1-9 (Jump) | B (Exit)`, textPadding, height - boxHeight + textPadding + 20);
    text(`D (Debug Overlay: ${state.debugMode ? 'ON' : 'OFF'})`, textPadding, height - boxHeight + textPadding + 40);


    pop(); // Restore styles
}


// --- Exports ---
window.initShowcase = initShowcase;
window.toggleShowcase = toggleShowcase;
window.handleShowcaseInput = handleShowcaseInput;
window.drawShowcaseUI = drawShowcaseUI;
// Navigation functions might not need global export if only used by handler
// window.nextShowcaseBg = nextShowcaseBg;
// window.prevShowcaseBg = prevShowcaseBg;
// window.gotoShowcaseBg = gotoShowcaseBg;

// --- END OF FILE src/interaction/backgroundShowcase.js ---