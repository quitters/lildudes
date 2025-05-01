// --- START OF FILE src/generators/colors.js ---

/**
 * Color palette generation and management for the Mound Mascot project.
 * Defines palettes, selects based on traits/params, and applies harmony adjustments.
 */

// --- Palette Definitions --- (Moved outside for broader access)
// Palettes are defined internally to keep this module self-contained.
// Enhanced with harmony type information and refined colors.
const BASE_PALETTES = [
  // Name, Mound RGB, Sky RGB, Dots {r[], g[], b[]}, SkyLines RGB, Cheeks RGB, Harmony Type
  { name: "classic", mound: [251, 220, 96], sky: [230, 240, 255], dots: {r: [230, 255], g: [180, 255], b: [70, 130]}, skyLines: [200, 220, 240], cheeks: [255, 180, 180], harmony: "complementary" },
  { name: "sunset", mound: [255, 180, 100], sky: [255, 210, 220], dots: {r: [255, 255], g: [150, 200], b: [100, 150]}, skyLines: [230, 180, 200], cheeks: [255, 150, 150], harmony: "analogous" },
  { name: "moonlight", mound: [180, 200, 230], sky: [50, 60, 100], dots: {r: [200, 230], g: [220, 255], b: [230, 255]}, skyLines: [100, 130, 180], cheeks: [180, 200, 230], harmony: "monochromatic" },
  { name: "forest", mound: [120, 180, 90], sky: [200, 230, 200], dots: {r: [100, 150], g: [180, 230], b: [100, 150]}, skyLines: [170, 210, 180], cheeks: [230, 180, 180], harmony: "split-complementary" },
  { name: "candyfloss", mound: [255, 180, 230], sky: [240, 220, 250], dots: {r: [230, 255], g: [180, 220], b: [230, 255]}, skyLines: [220, 200, 240], cheeks: [255, 150, 180], harmony: "triadic" },
  { name: "desert", mound: [230, 190, 140], sky: [245, 225, 200], dots: {r: [210, 240], g: [180, 220], b: [140, 180]}, skyLines: [210, 190, 170], cheeks: [220, 160, 150], harmony: "analogous" },
  { name: "mint", mound: [160, 230, 200], sky: [220, 250, 240], dots: {r: [100, 170], g: [200, 255], b: [180, 220]}, skyLines: [190, 230, 210], cheeks: [230, 170, 190], harmony: "complementary" },
  { name: "bubblegum", mound: [255, 150, 200], sky: [255, 230, 240], dots: {r: [255, 255], g: [130, 200], b: [200, 255]}, skyLines: [240, 190, 220], cheeks: [255, 120, 180], harmony: "analogous-accent" },
  { name: "ocean", mound: [80, 170, 220], sky: [180, 230, 250], dots: {r: [70, 120], g: [160, 210], b: [200, 255]}, skyLines: [150, 200, 240], cheeks: [250, 170, 120], harmony: "tetradic" },
  { name: "autumn", mound: [230, 140, 80], sky: [240, 220, 180], dots: {r: [220, 255], g: [120, 180], b: [50, 100]}, skyLines: [220, 190, 160], cheeks: [180, 100, 80], harmony: "analogous" }
];

// Special palettes (potentially added based on traits)
const SPECIAL_PALETTES = [
  { name: "rainbow", mound: [255, 240, 150], sky: [180, 230, 255], dots: {r: [100, 255], g: [100, 255], b: [100, 255]}, skyLines: [150, 200, 250], cheeks: [255, 150, 200], isRainbow: true, harmony: "polychromatic" },
  { name: "twilight", mound: [100, 100, 150], sky: [30, 30, 70], dots: {r: [150, 200], g: [100, 150], b: [200, 255]}, skyLines: [80, 80, 150], cheeks: [150, 120, 180], harmony: "analogous" },
  { name: "golden", mound: [255, 215, 0], sky: [250, 240, 220], dots: {r: [255, 255], g: [215, 235], b: [0, 50]}, skyLines: [230, 210, 180], cheeks: [255, 200, 150], harmony: "monochromatic" },
  { name: "cursed", mound: [70, 0, 70], sky: [20, 0, 30], dots: {r: [100, 150], g: [0, 20], b: [100, 150]}, skyLines: [50, 0, 80], cheeks: [100, 0, 50], harmony: "monochromatic-accent" },
  { name: "pastel", mound: [220, 230, 180], sky: [230, 240, 255], dots: {r: [200, 240], g: [200, 240], b: [200, 240]}, skyLines: [210, 220, 240], cheeks: [255, 200, 200], harmony: "split-complementary" }
];

