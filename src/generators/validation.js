// --- START OF FILE src/generators/validation.js ---

/**
 * Trait validation functions for the Mound Mascot project.
 * Ensures coherent trait combinations by fixing known problematic combinations
 * after initial generation.
 */

/**
 * Validates and adjusts trait combinations to ensure they are aesthetically
 * and logically coherent. Should be called after generateTraits().
 * @param {object} traits - The state object containing all generated traits.
 * @returns {object} A potentially modified traits object with validated combinations.
 */
function validateTraitCombination(traits) {
  // Create a copy to avoid modifying the original state directly during validation.
  const validatedTraits = { ...traits };

  console.log("Validating generated traits...");

  // --- 1. Personality & Accessory Conflicts ---
  if (validatedTraits.hasAccessory) {
    const personality = validatedTraits.personalityType;
    const accessory = validatedTraits.accessoryType;

    // Grumpy + Halo is odd
    if (personality === "grumpy" && accessory === "halo") {
      validatedTraits.accessoryType = randomChance(0.6) ? "eyebrows" : "glasses";
      console.log(`Validation: Replaced 'halo' with '${validatedTraits.accessoryType}' for grumpy personality.`);
    }
    // Shy + Crown is odd
    if (personality === "shy" && accessory === "crown") {
      validatedTraits.accessoryType = randomChance(0.7) ? "bow" : "ribbon"; // Changed replacement options
      console.log(`Validation: Replaced 'crown' with '${validatedTraits.accessoryType}' for shy personality.`);
    }
    // Sleepy + Glasses doesn't make much sense visually
    if (personality === "sleepy" && accessory === "glasses") {
       validatedTraits.accessoryType = randomChance(0.5) ? "hat" : "none"; // Remove or replace glasses
       if (validatedTraits.accessoryType === "none") validatedTraits.hasAccessory = false;
       console.log(`Validation: Changed 'glasses' to '${validatedTraits.accessoryType}' for sleepy personality.`);
    }
  }

  // --- 2. Shape & Animation Conflicts ---
  const shape = validatedTraits.moundShape;
  const animType = validatedTraits.moundAnimationType;

  // Tall mounds look bad with horizontal sway
  if (shape === "tall" && animType === "sway") {
    validatedTraits.moundAnimationType = randomChance(0.6) ? "jello" : "breathe";
    console.log(`Validation: Replaced 'sway' animation with '${validatedTraits.moundAnimationType}' for tall shape.`);
  }
  // Asymmetric mounds look odd with very uniform animations like pulse or wobble
  if (shape === "asymmetric" && (animType === "pulse" || animType === "wobble")) {
    validatedTraits.moundAnimationType = randomChance(0.6) ? "breathe" : "jello"; // More organic options
    validatedTraits.animationIntensity = Math.min(validatedTraits.animationIntensity, 0.5); // Reduce intensity too
    console.log(`Validation: Replaced '${animType}' with '${validatedTraits.moundAnimationType}' and reduced intensity for asymmetric shape.`);
  }
   // Wide mounds look odd with strong pulse
   if (shape === "wide" && animType === "pulse") {
       validatedTraits.moundAnimationType = randomChance(0.5) ? "wobble" : "breathe";
       console.log(`Validation: Replaced 'pulse' with '${validatedTraits.moundAnimationType}' for wide shape.`);
   }


  // --- 3. Special Effect Conflicts ---
  // Cursed + Shimmer/Shiny is visually messy
  if (validatedTraits.isCursed && (validatedTraits.isShiny || validatedTraits.hasShimmer)) {
    validatedTraits.isShiny = false;
    validatedTraits.hasShimmer = false;
    console.log(`Validation: Removed shiny/shimmer from cursed mound.`);
  }
  // Mystery Eyes + Glasses hides the eyes
  if (validatedTraits.hasMysteryEyes && validatedTraits.accessoryType === "glasses") {
    // Remove glasses or change accessory
    validatedTraits.accessoryType = randomChance(0.5) ? "hat" : (randomChance(0.5) ? "halo" : "none");
    if (validatedTraits.accessoryType === "none") validatedTraits.hasAccessory = false;
    console.log(`Validation: Changed 'glasses' to '${validatedTraits.accessoryType}' due to Mystery Eyes.`);
  }
  // Glow + Shiny can be too much, prioritize based on shape
  if (validatedTraits.hasGlow && validatedTraits.isShiny) {
     if (shape === 'wide' || shape === 'asymmetric') {
        validatedTraits.hasGlow = false; // Wide/Asymmetric look better just shiny
        console.log(`Validation: Removed glow effect due to shiny on ${shape} shape.`);
     } else {
         validatedTraits.isShiny = false; // Tall/Normal look better just glowing
         validatedTraits.hasShimmer = false;
         console.log(`Validation: Removed shiny effect due to glow on ${shape} shape.`);
     }
  }

  // --- 4. Pattern Conflicts ---
  // Pattern + Glow can be visually busy
  if (validatedTraits.hasPattern && validatedTraits.hasGlow) {
    // Keep the rarer/more impactful trait - Glow is generally rarer
    validatedTraits.hasPattern = false;
    console.log(`Validation: Removed pattern due to conflict with glow effect.`);
  }
  // Pattern on Cursed mound can be too much
  if (validatedTraits.hasPattern && validatedTraits.isCursed) {
     validatedTraits.hasPattern = false;
     console.log(`Validation: Removed pattern from cursed mound.`);
  }


  // --- 5. Background & Palette/Personality Conflicts ---
  const bgType = validatedTraits.backgroundType;
  const personality = validatedTraits.personalityType;
  const paletteName = validatedTraits.palette?.name;

  // Energetic backgrounds (e.g., stripes, potentially grid) clash with sleepy
  if (personality === "sleepy" && (bgType === "stripes" || bgType === "grid")) {
    const calmBackgrounds = ["gradient", "stars", "noise", "hills", "foggy"]; // Assuming foggy is calm
    validatedTraits.backgroundType = randomFromArray(calmBackgrounds);
    console.log(`Validation: Changed background from '${bgType}' to '${validatedTraits.backgroundType}' for sleepy personality.`);
  }
  // Very dark palettes (cursed, moonlight) don't pair well with very bright/busy backgrounds
  if ((paletteName === "cursed" || paletteName === "moonlight" || paletteName === "twilight") &&
      (bgType === "dots" || bgType === "stripes" || bgType === "forest_hills")) {
     const darkBgOptions = ["stars", "gradient", "noise", "grid", "foggy"]; // Assuming foggy is dark/muted
     validatedTraits.backgroundType = randomFromArray(darkBgOptions);
     console.log(`Validation: Changed background from '${bgType}' to '${validatedTraits.backgroundType}' for dark palette '${paletteName}'.`);
  }
   // Very bright palettes (golden, candyfloss) might clash with very dark backgrounds (stars)
   if ((paletteName === "golden" || paletteName === "candyfloss" || paletteName === "rainbow") && bgType === "stars") {
       const brightBgOptions = ["gradient", "dots", "hills", "waves"];
       validatedTraits.backgroundType = randomFromArray(brightBgOptions);
       console.log(`Validation: Changed background from 'stars' to '${validatedTraits.backgroundType}' for bright palette '${paletteName}'.`);
   }

  // Return the (potentially modified) traits object
  return validatedTraits;
}

// --- Exports ---
window.validateTraitCombination = validateTraitCombination;

// --- END OF FILE src/generators/validation.js ---