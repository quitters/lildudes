// --- START OF FILE src/core/config.js ---

/**
 * Configuration for the Mound Mascot project.
 * Defines fxhash parameters and handles feature registration.
 */

// --- Constants ---
const EMOTE_MAX_FRAMES = 48; // Max frames an emote animation lasts

// --- FxHash Parameter Definitions ---

/**
 * Initializes fxhash parameter definitions.
 * Should be called once during setup.
 */
function initConfigParams() {
  // Ensure $fx.params is available
  if (typeof $fx === 'undefined' || typeof $fx.params !== 'function') {
    console.error("fxhash context ($fx.params) is not available. Cannot define parameters.");
    return;
  }

  $fx.params([
    {
      id: "useParams", // Kept for potential future use, but logic might be simplified
      name: "Use Custom Parameters",
      type: "boolean",
      default: false,
      options: {
        description: "Enable manual trait selection (overrides random generation). Note: May affect rarity or intended combinations."
      }
    },
    {
      id: "moundWidth",
      name: "Mound Width",
      type: "number",
      default: 1.0,
      options: {
        min: 0.6,
        max: 1.5,
        step: 0.05, // Finer step
        description: "Adjusts the overall width of the mound (1.0 is standard)."
      }
    },
    {
      id: "colorPalette",
      name: "Color Palette",
      type: "select",
      default: "random", // Default to random generation
      options: {
        // Updated list based on generators/colors.js definitions
        options: ["random", "classic", "sunset", "moonlight", "forest", "candyfloss", "desert", "mint", "bubblegum", "ocean", "autumn", "pastel", "rainbow", "twilight", "golden", "cursed"],
        description: "Selects the color theme. 'random' allows generative selection."
      }
    },
    {
      id: "animationType",
      name: "Animation Type",
      type: "select",
      default: "random", // Default to random generation
      options: {
        options: ["random", "none", "jello", "breathe", "wobble", "pulse", "sway"],
        description: "Selects the primary animation style. 'random' allows generative selection based on shape/personality."
      }
    },
    {
      id: "animationIntensity",
      name: "Animation Intensity",
      type: "number",
      default: 0.5, // Default intensity
      options: {
        min: 0.1,
        max: 1.0,
        step: 0.05, // Finer step
        description: "Controls the strength of the selected animation."
      }
    },
    {
      id: "accessoryChance",
      name: "Accessory Likelihood", // Renamed for clarity
      type: "number",
      default: 0.25, // Default 25% chance
      options: {
        min: 0,
        max: 1,
        step: 0.05,
        description: "Adjusts the probability of the mound having an accessory (0=never, 1=always)."
      }
    },
    {
      id: "backgroundPreference",
      name: "Background Style",
      type: "select",
      default: "automatic", // Default to automatic selection based on traits
      options: {
         // List reflects planned background types after refactor
        options: ["automatic", "gradient", "hills", "dots", "noise", "grid", "stars", "waves", "stripes", "forest_hills"],
        description: "Choose a specific background style, or 'automatic' for trait-based selection."
      }
    }
  ]);
  console.log("fxhash parameters defined.");
}

/**
 * Retrieves a configuration parameter value safely from fxhash context.
 * Assumes $fx is available globally.
 * @param {string} id - The ID of the parameter to retrieve.
 * @param {any} defaultValue - The value to return if the parameter is undefined or retrieval fails.
 * @returns {any} The parameter value or the default value.
 */
function getConfigParam(id, defaultValue) {
  try {
    if (typeof $fx !== 'undefined' && typeof $fx.getParam === 'function') {
      const paramValue = $fx.getParam(id);
      // Return defaultValue if paramValue is explicitly undefined
      return paramValue !== undefined ? paramValue : defaultValue;
    } else {
      // $fx context not available, return default
      if (!window._fxGetParamWarned) {
        console.warn("$fx.getParam is not available. Returning default values for parameters.");
        window._fxGetParamWarned = true;
      }
      return defaultValue;
    }
  } catch (error) {
    logError(`getConfigParam (${id})`, error);
    return defaultValue;
  }
}

/**
 * Checks if custom parameters should be used based on the 'useParams' setting.
 * @returns {boolean} True if custom parameters should override random generation.
 */
function shouldUseCustomParams() {
  // Note: This parameter might be removed if fully generative approach is preferred.
  // For now, it checks the fxhash parameter.
  return getConfigParam("useParams", false);
}

// --- Feature Registration ---

// Helper functions for descriptive strings (kept here for proximity to feature registration)

function getShapeDescription(shape) {
  switch(shape) {
    case "normal": return "Standard"; // Simplified
    case "wide": return "Wide";
    case "tall": return "Tall";
    case "asymmetric": return "Asymmetric";
    // Add other potential shapes if defined in generators/traits.js
    default: return shape ? shape.charAt(0).toUpperCase() + shape.slice(1) : "Unknown";
  }
}

function getAnimationDescription(animation) {
  switch(animation) {
    case "none": return "Static";
    case "jello": return "Jello Wobble";
    case "breathe": return "Breathing";
    case "wobble": return "Wobbling";
    case "pulse": return "Pulsing";
    case "sway": return "Swaying";
    default: return animation ? animation.charAt(0).toUpperCase() + animation.slice(1) : "None";
  }
}

function getPersonalityDescription(personality) {
   switch(personality) {
    case "cheerful": return "Cheerful";
    case "shy": return "Shy";
    case "grumpy": return "Grumpy";
    case "curious": return "Curious";
    case "sleepy": return "Sleepy";
    case "playful": return "Playful"; // Added based on trait generator
    // case "energetic": return "Energetic"; // Removed? Check traits.js
    default: return personality ? personality.charAt(0).toUpperCase() + personality.slice(1) : "Unknown";
  }
}

