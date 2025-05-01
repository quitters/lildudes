// --- START OF FILE src/core/logging.js ---

/**
 * Logging utilities and Debug UI management for the Mound Mascot project.
 */

// Debug UI Control Options
const DEBUG_SHAPES = ["normal", "tall", "asymmetric", "skinnyTall", "shortWide", "shortSkinny", "veryShortWide", "tallVeryThin"];
const DEBUG_PERSONALITIES = ["shy", "playful", "grumpy", "cheerful", "sleepy", "curious"];
// Fetch dynamically later if possible, hardcode for now
const DEBUG_COLOR_THEMES = ["classic", "sunset", "moonlight", "forest", "candyfloss", "desert", "mint", "bubblegum", "ocean", "autumn", "rainbow", "twilight", "golden", "cursed", "pastel"];
const DEBUG_BACKGROUNDS = ["gradient", "hills", "dots", "noise", "grid", "stars", "waves", "stripes", "forest_hills", "misty_mountains", "quiet_library", "abstract_burst", "sunny_day", "candy_land", "stormy_sky", "volcanic_plain", "underwater_world", "tech_grid", "forest_clearing", "cursed_realm", "desert_oasis"];
const DEBUG_PATTERNS = ["none", "stripes", "spots", "grid"];
const DEBUG_ACCESSORIES = ["none", "hat", "bow", "glasses", "crown", "halo", "eyebrows", "ribbon"];
const DEBUG_ANIM_TYPES = ["none", "jello", "breathe", "wobble", "pulse", "sway"];
const DEBUG_SEASONS = ["auto", "spring", "summer", "autumn", "winter"]; // Match HTML


/**
 * Helper function to populate a select dropdown.
 * @param {HTMLSelectElement} selectElement - The select element.
 * @param {string[]} options - Array of option values.
 * @param {string} selectedValue - The value to pre-select.
 */
function _populateSelect(selectElement, options, selectedValue) {
    if (!selectElement) return;
    // Only populate if empty to avoid duplicates on re-opening panel
    if (selectElement.options.length === 0) {
        options.forEach(optionValue => {
            const option = document.createElement('option');
            option.value = optionValue;
            // Simple capitalization for display
            option.textContent = optionValue.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            selectElement.appendChild(option);
        });
    }
    // Set selected value
    // Ensure the value exists in the options before setting it
    const exists = Array.from(selectElement.options).some(opt => opt.value === selectedValue);
    if (exists) {
        selectElement.value = selectedValue;
    } else {
        console.warn(`Value "${selectedValue}" not found in options for select element ${selectElement.id}. Defaulting to first option.`);
        if (selectElement.options.length > 0) {
            selectElement.selectedIndex = 0;
        }
    }
}

/**
 * Sets up event listeners for the debug controls ONCE.
 */
