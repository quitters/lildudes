// --- START OF FILE src/generators/traits.js ---

/**
 * Trait generation for the Mound Mascot project.
 * Determines the core characteristics of the mascot based on randomness,
 * fxhash parameters, and coherent trait relationships. Also calculates initial visual positioning.
 */

/**
 * Calculates the optimal visual position for the mound based on its shape and personality.
 * Aims to improve visual rhythm and composition.
 * @param {string} moundShape - The generated shape of the mound.
 * @param {string} personalityType - The generated personality.
 * @param {number} moundWidthFactor - The generated width factor.
 * @returns {object} An object { x: number, y: number } representing the target position.
 */
function calculateMoundPosition(moundShape, personalityType, moundWidthFactor) {
    // Assumes p5 width and height are available globally
    const canvasWidth = typeof width !== 'undefined' ? width : 600;
    const canvasHeight = typeof height !== 'undefined' ? height : 600;

    let verticalPosition;
    let horizontalPosition = canvasWidth * 0.5; // Default center

    // Adjust vertical position based on shape
    switch (moundShape) {
        case "tall":
            verticalPosition = canvasHeight * 0.58; // Lower for tall mounds
            if (personalityType === "shy") horizontalPosition += canvasWidth * ($fx.rand() < 0.5 ? 0.03 : -0.02); // Slight lean using $fx.rand()
            break;
        case "wide":
            verticalPosition = canvasHeight * 0.45; // Higher for wide mounds
            if (personalityType === "grumpy") verticalPosition += canvasHeight * 0.02;
            break;
        case "asymmetric":
            verticalPosition = canvasHeight * 0.52;
            // Use $fx.rand() for consistent pseudo-random offset based on hash
            horizontalPosition += canvasWidth * ($fx.rand() > 0.5 ? 0.04 : -0.04);
            break;
        default: // Normal
            verticalPosition = canvasHeight * 0.5;
             if (personalityType === "playful") verticalPosition -= canvasHeight * 0.015;
             else if (personalityType === "sleepy") verticalPosition += canvasHeight * 0.02;
            break;
    }

    // Fine-tune based on width factor (slightly lower for wider mounds)
    // Normalize width factor around 1.0 for adjustment calculation
    const normalizedWidthFactor = moundWidthFactor / 1.0;
    verticalPosition += (normalizedWidthFactor - 1) * canvasHeight * 0.04;

    // Clamp vertical position to prevent going too high or low
    verticalPosition = clamp(verticalPosition, canvasHeight * 0.4, canvasHeight * 0.65);

    return {
        x: Math.round(horizontalPosition),
        y: Math.round(verticalPosition)
    };
}

/**
 * Generates all core traits for the Mound Mascot and updates the global state.
 * Incorporates custom parameters if enabled.
 * Assumes core functions (getState, setState, getConfigParam, shouldUseCustomParams,
 * random utils, generateColorPalette) are available globally.
 */