function getBackgroundDescription(background) {
   // Use the planned final background names
   switch(background) {
    case "gradient": return "Gradient Sky";
    case "hills": return "Rolling Hills"; // Enhanced Hills
    case "dots": return "Dotted Pattern";
    case "noise": return "Noise Texture"; // May map to noisyGrid
    case "grid": return "Grid Pattern"; // May map to noisyGrid
    case "stars": return "Starry Night";
    case "waves": return "Wavy Lines";
    case "stripes": return "Striped Pattern";
    case "forest_hills": return "Forest Hills"; // New enhanced type
    // Add other final types
    default: return background ? background.charAt(0).toUpperCase() + background.slice(1) : "Unknown";
  }
}

/**
 * Identifies and returns the name of any special trait combination present.
 * Relies on the state object having the necessary trait properties.
 * @param {object} state - The current application state object.
 * @returns {string} The name of the special combination or "None".
 */
function getSpecialCombinationName(state) {
  // Ensure state is valid
  if (!state || typeof state !== 'object') return "None";

  const paletteName = state.palette?.name; // Safe access

  // Golden shiny combination
  if (paletteName === "golden" && state.isShiny) return "Golden Treasure";
  // Cursed with mystery eyes
  if (state.isCursed && state.hasMysteryEyes) return "Eldritch Mound";
  // Rainbow with glow
  if (paletteName === "rainbow" && state.hasGlow) return "Prismatic Wonder";
  // Autumn palette with autumn seasonal effect
  if (paletteName === "autumn" && state.seasonType === "autumn") return "Autumn Harmony";
  // Ocean palette with potential future rain effect (placeholder)
  // if (paletteName === "ocean" && state.seasonType === "rain") return "Stormy Seas";

  // Forest Spirit: Forest palette + halo accessory + hills background
  if (paletteName === "forest" && state.accessoryType === "halo" && state.backgroundType === "hills") return "Forest Spirit";
  // Night Watcher: Moonlight palette + stars background + (glasses accessory OR curious personality)
  if (paletteName === "moonlight" && state.backgroundType === "stars" && (state.accessoryType === "glasses" || state.personalityType === "curious")) return "Night Watcher";
  // Royal Mound: Crown accessory + (golden palette)
  if (state.accessoryType === "crown" && paletteName === "golden") return "Royal Mound"; // Simplified, check if 'royal' palette exists

  return "None";
}


/**
 * Registers features with the fxhash platform based on the final generated state.
 * Assumes Rarity functions (calculateRarity, getRarityTier) are available globally
 * or imported appropriately.
 * @param {object} state - The final application state object after generation and validation.
 */
function registerFeatures(state) {
  // Ensure $fx.features is available
  if (typeof $fx === 'undefined' || typeof $fx.features !== 'function') {
    console.error("fxhash context ($fx.features) is not available. Cannot register features.");
    return;
  }
  // Ensure rarity functions are available
  if (typeof calculateRarity !== 'function' || typeof getRarityTier !== 'function') {
     console.error("Rarity functions (calculateRarity, getRarityTier) are not available globally. Cannot register features accurately.");
     // Provide fallback values to prevent feature registration from failing completely
     state.calculatedRarityScore = 0;
     state.calculatedRarityTier = "Unknown";
  } else {
     // Calculate rarity based on the final state AFTER validation
     state.calculatedRarityScore = calculateRarity(state); // Pass state if needed by function
     state.calculatedRarityTier = getRarityTier(state.calculatedRarityScore); // Pass score
  }

  // Get mood name safely using the function now in emotes.js
  const moodName = (typeof getMoodName === 'function') ? getMoodName(state.initialMood) : "Unknown";

  $fx.features({
    // Core Traits
    "Shape": getShapeDescription(state.moundShape),
    "Personality": getPersonalityDescription(state.personalityType),
    "Color Theme": state.palette?.name || "Unknown", // Safe access
    "Background": getBackgroundDescription(state.backgroundType),
    "Animation": getAnimationDescription(state.moundAnimationType),

    // Appearance Details
    "Pattern": state.hasPattern ? (state.patternType || "Yes") : "None",
    "Accessory": state.hasAccessory ? (state.accessoryType || "Yes") : "None",

    // Special Effects & Traits
    "Glow": state.hasGlow ? "Yes" : "No",
    "Shimmer": state.hasShimmer ? "Yes" : "No", // Shimmer derived from isShiny
    "Shiny": state.isShiny ? "Yes" : "No",
    "Mystery Eyes": state.hasMysteryEyes ? "Yes" : "No",
    "Cursed": state.isCursed ? "Yes" : "No",

    // Other Characteristics
    "Initial Mood": moodName,
    "Season": state.seasonType !== "none" ? (state.seasonType.charAt(0).toUpperCase() + state.seasonType.slice(1)) : "None",
    "Special Combination": getSpecialCombinationName(state),

    // Rarity Info
    "Rarity Score": state.calculatedRarityScore.toFixed(3),
    "Rarity Tier": state.calculatedRarityTier
  });

  console.log("fxhash features registered:", $fx.getFeatures ? $fx.getFeatures() : state);
}

// --- Exports ---
// Make functions globally available
window.initConfigParams = initConfigParams;
window.getConfigParam = getConfigParam;
window.shouldUseCustomParams = shouldUseCustomParams;
window.registerFeatures = registerFeatures;
window.getSpecialCombinationName = getSpecialCombinationName; // Export if needed elsewhere

// Export constants
window.EMOTE_MAX_FRAMES = EMOTE_MAX_FRAMES;

// --- END OF FILE src/core/config.js ---