function _setupDebugControlListeners() {

  // --- Helper Function to Handle Updates --- //
  const handleUpdate = (stateKey, value) => {
    const propertiesToUpdate = {};
    let needsRedraw = false; // Most changes require at least a redraw
    let needsMoundGeometryUpdate = false;
    let needsMoundTextureUpdate = false;
    let needsBackgroundUpdate = false;
    let needsSeasonalUpdate = false;

    // Prepare the state update object based on the key and value
    if (stateKey === 'patternType') {
      propertiesToUpdate['hasPattern'] = (value !== 'none');
      propertiesToUpdate['patternType'] = value;
      needsMoundTextureUpdate = true;
    } else if (stateKey === 'accessoryType') {
      propertiesToUpdate['hasAccessory'] = (value !== 'none');
      propertiesToUpdate['accessoryType'] = value;
      // Accessories are drawn directly, only need redraw
    } else if (stateKey === 'debugForcedSeason') {
      propertiesToUpdate['debugForcedSeason'] = (value === 'auto' ? null : value);
      needsSeasonalUpdate = true;
    } else if (stateKey === 'palette.name') {
        // Special handling: Update the palette object based on name
        // NOTE: This assumes a way to get the full palette object by name exists globally
        // If not, this might need adjustment or a different approach.
        // For now, we just update the name and trigger texture regen.
        if (typeof window.findPaletteByName === 'function') { // Assuming this function exists
            const newPalette = window.findPaletteByName(value);
            if (newPalette) {
                propertiesToUpdate['palette'] = newPalette;
                needsMoundTextureUpdate = true;
            } else {
                console.warn(`Palette named '${value}' not found.`);
                needsRedraw = false; // Don't redraw if palette change failed
            }
        } else {
            console.warn("window.findPaletteByName function not available for debug controls.");
            needsRedraw = false; // Don't redraw if palette change failed
        }

    } else if (stateKey === 'moundShape'){
        propertiesToUpdate[stateKey] = value;
        needsMoundGeometryUpdate = true; // Shape change needs geometry recalc
        needsMoundTextureUpdate = true;  // Geometry change implies texture change

        // Add specific parameter adjustments for certain shapes selected via debug
        if (value === 'skinnyTall') {
            propertiesToUpdate['apexY'] = 50; // Lower value = Taller peak
            propertiesToUpdate['moundWidthFactor'] = 0.6; // Lower value = Skinnier
            console.log("   -> Applying 'skinnyTall' parameters (apexY: 50, widthFactor: 0.6)");
        } else if (value === 'tall') {
            propertiesToUpdate['apexY'] = 50; // Lower value = Taller peak
            propertiesToUpdate['moundWidthFactor'] = 1.0; // Normal width
            console.log("   -> Applying 'tall' parameters (apexY: 50, widthFactor: 1.0)");
         } else if (value === 'normal') {
            // Reset to default parameters when selecting Normal via debug
            propertiesToUpdate['apexY'] = 100; // Default apex
            propertiesToUpdate['moundWidthFactor'] = 1.0; // Default width
            console.log("   -> Applying 'normal' shape (resetting to default parameters: apexY=100, widthFactor=1.0)");
        } else if (value === 'asymmetric') {
            // Also reset to default parameters for Asymmetric base shape via debug
            propertiesToUpdate['apexY'] = 100; // Default apex
            propertiesToUpdate['moundWidthFactor'] = 1.0; // Default width
            console.log("   -> Applying 'asymmetric' shape (resetting to default parameters: apexY=100, widthFactor=1.0)");
        } else if (value === 'shortWide') {
            propertiesToUpdate['apexY'] = 150; // Short
            propertiesToUpdate['moundWidthFactor'] = 1.4; // Wide
            console.log("   -> Applying 'shortWide' parameters (apexY: 150, widthFactor: 1.4)");
        } else if (value === 'shortSkinny') {
            propertiesToUpdate['apexY'] = 150; // Short
            propertiesToUpdate['moundWidthFactor'] = 0.6; // Skinny
            console.log("   -> Applying 'shortSkinny' parameters (apexY: 150, widthFactor: 0.6)");
        } else if (value === 'veryShortWide') {
            propertiesToUpdate['apexY'] = 200; // Very Short
            propertiesToUpdate['moundWidthFactor'] = 1.8; // Very Wide
            console.log("   -> Applying 'veryShortWide' parameters (apexY: 200, widthFactor: 1.8)");
        } else if (value === 'tallVeryThin') {
            propertiesToUpdate['apexY'] = 50; // Tall
            propertiesToUpdate['moundWidthFactor'] = 0.4; // Very Thin
            console.log("   -> Applying 'tallVeryThin' parameters (apexY: 50, widthFactor: 0.4)");
        } // Add other 'else if' for asymmetric etc. if they need specific overrides

    } else if (stateKey === 'backgroundType') {
        propertiesToUpdate[stateKey] = value;
        needsBackgroundUpdate = true;    // Background change needs its buffer regenerated
    } else if (stateKey === 'isShiny' || stateKey === 'hasSpecialColor' || stateKey === 'hasMysteryEyes' || stateKey === 'hasGlow' || stateKey === 'isCursed') {
        // Boolean toggles usually just need a state update + redraw (effects are drawn live)
        propertiesToUpdate[stateKey] = value;
    } else if (stateKey === 'moundAnimationType' || stateKey === 'animationIntensity' || stateKey === 'personalityType') {
        // These affect live animation/drawing, just need state update + redraw
        propertiesToUpdate[stateKey] = value;
    } else {
        // Default case if not handled above
        propertiesToUpdate[stateKey] = value;
    }

    console.log(`Debug Control Update: ${stateKey} -> ${value}`);

    // 1. Update State (Initial Property Update)
    if (Object.keys(propertiesToUpdate).length > 0 && stateKey !== 'palette.name') { // Handle palette.name separately
         if (typeof window.updateStateProperties === 'function') {
             window.updateStateProperties(propertiesToUpdate);
         } else {
             console.error("updateStateProperties function not available for debug controls.");
             return; // Stop if we can't update state
         }
     }

    // 2. Trigger Specific Regeneration/Updates based on stateKey
    let functionsAvailable = true; // Assume functions are available initially

    // Helper function to check for function availability and log errors
    const checkFunc = (name) => {
        if (typeof window[name] !== 'function') {
            console.error(`${name} function not available.`);
            functionsAvailable = false;
            return false;
        }
        return true;
    };

    // --- Apply specific updates based on the changed key ---
    switch (stateKey) {
        // --- Geometry Changes ---
        case 'moundShape':
        case 'parabolaA':
        case 'parabolaB':
        case 'parabolaC':
            if (checkFunc('defineParabolaMound')) {
                console.log("   -> Redefining Mound Geometry...");
                window.defineParabolaMound();
                if (checkFunc('generateMoundTextureBuffer')) {
                    console.log("   -> Regenerating Mound Texture Buffer (due to geometry change)...");
                    window.generateMoundTextureBuffer();
                    needsRedraw = true;
                }
            }
            break;

        // --- Mound Texture Pattern Changes ---
        case 'patternType':
            if (checkFunc('updateState') && checkFunc('generateMoundTextureBuffer')) {
                const newHasPattern = (value !== 'none');
                console.log(`   -> Setting hasPattern to ${newHasPattern}`);
                window.updateState('hasPattern', newHasPattern);
                console.log("   -> Regenerating Mound Texture Buffer (pattern type change)...");
                window.generateMoundTextureBuffer();
                needsRedraw = true;
            } else {
                 console.error("Required functions for patternType change missing.");
                 functionsAvailable = false;
            }
            break;
        case 'patternScale':
        case 'patternDensity':
        case 'patternColorSource':
            // Only regenerate if a pattern is currently active
            if (checkFunc('getState') && window.getState().hasPattern && checkFunc('generateMoundTextureBuffer')) {
                console.log("   -> Regenerating Mound Texture Buffer (pattern parameter change)...");
                window.generateMoundTextureBuffer();
                needsRedraw = true;
            } else if (!window.getState().hasPattern) {
                console.log("   -> Pattern parameter changed, but no pattern is active. Skipping regeneration.");
            } else {
                 console.error("Required functions for pattern parameter change missing.");
                 functionsAvailable = false;
            }
            break;

        // --- Palette/Color Changes ---
        case 'palette.name':
            if (checkFunc('findPaletteByName') && checkFunc('updateState') && checkFunc('generateMoundTextureBuffer') && checkFunc('generateBackgroundBuffer')) {
                console.log(`   -> Finding and applying palette: ${value}...`);
                const newPalette = window.findPaletteByName(value);
                if (newPalette) {
                    window.updateState('palette', newPalette); // Update the *full* palette object
                    console.log("   -> Regenerating Mound Texture Buffer (palette change)...");
                    window.generateMoundTextureBuffer();
                    console.log("   -> Regenerating Background Buffer (palette change)...");
                    window.generateBackgroundBuffer();
                    // Optionally re-apply seasonal effects if colors affect them
                    // if (checkFunc('applySeasonalEffects')) { window.applySeasonalEffects(); }
                    needsRedraw = true;
                } else {
                    console.error(`Palette '${value}' not found.`);
                    functionsAvailable = false; // Prevent redraw if palette not found
                }
            } else {
                console.error("Required functions for palette change missing.");
                functionsAvailable = false;
            }
            break;
        case 'hasSpecialColor':
            if (checkFunc('generateColorPalette') && checkFunc('updateState') && checkFunc('generateMoundTextureBuffer') && checkFunc('generateBackgroundBuffer')) {
                console.log("   -> Regenerating palette due to special color toggle...");
                const newPalette = window.generateColorPalette(); // Re-run generator
                window.updateState('palette', newPalette);
                console.log("   -> Regenerating Mound Texture Buffer (special color toggle)...");
                window.generateMoundTextureBuffer();
                console.log("   -> Regenerating Background Buffer (special color toggle)...");
                window.generateBackgroundBuffer();
                needsRedraw = true;
            } else {
                 console.error("Required functions for special color toggle missing.");
                 functionsAvailable = false;
            }
            break;

        // --- Seasonal Changes ---
        case 'debugForcedSeason':
            if (checkFunc('applySeasonalEffects')) {
                console.log("   -> Applying Seasonal Effects (debug override change)...");
                window.applySeasonalEffects();
                needsRedraw = true;
            } else {
                functionsAvailable = false;
            }
            break;

        // --- Simple Visual Toggles (Accessories, Face, Appearance) ---
        case 'hasHalo':
        case 'hasCrown':
        case 'hasHat':
        case 'hasAntlers':
        case 'hasHorns':
        case 'faceType':
        case 'cheekType':
        case 'eyeType':
        case 'mouthType':
        case 'hasTears':
        case 'hasBlush':
        case 'hasFreckles':
            console.log("   -> Triggering redraw for visual toggle...");
            needsRedraw = true;
            break;

        // --- Animation Parameters --- (Require redraw to see immediate effect if loop isn't running)
        case 'swaySpeed':
        case 'swayAmount':
        case 'bounceFrequency':
        case 'bounceAmount':
            console.log("   -> Triggering redraw for animation parameter change...");
            needsRedraw = true; // Ensure redraw even if animation logic handles it
            break;

        // --- Default (for unhandled state keys) ---
        default:
            console.log(`   -> State key '${stateKey}' updated, no specific regeneration action defined. Triggering generic redraw.`);
            needsRedraw = true; // Trigger redraw for any other change just in case
            break;
    }

    // 3. Trigger Redraw (if needed and functions were available)
    if (needsRedraw && functionsAvailable) {
      if (typeof window.redraw === 'function') {
        // console.log("   -> Requesting redraw...");
        window.redraw();
      } else {
        console.error("p5 redraw function not available.");
      }
    } else if (!functionsAvailable) {
        console.warn("Skipping redraw because required regeneration functions were missing.");
    }
  };

  // --- Attach Listeners --- //

  // Dropdowns
  document.getElementById('debug-shape')?.addEventListener('change', (e) => handleUpdate('moundShape', e.target.value));
  document.getElementById('debug-personality')?.addEventListener('change', (e) => handleUpdate('personalityType', e.target.value));
  document.getElementById('debug-color-theme')?.addEventListener('change', (e) => handleUpdate('palette.name', e.target.value)); // Special key
  document.getElementById('debug-background')?.addEventListener('change', (e) => handleUpdate('backgroundType', e.target.value));
  document.getElementById('debug-pattern')?.addEventListener('change', (e) => handleUpdate('patternType', e.target.value)); // Sets hasPattern internally
  document.getElementById('debug-accessory')?.addEventListener('change', (e) => handleUpdate('accessoryType', e.target.value)); // Sets hasAccessory internally
  document.getElementById('debug-anim-type')?.addEventListener('change', (e) => handleUpdate('moundAnimationType', e.target.value));
  document.getElementById('debug-season')?.addEventListener('change', (e) => handleUpdate('debugForcedSeason', e.target.value)); // Uses special state key

  // Checkboxes
  document.getElementById('debug-shiny')?.addEventListener('change', (e) => handleUpdate('isShiny', e.target.checked));
  document.getElementById('debug-special-color')?.addEventListener('change', (e) => handleUpdate('hasSpecialColor', e.target.checked));
  document.getElementById('debug-mystery-eyes')?.addEventListener('change', (e) => handleUpdate('hasMysteryEyes', e.target.checked));
  document.getElementById('debug-glow')?.addEventListener('change', (e) => handleUpdate('hasGlow', e.target.checked));
  document.getElementById('debug-cursed')?.addEventListener('change', (e) => handleUpdate('isCursed', e.target.checked));

  // Slider
  const intensitySlider = document.getElementById('debug-anim-intensity');
  const intensityValueSpan = document.getElementById('debug-anim-intensity-value');
  intensitySlider?.addEventListener('input', (e) => {
    const intensity = parseFloat(e.target.value);
    if (intensityValueSpan) intensityValueSpan.textContent = intensity.toFixed(1);
    handleUpdate('animationIntensity', intensity);
  });

  console.log("Debug control listeners attached with specific update logic.");
}