function generateTraits() {
  console.log("Generating traits...");

  const state = getState(); // Get current state for context if needed
  const useOverrides = shouldUseCustomParams();

  // --- 1. Mound Shape & Base Parameters ---
  // Note: Assuming baseExtra and randomAsymmetry (initial value) don't strictly need $fx.rand()
  // if they are just intermediate calculation values not directly reported as traits.
  // If they *were* traits, they would need $fx.rand().
  let baseExtra = 70 + $fx.rand() * (90 - 70); // Example if non-$fx.rand() is ok here
  let randomAsymmetry = 1.5 + $fx.rand() * (4.5 - 1.5); // Base asymmetry factor - needs $fx.rand() if reported
  let moundWidthFactor = 1.0; // Default width

  // Determine Shape Type (Weighted Random Selection unless overridden)
  const shapes = ["normal", "wide", "tall", "asymmetric"];
  const shapeWeights = { normal: 0.65, wide: 0.18, tall: 0.12, asymmetric: 0.05 }; // Normal most common
  // TODO: Ensure fxWeightedRandomSelect is defined and uses $fx.rand()
  let moundShape = fxWeightedRandomSelect(shapeWeights) || "normal"; // Fallback

  // Apply shape-specific adjustments (only if *not* using custom width override)
  if (moundShape === "wide") {
    if (!useOverrides || getConfigParam("moundWidth", 1.0) === 1.0) { // Apply if default width or random
        moundWidthFactor = 1.2 + $fx.rand() * (1.4 - 1.2); // Use $fx.rand() for range
    }
  } else if (moundShape === "tall") {
     if (!useOverrides || getConfigParam("moundWidth", 1.0) === 1.0) {
        moundWidthFactor = 0.7 + $fx.rand() * (0.85 - 0.7); // Use $fx.rand() for range
     }
  } else if (moundShape === "asymmetric") {
    randomAsymmetry = 5 + $fx.rand() * (12 - 5); // More pronounced asymmetry - needs $fx.rand() if reported
     if (!useOverrides || getConfigParam("moundWidth", 1.0) === 1.0) {
        moundWidthFactor = 0.9 + $fx.rand() * (1.1 - 0.9); // Use $fx.rand() for range
     }
  } else { // Normal shape
     if (!useOverrides || getConfigParam("moundWidth", 1.0) === 1.0) {
        moundWidthFactor = 0.85 + $fx.rand() * (1.15 - 0.85); // Use $fx.rand() for range
     }
  }

  // Apply custom width override if specified
  if (useOverrides) {
    moundWidthFactor = getConfigParam("moundWidth", moundWidthFactor); // Use generated as default if not set
  }

  // --- 2. Special Boolean Traits (influences palette, accessories etc.) ---
  // Base chances, potentially modified by shape
  let specialColorChance = 0.15;
  let patternChance = 0.20;
  let glowChance = 0.10;
  let shinyChance = 0.05;
  let cursedChance = 0.02; // Very rare
  let mysteryEyesChance = 0.08;

  // Shape influences chances
  if (moundShape === "wide") {
    patternChance *= 1.5; glowChance *= 0.7;
  } else if (moundShape === "tall") {
    glowChance *= 1.5; specialColorChance *= 1.2;
  } else if (moundShape === "asymmetric") {
    cursedChance *= 2.0; mysteryEyesChance *= 1.5; patternChance *= 0.5;
  }

  // Determine boolean traits using $fx.rand()
  const hasSpecialColor = $fx.rand() < specialColorChance;
  const hasPattern = $fx.rand() < patternChance;
  const hasGlow = $fx.rand() < glowChance;
  const isShiny = $fx.rand() < shinyChance;
  const isCursed = $fx.rand() < cursedChance; // Very rare
  const hasMysteryEyes = $fx.rand() < mysteryEyesChance;
  const hasShimmer = isShiny; // Shimmer effect is tied to shiny trait

  // --- 3. Color Palette (depends on special traits, custom params) ---
  // Temporarily set traits needed by palette generator BEFORE calling it
  // Note: This uses updateStateProperties which might be slightly less clean than passing args,
  // but aligns with how generateColorPalette was originally written to check global state.
  // Consider refactoring generateColorPalette to accept these as args later if desired.
  updateStateProperties({ hasSpecialColor, isCursed });
  const palette = generateColorPalette(); // generateColorPalette handles custom param check internally

  // --- 4. Pattern Type ---
  let patternType = "none";
  if (hasPattern) {
    const patterns = ["stripes", "spots", "grid"]; // Add more if implemented
    patternType = patterns[Math.floor($fx.rand() * patterns.length)]; // Use $fx.rand() for array selection
  }

  // --- 5. Accessory (depends on palette, custom params) ---
  let accessoryType = "none";
  let hasAccessory = false;
  const baseAccessoryChance = useOverrides ? getConfigParam("accessoryChance", 0.25) : 0.25;

  // Adjust accessory chance based on palette and personality (more likely for some)
  let adjustedAccessoryChance = baseAccessoryChance;
  if (palette.name === "golden" || palette.name === "candyfloss") adjustedAccessoryChance *= 1.3; // More likely
  if (palette.name === "cursed" || palette.name === "moonlight") adjustedAccessoryChance *= 0.7; // Less likely

  hasAccessory = $fx.rand() < adjustedAccessoryChance; // Use $fx.rand() for chance

  if (hasAccessory) {
    const accessories = [
      "hat", "bow", "glasses", "crown", "halo", "eyebrows", "ribbon",
      "thickEyebrows", "thinEyebrows", "unibrow", "raisedEyebrows", "angryEyebrows", "surprisedEyebrows", "none"
    ];
    // Default equal weights for all accessories including new eyebrow types
    let accessoryWeights = {
      hat: 1, bow: 1, glasses: 1, crown: 1, halo: 1, eyebrows: 1, ribbon: 1,
      thickEyebrows: 1, thinEyebrows: 1, unibrow: 1, raisedEyebrows: 1, angryEyebrows: 1, surprisedEyebrows: 1, none: 0.5
    };

    // Palette influences accessory type (including new eyebrow types)
    if (palette.name === "forest" || palette.name === "mint") {
      accessoryWeights = {
        hat: 3, bow: 1, glasses: 1, crown: 1, halo: 5, eyebrows: 2, ribbon: 1,
        thickEyebrows: 3, thinEyebrows: 1, unibrow: 1, raisedEyebrows: 2, angryEyebrows: 1, surprisedEyebrows: 2, none: 0.5
      };
    } else if (palette.name === "moonlight" || palette.name === "twilight") {
      accessoryWeights = {
        hat: 1, bow: 1, glasses: 3, crown: 4, halo: 6, eyebrows: 1, ribbon: 1,
        thickEyebrows: 1, thinEyebrows: 2, unibrow: 1, raisedEyebrows: 1, angryEyebrows: 1, surprisedEyebrows: 2, none: 0.5
      };
    } else if (palette.name === "candyfloss" || palette.name === "bubblegum" || palette.name === "pastel") {
      accessoryWeights = {
        hat: 1, bow: 5, glasses: 2, crown: 2, halo: 1, eyebrows: 1, ribbon: 6,
        thickEyebrows: 1, thinEyebrows: 2, unibrow: 0.5, raisedEyebrows: 2, angryEyebrows: 0.5, surprisedEyebrows: 2, none: 0.5
      };
    } else if (palette.name === "cursed") {
      accessoryWeights = {
        hat: 2, bow: 1, glasses: 2, crown: 1, halo: 0.5, eyebrows: 2, ribbon: 0.5,
        thickEyebrows: 6, thinEyebrows: 1, unibrow: 3, raisedEyebrows: 1, angryEyebrows: 4, surprisedEyebrows: 1, none: 0.5
      };
    } else if (palette.name === "golden") {
      accessoryWeights = {
        hat: 1, bow: 1, glasses: 1, crown: 8, halo: 4, eyebrows: 0.5, ribbon: 0.5,
        thickEyebrows: 1, thinEyebrows: 1, unibrow: 0.5, raisedEyebrows: 1, angryEyebrows: 1, surprisedEyebrows: 1, none: 0.5
      };
    }

    // TODO: Ensure fxWeightedRandomSelect is defined and uses $fx.rand()
    accessoryType = fxWeightedRandomSelect(accessoryWeights) || "hat"; // Fallback to hat
  }

  // --- 6. Personality Type (depends on shape, palette) ---
  const personalities = ["shy", "playful", "grumpy", "cheerful", "sleepy", "curious"];
  let personalityWeights = { shy: 1, playful: 1, grumpy: 1, cheerful: 1, sleepy: 1, curious: 1 }; // Base equal weights

  // Shape influences personality
  if (moundShape === "tall") {
    personalityWeights = { shy: 3, playful: 1.5, grumpy: 1, cheerful: 2, sleepy: 1, curious: 2 };
  } else if (moundShape === "wide") {
    personalityWeights = { shy: 1, playful: 2.5, grumpy: 1.5, cheerful: 3, sleepy: 1, curious: 1 };
  } else if (moundShape === "asymmetric") {
    personalityWeights = { shy: 1, playful: 1, grumpy: 3, cheerful: 1, sleepy: 1.5, curious: 2.5 };
  }

  // Palette influences personality
  if (palette.name === "moonlight" || palette.name === "twilight") {
    personalityWeights.sleepy = (personalityWeights.sleepy || 1) * 1.5;
    personalityWeights.shy = (personalityWeights.shy || 1) * 1.2;
    personalityWeights.cheerful = (personalityWeights.cheerful || 1) * 0.7;
    personalityWeights.playful = (personalityWeights.playful || 1) * 0.8;
  } else if (palette.name === "sunset" || palette.name === "golden" || palette.name === "autumn") {
    personalityWeights.cheerful = (personalityWeights.cheerful || 1) * 1.4;
    personalityWeights.playful = (personalityWeights.playful || 1) * 1.2;
    personalityWeights.grumpy = (personalityWeights.grumpy || 1) * 0.7;
    personalityWeights.sleepy = (personalityWeights.sleepy || 1) * 0.8;
  } else if (palette.name === "cursed") {
    personalityWeights.grumpy = (personalityWeights.grumpy || 1) * 2.0;
    personalityWeights.curious = (personalityWeights.curious || 1) * 1.5;
    personalityWeights.cheerful = (personalityWeights.cheerful || 1) * 0.5;
    personalityWeights.playful = (personalityWeights.playful || 1) * 0.5;
    personalityWeights.sleepy = (personalityWeights.sleepy || 1) * 1.2;
  } else if (palette.name === "candyfloss" || palette.name === "bubblegum") {
     personalityWeights.playful = (personalityWeights.playful || 1) * 1.5;
     personalityWeights.cheerful = (personalityWeights.cheerful || 1) * 1.3;
     personalityWeights.grumpy = (personalityWeights.grumpy || 1) * 0.6;
  }

  // TODO: Ensure fxWeightedRandomSelect is defined and uses $fx.rand()
  const personalityType = fxWeightedRandomSelect(personalityWeights) || "cheerful"; // Fallback

  // --- 7. Animation (depends on shape, personality, custom params) ---
  const animationTypes = ["none", "jello", "breathe", "wobble", "pulse", "sway"];
  let animationWeights = { none: 1, jello: 1, breathe: 1, wobble: 1, pulse: 1, sway: 1 }; // Base equal weights
  let animationIntensity = 0.5; // Default intensity

  // Shape influences animation type preference
  if (moundShape === "wide") {
    animationWeights = { none: 3, jello: 1, breathe: 3, wobble: 4, pulse: 1, sway: 2 }; // Favor wobble, breathe
  } else if (moundShape === "tall") {
    animationWeights = { none: 3, jello: 4, breathe: 4, wobble: 1, pulse: 2, sway: 1 }; // Favor jello, breathe
  } else if (moundShape === "asymmetric") {
    animationWeights = { none: 6, jello: 1, breathe: 3, wobble: 1, pulse: 1, sway: 2 }; // Favor none or subtle
  }

  // Determine animation type
  let moundAnimationType = "breathe"; // Fallback default
  if (useOverrides) {
      const customAnim = getConfigParam("animationType", "random");
      moundAnimationType = (customAnim === "random")
          ? (fxWeightedRandomSelect(animationWeights) || "breathe")
          : customAnim;
      animationIntensity = getConfigParam("animationIntensity", 0.5);
  } else {
      moundAnimationType = fxWeightedRandomSelect(animationWeights) || "breathe";
      // Base intensity on shape and personality if not overridden
      if (moundShape === "wide") animationIntensity = 0.3 + $fx.rand() * (0.6 - 0.3);
      else if (moundShape === "tall") animationIntensity = 0.4 + $fx.rand() * (0.8 - 0.4);
      else if (moundShape === "asymmetric") animationIntensity = 0.2 + $fx.rand() * (0.5 - 0.2);
      else animationIntensity = 0.3 + $fx.rand() * (0.7 - 0.3); // Normal

      if (personalityType === 'playful' || personalityType === 'cheerful') animationIntensity *= 1.1;
      if (personalityType === 'sleepy' || personalityType === 'grumpy') animationIntensity *= 0.8;
  }

  // Fine-tune intensity based on animation type itself
  if (moundAnimationType === "jello" || moundAnimationType === "wobble") animationIntensity *= 0.8;
  if (moundAnimationType === "pulse") animationIntensity *= 1.1;
  if (moundAnimationType === "none") animationIntensity = 0;
  animationIntensity = clamp(animationIntensity, 0, 1.0); // Ensure valid range


  // --- 8. Background Type (depends on personality, palette, custom params) ---
  // Final list of implemented background types
  // Make sure this list matches BackgroundTypes in backgroundManager.js
  const backgroundList = ["gradient", "hills", "dots", "noise", "grid", "stars", "waves", "stripes", "forest_hills", "geometric", "abstract_burst", "sunny_day", "tech_grid", "candy_land", "misty_mountains", "quiet_library", "stormy_sky", "volcanic_plain", "underwater_world", "forest_clearing", "cursed_realm", "desert_oasis"];
  const backgroundMap = { // Maps param options to internal names used in backgroundManager.js
    "gradient": "gradient", "hills": "hills", "dots": "dots", "noise": "noise", "grid": "grid",
    "stars": "stars", "waves": "waves", "stripes": "stripes", "forest_hills": "forest_hills",
    "geometric": "geometric", "abstract_burst": "abstract_burst", "sunny_day": "sunny_day", "tech_grid": "tech_grid", "candy_land": "candy_land",
    "misty_mountains": "misty_mountains", "quiet_library": "quiet_library", "stormy_sky": "stormy_sky", "volcanic_plain": "volcanic_plain", "underwater_world": "underwater_world", "forest_clearing": "forest_clearing", "cursed_realm": "cursed_realm", "desert_oasis": "desert_oasis"
  };
  let backgroundType = "gradient"; // Fallback

  if (useOverrides) {
      const pref = getConfigParam("backgroundPreference", "automatic");
      backgroundType = (pref === "automatic")
          ? selectBackgroundByTypeWeights(personalityType, palette, moundShape, backgroundList) // Weighted random
          : (backgroundMap[pref] || "gradient"); // Use map or fallback
  } else {
      backgroundType = selectBackgroundByTypeWeights(personalityType, palette, moundShape, backgroundList);
  }

  // --- 9. Seasonal Variation ---
  const seasons = ["none", "spring", "summer", "autumn", "winter"];
  const seasonWeights = { none: 0.6, spring: 0.1, summer: 0.1, autumn: 0.1, winter: 0.1 };
  const seasonType = fxWeightedRandomSelect(seasonWeights) || "none";

  // --- 10. Initial Mood (depends on personality) ---
  // Mood codes: 0: neutral, -1: slight frown, -2: sad frown, 9: happy smile, 10: big smile, 11: surprised, 12: sleepy
  let moodWeights = { '0': 1, '-1': 1, '-2': 1, '9': 1, '10': 1, '11': 1, '12': 1 }; // Base equal weights as string keys

  // Adjust mood weights based on personality
   if (personalityType === "shy") moodWeights = { '0': 4, '-1': 4, '-2': 1, '9': 0.5, '10': 0, '11': 0, '12': 0.5 };
   else if (personalityType === "playful") moodWeights = { '0': 3, '-1': 0.5, '-2': 0, '9': 3.5, '10': 2, '11': 1, '12': 0 };
   else if (personalityType === "grumpy") moodWeights = { '0': 2, '-1': 4, '-2': 3, '9': 0, '10': 0, '11': 0, '12': 1 };
   else if (personalityType === "cheerful") moodWeights = { '0': 2, '-1': 0, '-2': 0, '9': 4, '10': 3, '11': 1, '12': 0 };
   else if (personalityType === "sleepy") moodWeights = { '0': 3, '-1': 1, '-2': 0.5, '9': 0, '10': 0, '11': 0, '12': 4 };
   else if (personalityType === "curious") moodWeights = { '0': 3, '-1': 0, '-2': 0, '9': 2, '10': 0, '11': 4, '12': 1 };

  const initialMoodStr = fxWeightedRandomSelect(moodWeights) || "0";
  const initialMood = parseInt(initialMoodStr); // Convert selected key back to number


  // --- 11. Calculate Mound Position ---
  const moundPosition = calculateMoundPosition(moundShape, personalityType, moundWidthFactor);

  // --- 12. Eye Type (new trait, mostly classic, sometimes new)
  const eyeTypeList = ['classic', 'sleepy', 'joyful', 'wideEyes'];
  const eyeTypeWeights = { classic: 0.7, sleepy: 0.1, joyful: 0.1, wideEyes: 0.1 };
  const eyeType = fxWeightedRandomSelect(eyeTypeWeights) || 'classic';

  // --- Update State ---
  // Use setState to replace the entire state related to generated traits
  // This ensures we start fresh for each generation based on the hash
  const currentState = getState(); // Get existing state to preserve core parts
  setState({
    // Reset relevant parts of state before setting new traits
    moundVertices: [], // Geometry will be defined next
    faceX: currentState.width / 2 || 300, // Placeholder, will be calculated
    faceY: currentState.height / 2 || 300, // Placeholder
    currentFaceX: currentState.width / 2 || 300, // Placeholder
    currentFaceY: currentState.height / 2 || 300, // Placeholder
    emoteFrame: 0, emoteMemory: [], emoteHistory: {}, // Reset emote state
    interactionMemory: { // Reset interaction counts/history but keep structure
         interactions: {}, favoriteEmote: null, lastInteractions: [], totalInteractions: 0,
         milestones: { hasTenInteractions: false, hasTwentyInteractions: false, hasThirtyInteractions: false }
    },
    seasonalEffects: null, seasonParticles: [], // Reset effects
    animationPhase: 0, secondaryPhase: 0, // Reset animation phases
    message: "", messageTimer: 0, // Reset messages
    specialAnimation: null, // Reset special animations

    // Set newly generated traits
    baseExtra,
    randomAsymmetry,
    moundWidthFactor,
    moundShape,
    moundPosition, // Set calculated position
    hasSpecialColor,
    hasPattern,
    patternType,
    hasAccessory,
    accessoryType,
    hasGlow,
    hasShimmer,
    isShiny,
    hasMysteryEyes,
    isCursed,
    palette,
    personalityType,
    eyeType, // NEW: add eyeType to state
    moundAnimationType,
    animationIntensity,
    backgroundType,
    seasonType,
    initialMood,
    currentEmote: initialMood, // Start with the initial mood

     // Keep existing essential state like $fx, performanceSettings etc.
    $fx: currentState.$fx,
    performanceSettings: currentState.performanceSettings || { level: "high", animationUpdateFrequency: 1, effectUpdateFrequency: 1, backgroundAnimationEnabled: true, textureDetail: "high", effectCountMultiplier: 1.0 }, // Ensure performance exists
    _initialized: true // Mark as initialized/re-initialized
  });

  console.log(`Traits generated. Shape: ${moundShape}, Personality: ${personalityType}, Palette: ${palette.name}, Position: (${moundPosition.x}, ${moundPosition.y})`);
  // Return the newly updated state object
  return getState();
}