/**
 * Finds a palette definition by its name.
 * Searches both base and special palettes.
 * @param {string} name - The name of the palette to find (e.g., "sunset", "cursed").
 * @returns {object | null} The palette object if found, otherwise null.
 */
function findPaletteByName(name) {
    const allPalettes = [...BASE_PALETTES, ...SPECIAL_PALETTES];
    return allPalettes.find(p => p.name === name) || null;
}

/**
 * Generates or selects a color palette based on configuration and randomness.
 * Applies harmony enhancements for visual coherence.
 * @returns {object} The selected and enhanced color palette object.
 */
function generateColorPalette() {
  // Palette definitions are now file-scoped constants (BASE_PALETTES, SPECIAL_PALETTES)

  // Get necessary state and config
  const state = getState(); // Assumes getState is available globally
  const useOverrides = shouldUseCustomParams(); // Assumes shouldUseCustomParams is available

  // Determine the pool of available palettes
  let availablePalettes = [...BASE_PALETTES]; // Use the constant
  // Conditionally add special palettes based on generative traits (if not using overrides)
  if (!useOverrides) {
    if (state.hasSpecialColor) { // Trait generated in generators/traits.js
       availablePalettes.push(...SPECIAL_PALETTES.filter(p => p.name !== 'cursed')); // Use the constant
    }
    if (state.isCursed) { // Trait generated in generators/traits.js
       // If cursed, strongly favor or force the cursed palette
       if (randomChance(0.8)) { // 80% chance to force cursed palette if isCursed trait is true
          const cursed = SPECIAL_PALETTES.find(p => p.name === 'cursed'); // Use the constant
          if (cursed) {
             console.log("Forcing 'cursed' palette due to isCursed trait.");
             return enhanceColorHarmony(cursed, state.personalityType); // Apply harmony adjustments
          }
       } else if (!availablePalettes.find(p => p.name === 'cursed')) {
          // Ensure cursed is at least an option if not forced
          const cursed = SPECIAL_PALETTES.find(p => p.name === 'cursed'); // Use the constant
          if (cursed) availablePalettes.push(cursed);
       }
    }
  } else {
     // If using overrides, make all palettes potentially selectable via config
     availablePalettes = [...BASE_PALETTES, ...SPECIAL_PALETTES]; // Use the constants
  }


  // --- Palette Selection --- 
  let selectedPalette;
  const customPaletteChoice = useOverrides ? getConfigParam("colorPalette", "random") : "random";

  if (customPaletteChoice !== "random") {
    // Find the palette specified by the config parameter using the new function
    selectedPalette = findPaletteByName(customPaletteChoice);
    if (!selectedPalette) {
      console.warn(`Custom palette "${customPaletteChoice}" not found. Selecting randomly.`);
      // Fallback to random selection if the specified palette doesn't exist in the available pool
      selectedPalette = randomFromArray(availablePalettes);
    }
  } else {
    // Select randomly from the available pool
    selectedPalette = randomFromArray(availablePalettes);
  }

  // Ensure a palette was selected (fallback if array was empty)
  if (!selectedPalette) {
     console.error("Failed to select a color palette. Using fallback 'classic'.");
     selectedPalette = BASE_PALETTES[0]; // Fallback to classic using the constant
  }

  // --- Harmony Enhancement ---
  const finalPalette = enhanceColorHarmony(selectedPalette, state.personalityType);

  console.log(`Selected palette: ${finalPalette.name}`);
  return finalPalette;
}

/**
 * Enhances a color palette by adjusting colors for better contrast and harmony,
 * considering the mound's personality.
 * @param {object} palette - The initial color palette object.
 * @param {string} personality - The personality type of the mound.
 * @returns {object} The enhanced color palette object.
 */