// Keep track of whether the debug interface has been initialized
let isDebugPanelInitialized = false;

/**
 * Initializes the HTML debug UI elements and event listeners.
 * Should be called once, typically from the main setup function.
 */
function initDebugInterface() {
  if (isDebugPanelInitialized) return; // Prevent multiple initializations

  const debugButton = document.getElementById('debug-button');
  const debugPanel = document.getElementById('debug-panel');
  // Use the correct close button ID from index.html
  const debugClose = document.getElementById('close-debug-panel');
  const debugContent = document.getElementById('debug-content'); // Verify content exists

  if (!debugButton || !debugPanel || !debugClose || !debugContent) {
    console.error('Debug UI elements not found in HTML. Cannot initialize debug panel.');
    return;
  }

  // --- Setup Listeners ONCE --- (Ensure this runs after elements are confirmed)
  try {
      _setupDebugControlListeners(); // Call the function to attach listeners to controls
  } catch (error) {
      console.error("Error setting up debug control listeners:", error);
      // Don't set isDebugPanelInitialized = true if setup fails
      return;
  }
  // --------------------------

  debugButton.addEventListener('click', () => {
    // Ensure content area is ready before populating
    if(document.getElementById('debug-content') && typeof populateDebugContent === 'function') {
        // Use the 'active' class to trigger the CSS transition
        debugPanel.classList.add('active');
        populateDebugContent(); // Populate/update controls with current state on open
    } else {
        console.error("Cannot open debug panel - content area or populate function missing.");
    }
  });

  debugClose.addEventListener('click', () => {
    // Remove the 'active' class to hide the panel via CSS transition
    debugPanel.classList.remove('active');
  });

  // Optional: Close panel if clicking outside of it (add if desired)
  // window.addEventListener('click', (event) => {
  //   if (debugPanel.style.display === 'block' && !debugPanel.contains(event.target) && event.target !== debugButton) {
  //     debugPanel.style.display = 'none';
  //   }
  // });

  isDebugPanelInitialized = true;
  console.log("Debug Interface Initialized with Interactive Controls.");
}