/**
 * Helper function to select background type using weighted randomness
 * based on personality, palette, and shape.
 * @param {string} personalityType
 * @param {object} palette
 * @param {string} moundShape
 * @param {Array<string>} backgroundList - List of available background type names.
 * @returns {string} The selected background type name.
 */
function selectBackgroundByTypeWeights(personalityType, palette, moundShape, backgroundList) {
    let weights = {};
    backgroundList.forEach(bg => weights[bg] = 1.0); // Start with base weights

    const pName = palette?.name || "";

    // Adjust weights based on personality
    if (personalityType === "shy") {
        weights["misty_mountains"] = (weights["misty_mountains"] || 1) * 1.5;
        weights["quiet_library"] = (weights["quiet_library"] || 1) * 1.8;
        weights["stars"] = (weights["stars"] || 1) * 1.2;
        weights["abstract_burst"] = (weights["abstract_burst"] || 1) * 0.7;
    } else if (personalityType === "playful" || personalityType === "cheerful") {
        weights["sunny_day"] = (weights["sunny_day"] || 1) * 2.0;
        weights["abstract_burst"] = (weights["abstract_burst"] || 1) * 1.5;
        weights["candy_land"] = (weights["candy_land"] || 1) * 1.8;
        weights["misty_mountains"] = (weights["misty_mountains"] || 1) * 0.8;
        weights["stars"] = (weights["stars"] || 1) * 0.6;
    } else if (personalityType === "grumpy") {
        weights["stormy_sky"] = (weights["stormy_sky"] || 1) * 2.5;
        weights["volcanic_plain"] = (weights["volcanic_plain"] || 1) * 1.5;
        weights["sunny_day"] = (weights["sunny_day"] || 1) * 0.5;
    } else if (personalityType === "sleepy") {
        weights["stars"] = (weights["stars"] || 1) * 2.0;
        weights["misty_mountains"] = (weights["misty_mountains"] || 1) * 1.3;
        weights["quiet_library"] = (weights["quiet_library"] || 1) * 1.5;
    } else if (personalityType === "curious") {
        weights["geometric"] = (weights["geometric"] || 1) * 1.8;
        weights["underwater_world"] = (weights["underwater_world"] || 1) * 1.5;
        weights["tech_grid"] = (weights["tech_grid"] || 1) * 1.2;
    }

    // Adjust weights based on palette
    if (pName.includes("forest") || pName.includes("mint")) {
        weights["misty_mountains"] = (weights["misty_mountains"] || 1) * 1.4;
        weights["forest_clearing"] = (weights["forest_clearing"] || 1) * 2.0;
    } else if (pName.includes("moonlight") || pName.includes("twilight")) {
        weights["stars"] = (weights["stars"] || 1) * 2.2;
    } else if (pName.includes("candy") || pName.includes("bubblegum") || pName.includes("pastel")) {
        weights["candy_land"] = (weights["candy_land"] || 1) * 2.5;
        weights["sunny_day"] = (weights["sunny_day"] || 1) * 1.3;
    } else if (pName.includes("cursed")) {
        weights["stormy_sky"] = (weights["stormy_sky"] || 1) * 1.5;
        weights["volcanic_plain"] = (weights["volcanic_plain"] || 1) * 2.0;
        weights["cursed_realm"] = (weights["cursed_realm"] || 1) * 3.0;
        weights["stars"] = (weights["stars"] || 1) * 0.7;
        weights["sunny_day"] = (weights["sunny_day"] || 1) * 0.4;
    }

    // Adjust weights based on shape
    if (moundShape === "tall") {
        weights["misty_mountains"] = (weights["misty_mountains"] || 1) * 1.3;
        weights["stars"] = (weights["stars"] || 1) * 1.2;
    } else if (moundShape === "wide") {
        weights["sunny_day"] = (weights["sunny_day"] || 1) * 1.3;
        weights["desert_oasis"] = (weights["desert_oasis"] || 1) * 1.5;
    } else if (moundShape === "asymmetric") {
        weights["abstract_burst"] = (weights["abstract_burst"] || 1) * 1.4;
        weights["geometric"] = (weights["geometric"] || 1) * 1.3;
    }

    // TODO: Ensure fxWeightedRandomSelect is defined and uses $fx.rand()
    const selectedType = fxWeightedRandomSelect(weights);

    return selectedType || backgroundList[Math.floor($fx.rand() * backgroundList.length)] || 'simple_gradient'; // Fallback
}


// --- Exports ---
window.generateTraits = generateTraits;
// calculateMoundPosition is internal helper now

// --- END OF FILE src/generators/traits.js ---