function enhanceColorHarmony(palette, personality) {
  // Create a deep copy to avoid modifying the original object
   const enhancedPalette = JSON.parse(JSON.stringify(palette));

  // Skip enhancement for palettes that have fixed colors
  if (palette.name === "rainbow" || palette.name === "cursed") {
    return enhancedPalette;
  }

  // --- Saturation adjustment based on personality ---
  const moundColor = enhancedPalette.mound;
  if (moundColor && moundColor.length === 3) {
    let saturationMultiplier = 1.0;
    if (personality === "cheerful" || personality === "playful") {
      saturationMultiplier = 1.15; // More vibrant
    } else if (personality === "sleepy" || personality === "shy" || personality === "grumpy") {
      saturationMultiplier = 0.85; // More muted
    }

    // Apply saturation adjustment (simplified - adjust RGB values towards/away from gray)
    const gray = (moundColor[0] * 0.299 + moundColor[1] * 0.587 + moundColor[2] * 0.114);
    enhancedPalette.mound = [
      clamp(gray + (moundColor[0] - gray) * saturationMultiplier, 0, 255),
      clamp(gray + (moundColor[1] - gray) * saturationMultiplier, 0, 255),
      clamp(gray + (moundColor[2] - gray) * saturationMultiplier, 0, 255)
    ];
  }

  // --- Contrast Enhancement (Mound vs. Sky) ---
  const skyColor = enhancedPalette.sky;
  if (moundColor && skyColor && moundColor.length === 3 && skyColor.length === 3) {
    // Calculate perceived brightness (Luma)
    const moundLuma = (moundColor[0] * 0.299 + moundColor[1] * 0.587 + moundColor[2] * 0.114) / 255;
    const skyLuma = (skyColor[0] * 0.299 + skyColor[1] * 0.587 + skyColor[2] * 0.114) / 255;
    const contrastThreshold = 0.15; // Minimum Luma difference

    if (Math.abs(moundLuma - skyLuma) < contrastThreshold) {
      console.log(`Adjusting contrast for palette: ${palette.name}`);
      // Adjust sky brightness to increase contrast
      let adjustmentFactor = (moundLuma > 0.5) ? 0.7 : 1.3; // Darken sky for light mound, lighten for dark mound

      enhancedPalette.sky = [
        clamp(skyColor[0] * adjustmentFactor, 0, 255),
        clamp(skyColor[1] * adjustmentFactor, 0, 255),
        clamp(skyColor[2] * adjustmentFactor, 0, 255)
      ];

      // Also adjust skylines to match
       if (enhancedPalette.skyLines && enhancedPalette.skyLines.length === 3) {
           enhancedPalette.skyLines = [
               clamp(enhancedPalette.skyLines[0] * adjustmentFactor, 0, 255),
               clamp(enhancedPalette.skyLines[1] * adjustmentFactor, 0, 255),
               clamp(enhancedPalette.skyLines[2] * adjustmentFactor, 0, 255)
           ];
       }
    }
  }

  // --- Cheek Contrast ---
   const cheekColor = enhancedPalette.cheeks;
   if (moundColor && cheekColor && moundColor.length === 3 && cheekColor.length === 3) {
       const moundLuma = (moundColor[0] * 0.299 + moundColor[1] * 0.587 + moundColor[2] * 0.114) / 255;
       const cheekLuma = (cheekColor[0] * 0.299 + cheekColor[1] * 0.587 + cheekColor[2] * 0.114) / 255;
       const cheekContrastThreshold = 0.1; // Lower threshold is okay for cheeks

       if (Math.abs(moundLuma - cheekLuma) < cheekContrastThreshold) {
            console.log(`Adjusting cheek contrast for palette: ${palette.name}`);
            let adjustmentFactor = (moundLuma > cheekLuma) ? 1.15 : 0.85; // Make cheeks stand out more

            enhancedPalette.cheeks = [
                clamp(cheekColor[0] * adjustmentFactor, 0, 255),
                clamp(cheekColor[1] * adjustmentFactor, 0, 255),
                clamp(cheekColor[2] * adjustmentFactor, 0, 255)
            ];
       }
   }

  // Ensure all color values are integers
  for (const key in enhancedPalette) {
     if (Array.isArray(enhancedPalette[key]) && enhancedPalette[key].length === 3) {
       enhancedPalette[key] = enhancedPalette[key].map(Math.round);
     }
     // Handle dot range colors if they exist
     if (key === 'dots' && typeof enhancedPalette[key] === 'object') {
         for (const channel in enhancedPalette[key]) {
             if (Array.isArray(enhancedPalette[key][channel])) {
                 enhancedPalette[key][channel] = enhancedPalette[key][channel].map(Math.round);
             }
         }
     }
  }


  return enhancedPalette;
}

// --- Exports --- 
window.generateColorPalette = generateColorPalette;
window.enhanceColorHarmony = enhanceColorHarmony; // Export if needed directly
window.findPaletteByName = findPaletteByName; // Export the new function

// --- END OF FILE src/generators/colors.js ---