/**
 * Populates the debug panel controls with current state information.
 */
function populateDebugContent() {
  const debugContent = document.getElementById('debug-content'); // Check if the container exists
  if (typeof getState !== 'function' || !debugContent) {
    console.error("Cannot populate debug panel: State functions unavailable or #debug-content not found.");
    if (debugContent) debugContent.innerHTML = 'Error: State functions not available or debug content area missing.';
    return;
  }

  const state = getState();
  if (!state || !state._initialized) {
     console.warn("Cannot populate debug panel: State not initialized yet.");
     if (debugContent) debugContent.innerHTML = 'State not initialized yet.'; // Keep controls hidden until state ready
     return;
  }

  // --- Get Element References --- (Ensure these match IDs in index.html)
  const shapeSelect = document.getElementById('debug-shape');
  const personalitySelect = document.getElementById('debug-personality');
  const themeSelect = document.getElementById('debug-color-theme');
  const backgroundSelect = document.getElementById('debug-background');
  const patternSelect = document.getElementById('debug-pattern');
  const shinyCheck = document.getElementById('debug-shiny');
  const specialColorCheck = document.getElementById('debug-special-color');
  const mysteryEyesCheck = document.getElementById('debug-mystery-eyes');
  const accessorySelect = document.getElementById('debug-accessory');
  const glowCheck = document.getElementById('debug-glow');
  const cursedCheck = document.getElementById('debug-cursed');
  const animTypeSelect = document.getElementById('debug-anim-type');
  const animIntensitySlider = document.getElementById('debug-anim-intensity');
  const animIntensityValueSpan = document.getElementById('debug-anim-intensity-value');
  const seasonSelect = document.getElementById('debug-season');

  // --- Populate Controls with Current State Values --- (Using helper for selects)

  // Ensure controls exist before trying to set values
  if (shapeSelect) _populateSelect(shapeSelect, DEBUG_SHAPES, state.moundShape);
  if (personalitySelect) _populateSelect(personalitySelect, DEBUG_PERSONALITIES, state.personalityType);
  if (themeSelect) _populateSelect(themeSelect, DEBUG_COLOR_THEMES, state.palette?.name || DEBUG_COLOR_THEMES[0]);
  if (backgroundSelect) _populateSelect(backgroundSelect, DEBUG_BACKGROUNDS, state.backgroundType);
  if (patternSelect) _populateSelect(patternSelect, DEBUG_PATTERNS, state.hasPattern ? state.patternType : 'none');
  if (accessorySelect) _populateSelect(accessorySelect, DEBUG_ACCESSORIES, state.hasAccessory ? state.accessoryType : 'none');
  if (animTypeSelect) _populateSelect(animTypeSelect, DEBUG_ANIM_TYPES, state.moundAnimationType);

  // Set Checkboxes (Check if element exists first)
  if (shinyCheck) shinyCheck.checked = state.isShiny ?? false;
  if (specialColorCheck) specialColorCheck.checked = state.hasSpecialColor ?? false;
  if (mysteryEyesCheck) mysteryEyesCheck.checked = state.hasMysteryEyes ?? false;
  if (glowCheck) glowCheck.checked = state.hasGlow ?? false;
  if (cursedCheck) cursedCheck.checked = state.isCursed ?? false;

  // Set Range Slider and Value Display (Check if elements exist first)
  if (animIntensitySlider) animIntensitySlider.value = state.animationIntensity ?? 1.0;
  if (animIntensityValueSpan) animIntensityValueSpan.textContent = (state.animationIntensity ?? 1.0).toFixed(1);

  // Set Season Dropdown (Check if element exists first)
  const seasonValue = state.debugForcedSeason || 'auto'; // Use override if set
  if (seasonSelect) _populateSelect(seasonSelect, DEBUG_SEASONS, seasonValue);

  // console.log("Debug panel controls populated/updated."); // Optional: Log success
}


