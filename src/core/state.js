
// --- START OF FILE src/core/state.js ---

/**
 * Central State Management for the Mound Mascot project.
 * Provides robust and safe access to application state.
 */

// Private state object, initialized with defaults
let _state = {
  // --- Core Initialization ---
  _initialized: false, // Flag to track if initial state is set

  // --- fxhash Integration ---
  $fx: {
    rand: Math.random,
    hash: 'dev-' + Math.random().toString(36).substring(2, 15),
    isPreview: false,
    preview: () => console.log("Preview called (dev mode)."),
    params: (defs) => console.log("fx.params called (dev mode)", defs),
    features: (features) => console.log("fx.features called (dev mode)", features),
    getParam: (id) => undefined, // Mock getParam
    getRawParam: (id) => undefined, // Mock getRawParam
    getParams: () => ({}), // Mock getParams
    getRawParams: () => ({}) // Mock getRawParams
  },

  // --- Mound Geometry & Shape ---
  moundVertices: [],        // Array of {x, y, origX, origY, isKeyVertex}
  moundShape: "normal",     // e.g., "normal", "wide", "tall", "asymmetric"
  moundWidthFactor: 1.0,    // Multiplier for width
  apexY: 100,               // Y-coordinate of the mound's highest point
  baseExtra: 80,            // How far below the canvas the base extends
  randomAsymmetry: 0,       // Factor for asymmetric shape generation
  moundPosition: { x: 300, y: 300 }, // Calculated visual center {x, y}
  faceX: 300,               // Calculated X position for the face center
  faceY: 250,               // Calculated Y position for the face center
  currentFaceX: 300,        // Actual X used in the last frame (for feedback)
  currentFaceY: 250,        // Actual Y used in the last frame (for feedback)

  // --- Appearance & Palette ---
  palette: {                // Current color palette object
    name: "classic",
    mound: [251, 220, 96],
    sky: [230, 240, 255],
    dots: { r: [230, 255], g: [180, 255], b: [70, 130] },
    skyLines: [200, 220, 240],
    cheeks: [255, 180, 180],
    harmony: "complementary"
  },
  backgroundType: "gradient",// e.g., "gradient", "hills", "stars"
  patternType: "none",      // e.g., "stripes", "spots", "grid"

  // --- Animation ---
  moundAnimationType: "breathe", // e.g., "none", "jello", "breathe"
  animationIntensity: 0.5,  // Strength of the animation (0 to 1)
  animationPhase: 0,        // Primary animation phase (radians)
  secondaryPhase: 0,        // Secondary animation phase (radians)
  lastFrameTime: 0,         // Timestamp of the last frame for delta time calculation
  animationNeedsUpdate: true,// Flag to control animation calculation frequency

  // --- Face & Emotes ---
  personalityType: "cheerful", // e.g., "shy", "playful", "grumpy"
  currentEmote: 0,          // Current active emote code/ID
  initialMood: 0,           // The default mood/expression based on personality
  emoteFrame: 0,            // Frame counter for the current emote animation
  blinkTimer: 0,            // Timer for triggering blinks

  // --- Idle State ---
  idleTimer: 0,             // Timer for triggering idle actions
  idleState: 0,             // Current idle action (0=none, 1=bob, 2=look, 3=squash)
  breathePhase: 0,          // Phase for subtle breathing animation

  // --- Special Features & Effects ---
  hasSpecialColor: false,   // Does it use a rare color palette?
  hasPattern: false,        // Does it have a texture pattern?
  hasAccessory: false,      // Does it have an accessory?
  accessoryType: "none",    // e.g., "hat", "bow", "glasses"
  hasGlow: false,           // Does it have a glow effect?
  hasShimmer: false,        // Does it have a shimmer effect?
  hasMysteryEyes: false,    // Does it have special eyes?
  isShiny: false,           // Does it have a shiny texture?
  isCursed: false,          // Does it have the cursed appearance?

  // --- Seasonal ---
  seasonType: "none",       // e.g., "spring", "summer", "autumn", "winter", "none"
  currentSeason: "none",    // Detected season based on date (used internally)
  seasonalEffects: null,    // Object describing current seasonal effect {type, count/intensity}
  seasonParticles: [],      // Array for seasonal effect particles

  // --- Interaction & Memory ---
  interactionMemory: {      // Object tracking user interactions
    interactions: {},       // Counts per interaction type
    favoriteEmote: null,
    lastInteractions: [],
    totalInteractions: 0,
    milestones: {           // Flags for interaction milestones
      hasTenInteractions: false,
      hasTwentyInteractions: false,
      hasThirtyInteractions: false
    }
  },
  interactionParticles: [], // Array for short-lived feedback particles
  specialAnimation: null,   // Object for special reaction animations {type, duration, intensity}
  message: "",              // Message to display on screen (e.g., from memory system)
  messageTimer: 0,          // How long to display the message

  // --- Rendering & Performance ---
  performanceSettings: {    // Settings adjusted by performance monitor
    level: "high",          // "high", "medium", "low"
    animationUpdateFrequency: 1,
    backgroundAnimationEnabled: true,
    textureDetail: "high",
    effectCount: "full"
  },
  backgroundBuffer: null,   // Buffer for pre-rendered static background
  moundTextureBuffer: null, // Buffer for pre-rendered mound texture
  glowBuffer: null,         // Buffer for pre-rendered glow effect
  shimmerBuffer: null,      // Buffer for pre-rendered shimmer effect
  texturesGenerated: false, // Flag indicating if texture buffers are ready

  // --- UI & Debug ---
  debugMode: false,         // Is debug overlay active?
  showcaseActive: false,    // Is background showcase mode active?
  showcaseIndex: 0,         // Index of background currently shown in showcase
  showcaseTypes: []         // Array of background types available in showcase
};

