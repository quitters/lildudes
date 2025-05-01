// --- START OF FILE src/generators/rarity.js ---

/**
 * Rarity calculation system for the Mound Mascot project.
 * Calculates a score and determines a tier based on trait combinations.
 */

/**
 * Calculates a numerical rarity score based on the traits in the provided state object.
 * Higher scores indicate rarer combinations.
 * @param {object} state - The application state object containing the generated traits.
 * @returns {number} The calculated rarity score. Returns 0 if state is invalid.
 */
function calculateRarity(state) {
  if (!state || typeof state !== 'object') {
    console.error("calculateRarity received invalid state.");
    return 0;
  }

  let score = 0;

  // --- Base Score Modifiers ---
  // Mound Shape Rarity
  switch (state.moundShape) {
    case 'asymmetric': score += 15; break; // Rarest shape
    case 'tall': score += 7; break;
    case 'wide': score += 5; break;
    case 'normal': score += 1; break; // Common baseline
    default: score += 1;
  }

  // Personality Rarity (Less impact than shape/visuals)
  switch (state.personalityType) {
    case 'grumpy': score += 3; break; // Slightly rarer
    case 'shy': score += 2; break;
    // Others are more common
    default: score += 1;
  }

  // Palette Rarity
  const paletteName = state.palette?.name;
  switch (paletteName) {
    case 'cursed': score += 30; break; // Very rare palette
    case 'rainbow': score += 25; break;
    case 'golden': score += 20; break;
    case 'twilight': score += 15; break;
    case 'pastel': score += 10; break;
    // Others have lower base rarity impact
    default: score += 2;
  }

  // Background Rarity (Assuming some are rarer)
  switch (state.backgroundType) {
    case 'forest_hills': score += 8; break; // Example: Enhanced backgrounds might be rarer
    case 'starry': score += 5; break;
    case 'mountains': score += 5; break;
    // Others less rare
    default: score += 1;
  }

  // --- Boolean Trait Scores ---
  if (state.hasAccessory) score += 12; // Accessories add significant rarity
  if (state.hasPattern) score += 8;
  if (state.hasGlow) score += 15;
  if (state.hasShimmer) score += 18; // Shimmer linked to shiny
  if (state.hasMysteryEyes) score += 25;
  if (state.isShiny) score += 22;
  if (state.isCursed) score += 40; // Cursed trait is very rare
  if (state.hasSpecialColor) score += 5; // Bonus if eligible for special palettes

  // --- Combination Bonuses ---
  // Count primary visual effects/rare traits
  let specialEffectCount = 0;
  if (state.hasGlow) specialEffectCount++;
  if (state.hasShimmer) specialEffectCount++; // or isShiny
  if (state.hasMysteryEyes) specialEffectCount++;
  if (state.isCursed) specialEffectCount++;
  if (state.hasPattern) specialEffectCount++; // Count pattern as a visual effect
  if (state.hasAccessory) specialEffectCount++; // Count accessory

  // Add significant bonus for multiple special traits
  if (specialEffectCount >= 2) score += 10 * (specialEffectCount - 1);
  if (specialEffectCount >= 3) score += 15 * (specialEffectCount - 2);
  if (specialEffectCount >= 4) score += 20 * (specialEffectCount - 3);


  // Specific named combinations get extra points
  const comboName = getSpecialCombinationName(state); // Use function from config.js
   switch (comboName) {
    case "Eldritch Mound": score += 30; break; // Cursed + Mystery Eyes
    case "Golden Treasure": score += 25; break; // Golden Palette + Shiny
    case "Prismatic Wonder": score += 20; break; // Rainbow Palette + Glow
    case "Forest Spirit": score += 15; break;
    case "Night Watcher": score += 15; break;
    case "Royal Mound": score += 18; break;
    // Add points for other combos if defined
  }

  // --- Final Score ---
  // The score can be returned as is, or normalized if preferred.
  // Let's return the raw score for now, tiers will interpret it.
  return Math.max(0, score); // Ensure score is not negative
}

/**
 * Determines the rarity tier name based on a calculated score.
 * @param {number} rarityScore - The numerical rarity score calculated by calculateRarity.
 * @returns {string} The name of the rarity tier (e.g., "Common", "Rare", "Mythic").
 */
function getRarityTier(rarityScore) {
  // Define score thresholds for each tier
  // These thresholds might need tuning based on observed score distribution
  if (rarityScore >= 120) return 'Mythic';    // ~Top 1-2%?
  if (rarityScore >= 80) return 'Legendary'; // ~Top 5-10%?
  if (rarityScore >= 45) return 'Rare';      // ~Top 20-25%?
  if (rarityScore >= 20) return 'Uncommon';  // ~Top 50%?
  return 'Common';                           // Bottom 50%
}

// --- Safe Wrappers ---

/**
 * Safe wrapper for calculateRarity to handle potential errors during calculation.
 * @param {object} state - The application state object.
 * @returns {number} The calculated rarity score, or 0 if an error occurs.
 */
function calculateRaritySafe(state) {
  try {
    return calculateRarity(state);
  } catch (error) {
    logError('Rarity Calculation', error); // Assumes logError is available
    return 0; // Default score on error
  }
}

/**
 * Safe wrapper for getRarityTier to handle potential errors.
 * @param {number} rarityScore - The numerical rarity score.
 * @returns {string} The rarity tier name, or "Unknown" if an error occurs.
 */
function getRarityTierSafe(rarityScore) {
  try {
    // Ensure input is a number
    const score = (typeof rarityScore === 'number') ? rarityScore : 0;
    return getRarityTier(score);
  } catch (error) {
     logError('Rarity Tier Determination', error); // Assumes logError is available
    return 'Unknown'; // Default tier on error
  }
}

// --- Exports ---
window.calculateRarity = calculateRarity;
window.getRarityTier = getRarityTier;
window.calculateRaritySafe = calculateRaritySafe;
window.getRarityTierSafe = getRarityTierSafe;

// --- END OF FILE src/generators/rarity.js ---