// --- Console Logging Helpers ---

/**
 * Prints a formatted header to the console.
 * @param {string} text - The header text.
 */
function logHeader(text) {
  console.log(`\n%c--- ${text} ---`, 'color: #1976D2; font-weight: bold; font-size: 14px; border-bottom: 1px solid #1976D2; padding-bottom: 2px;');
}

/**
 * Prints a formatted section title to the console.
 * @param {string} text - The section title.
 */
function logSection(text) {
  console.log(`\n%c${text}`, 'color: #388E3C; font-weight: bold; font-size: 12px;');
}

/**
 * Prints a formatted key-value pair to the console.
 * @param {string} key - The parameter name.
 * @param {any} value - The parameter value.
 * @param {string} [color='#333'] - Optional text color for the value.
 */
function logParameter(key, value, color = '#333') {
  const valueDisplay = (value !== null && value !== undefined && typeof value.toFixed === 'function')
    ? value.toFixed(3) // Format numbers nicely
    : (typeof value === 'object' ? JSON.stringify(value) : String(value));

  console.log(
    `  %c${key}:%c ${valueDisplay}`,
    'color: #555; font-weight: bold; margin-right: 5px;', // Style for the key
    `color: ${color};` // Style for the value
  );
}

/**
 * Prints a formatted boolean trait with colored status (ENABLED/Disabled).
 * @param {string} trait - The trait name.
 * @param {boolean} enabled - Whether the trait is enabled.
 */