/**
 * Initializes or resets the state with provided initial values.
 * Merges initialState with existing defaults.
 * Ensures the $fx object is properly set up.
 * @param {object} [initialState={}] - Optional initial state properties to merge.
 */
function setState(initialState = {}) {
  try {
    // Preserve essential internal flags if they exist in _state
    const initialized = _state._initialized;

    // Merge provided state with current state (or defaults if first time)
    _state = {
      ..._state, // Keep existing defaults or current values
      ...initialState, // Overwrite with provided initial values
      _initialized: true // Mark as initialized
    };

    // Ensure $fx object is correctly assigned (priority to window.$fx if available)
    if (typeof window !== 'undefined' && window.$fx) {
      _state.$fx = window.$fx;
    } else if (!initialState.$fx) {
      // If no $fx provided and window.$fx not found, keep the dev default
      console.warn("Using development $fx object.");
    }

    if (initialized) {
      console.log("State reset with new initial values.");
    } else {
      console.log("State initialized.");
    }

  } catch (error) {
     // Use console.error directly as logError might not be loaded yet
     console.error("Critical error during setState:", error);
     // Attempt to maintain a minimal working state
     _state = { ..._state, _initialized: true, _error: true };
  }
}

/**
 * Retrieves the current application state object.
 * Ensures state is initialized before returning.
 * @returns {object} The current state object.
 */
function getState() {
  // Ensure state is initialized, log warning if accessed too early
  if (!_state._initialized) {
    // Use console.warn as logError might depend on state/config
    console.warn('State accessed before initialization. Initializing with defaults.');
    setState(); // Initialize with defaults
  }
  return _state;
}

/**
 * Updates a specific property in the state object.
 * Logs an error if the update fails.
 * @param {string} key - The key of the property to update.
 * @param {*} value - The new value for the property.
 * @returns {boolean} True if the update was successful, false otherwise.
 */
function updateState(key, value) {
  if (!_state._initialized) {
    console.warn(`Attempted to update state key "${key}" before initialization.`);
    setState(); // Initialize first
  }
  if (typeof key !== 'string' || key === '_initialized') {
     logError("updateState", `Invalid or protected key provided: ${key}`);
     return false;
  }

  try {
    _state[key] = value;
    return true;
  } catch (error) {
    logError(`updateState (${key})`, error);
    return false;
  }
}

/**
 * Retrieves a single property from the state object.
 * @param {string} key - The key of the property to retrieve.
 * @param {*} [defaultValue=undefined] - Value to return if key not found.
 * @returns {*} The value of the property or the default value.
 */
function getStateProperty(key, defaultValue = undefined) {
  const currentState = getState(); // Ensures state is initialized
  return currentState.hasOwnProperty(key) ? currentState[key] : defaultValue;
}

/**
 * Updates multiple properties in the state object at once.
 * @param {object} properties - An object containing key-value pairs to update.
 * @returns {boolean} True if all updates were successful, false otherwise.
 */
function updateStateProperties(properties) {
  if (typeof properties !== 'object' || properties === null) {
     logError("updateStateProperties", "Invalid properties object provided.");
     return false;
  }
  if (!_state._initialized) {
    console.warn('Attempted to update multiple state properties before initialization.');
    setState(); // Initialize first
  }

  let success = true;
  for (const key in properties) {
    // Ensure we don't overwrite internal flags or use invalid keys
    if (properties.hasOwnProperty(key) && key !== '_initialized') {
      if (!updateState(key, properties[key])) {
        success = false; // Log individual errors via updateState
      }
    } else if (key === '_initialized') {
        logError("updateStateProperties", `Attempted to update protected key: ${key}`);
        success = false;
    }
  }
  return success;
}

// --- Exports ---
// Expose necessary functions globally
window.setState = setState;
window.getState = getState;
window.updateStateProperties = updateStateProperties;
// Optionally expose others if needed directly elsewhere
// window.updateState = updateState;
// window.getStateProperty = getStateProperty;

// --- END OF FILE src/core/state.js ---