function logBooleanTrait(trait, enabled) {
  console.log(
    `  %c${trait}:%c ${enabled ? 'ENABLED' : 'Disabled'}`,
    'color: #555; font-weight: bold; margin-right: 5px;',
    `color: ${enabled ? '#4CAF50' : '#9E9E9E'}; font-weight: ${enabled ? 'bold' : 'normal'};`
  );
}

// --- Detailed Logging Functions ---

/**
 * Logs all the current mound traits and characteristics to the console.
 * Assumes getState, calculateRarity, and getRarityTier are available.
 */
function logMoundDetails() {
  if (typeof getState !== 'function') {
    console.error("Cannot log details: getState function is not available.");
    return;
  }
  const state = getState();
  if (!state || !state._initialized) {
     console.warn("Cannot log details: State is not initialized.");
     return;
  }

  // Check for rarity functions
  const rarityAvailable = typeof calculateRarity === 'function' && typeof getRarityTier === 'function';
  if (!rarityAvailable) {
     console.warn("Rarity functions not available. Rarity info will be missing.");
  }

  try {
    logHeader('🌄 MOUND MASCOT GENERATED TRAITS');

    // --- Core Properties ---
    logSection('📊 Core Properties');
    logParameter('Shape', state.moundShape);
    logParameter('Personality', state.personalityType);
    logParameter('Animation', state.moundAnimationType);
    logParameter('Anim Intensity', state.animationIntensity);

    // --- Appearance ---
    logSection('🎨 Appearance');
    logParameter('Color Theme', state.palette?.name || 'N/A');
    logParameter('Background', state.backgroundType);
    logBooleanTrait('Pattern', state.hasPattern);
    if (state.hasPattern) logParameter('Pattern Type', state.patternType);

    // --- Accessories & Effects ---
    logSection('✨ Accessories & Effects');
    logBooleanTrait('Accessory', state.hasAccessory);
    if (state.hasAccessory) logParameter('Accessory Type', state.accessoryType);
    logBooleanTrait('Glow', state.hasGlow);
    logBooleanTrait('Shimmer', state.hasShimmer); // Linked to isShiny
    logBooleanTrait('Shiny', state.isShiny);
    logBooleanTrait('Mystery Eyes', state.hasMysteryEyes);
    logBooleanTrait('Cursed', state.isCursed);
    logBooleanTrait('Special Color', state.hasSpecialColor); // Whether a rare palette was possible

    // --- Seasonal ---
    logSection('🌿 Seasonal');
    logParameter('Season Active', state.seasonType !== 'none' ? state.seasonType : 'None');
    if (state.seasonalEffects) {
      logParameter('Effect Type', state.seasonalEffects.type);
      logParameter('Effect Detail', state.seasonalEffects.count || state.seasonalEffects.intensity);
    }

    // --- Rarity Information ---
    logSection('💎 Rarity');
    if (rarityAvailable) {
      const rarityScore = calculateRarity(state); // Pass state if needed
      const rarityTier = getRarityTier(rarityScore); // Pass score

      logParameter('Rarity Score', rarityScore);

      // Color code the rarity tier
      let tierColor = '#9E9E9E'; // Common (Gray)
      if (rarityTier === 'Mythic') tierColor = '#E65100'; // Deep Orange
      else if (rarityTier === 'Legendary') tierColor = '#FFAB00'; // Amber/Gold
      else if (rarityTier === 'Rare') tierColor = '#1E88E5'; // Blue
      else if (rarityTier === 'Uncommon') tierColor = '#43A047'; // Green
      logParameter('Rarity Tier', rarityTier, tierColor);
    } else {
       logParameter('Rarity Score', 'N/A');
       logParameter('Rarity Tier', 'N/A');
    }
    logParameter('Special Combo', getSpecialCombinationName(state)); // Use function from config

    // --- Performance Settings (If available) ---
    if (state.performanceSettings) {
      logSection('⚙️ Performance');
      logParameter('Level', state.performanceSettings.level);
      logParameter('Anim Update', `1/${state.performanceSettings.animationUpdateFrequency} frames`);
      logParameter('Texture Detail', state.performanceSettings.textureDetail);
    }

    // --- Seed Info ---
    logSection('🎲 Seed Info');
    logParameter('Hash', state.$fx?.hash || 'N/A');

    console.log('\n'); // End with space

  } catch (error) {
    console.error('Error logging mound details:', error);
  }
}

/**
 * Logs a simplified version of the mound details for fxhash previews.
 */
function logPreviewDetails() {
   if (typeof getState !== 'function') return;
   const state = getState();
   if (!state || !state._initialized) return;

  console.log('%c MOUND PREVIEW ', 'background: #1976D2; color: white; font-weight: bold;');
  console.log(`  Shape: ${state.moundShape}, Personality: ${state.personalityType}, Theme: ${state.palette?.name || 'N/A'}`);

  const specialTraits = [];
  if (state.hasAccessory) specialTraits.push(`${state.accessoryType}`);
  if (state.hasGlow) specialTraits.push('Glow');
  if (state.hasShimmer) specialTraits.push('Shimmer');
  if (state.hasMysteryEyes) specialTraits.push('Mystery Eyes');
  if (state.isShiny) specialTraits.push('Shiny');
  if (state.isCursed) specialTraits.push('Cursed');

  if (specialTraits.length > 0) {
    console.log('  Special: ' + specialTraits.join(', '));
  }
  console.log(`  Hash: ${state.$fx?.hash?.substring(0, 10)}...`);
}


// --- Exports ---
window.logHeader = logHeader;
window.logSection = logSection;
window.logParameter = logParameter;
window.logBooleanTrait = logBooleanTrait;
window.logMoundDetails = logMoundDetails;
window.logPreviewDetails = logPreviewDetails;
window.initDebugInterface = initDebugInterface;
window.populateDebugContent = populateDebugContent; // Export if needed externally

// --- END OF FILE src/core/logging.js ---