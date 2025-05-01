// --- START OF FILE lib/utils.js ---

/**
 * Utility functions for the Mound Mascot project
 */

// --- Randomness ---

// Ensure $fx is available or provide a fallback for standalone testing
if (typeof $fx === 'undefined') {
  console.warn("fxhash context not found, using Math.random().");
  var $fx = {
    rand: Math.random,
    hash: 'dev-' + Math.random().toString(36).substring(2, 15),
    isPreview: false,
    preview: () => console.log("Preview called (dev mode)."),
    params: () => {}, // Mock fxhash functions
    features: () => {}
  };
}

/**
 * Returns a random float between 0 (inclusive) and 1 (exclusive), using fxrand.
 * @returns {number} A random float between 0 and 1.
 */
function random() {
  return $fx.rand();
}

/**
 * Returns a random float between min (inclusive) and max (exclusive).
 * If only one argument is provided, returns a float between 0 and min.
 * @param {number} min - The minimum value or the maximum value if max is omitted.
 * @param {number} [max] - The maximum value.
 * @returns {number} A random float within the specified range.
 */
function randomInRange(min, max) {
  if (max === undefined) {
    return $fx.rand() * min;
  } else {
    return min + $fx.rand() * (max - min);
  }
}

/**
 * Returns a random integer between min (inclusive) and max (inclusive).
 * @param {number} min - The minimum integer value.
 * @param {number} max - The maximum integer value.
 * @returns {number} A random integer within the specified range.
 */
function randomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor($fx.rand() * (max - min + 1)) + min;
}

/**
 * Selects a random element from an array.
 * @param {Array<any>} arr - The array to select from.
 * @returns {any} A random element from the array, or undefined if the array is empty.
 */
function randomFromArray(arr) {
  if (!arr || arr.length === 0) {
    console.warn("Attempted to select from an empty array.");
    return undefined;
  }
  return arr[Math.floor($fx.rand() * arr.length)];
}

/**
 * Returns true based on a given percentage probability (0 to 1).
 * @param {number} percentage - The probability (0 to 1).
 * @returns {boolean} True if the random check passes, false otherwise.
 */
function randomChance(percentage) {
  return $fx.rand() < percentage;
}

/**
 * Selects an option from an object based on weighted probabilities.
 * @param {Object.<string, number>} weights - An object where keys are options and values are their weights.
 * @returns {string | null} The selected option key, or null if weights are invalid.
 */
function weightedRandomSelect(weights) {
  if (!weights || typeof weights !== 'object' || Object.keys(weights).length === 0) {
    console.warn("Invalid weights object provided for weightedRandomSelect.");
    return null;
  }

  let totalWeight = 0;
  for (const weight of Object.values(weights)) {
    if (typeof weight === 'number' && weight >= 0) {
      totalWeight += weight;
    } else {
       console.warn("Invalid weight found in weightedRandomSelect:", weight);
       // Skip invalid weights or handle as needed
    }
  }

  if (totalWeight <= 0) {
     console.warn("Total weight is zero or less in weightedRandomSelect.");
     // Return the first key as a fallback if total weight is 0
     return Object.keys(weights)[0];
  }

  const randomVal = $fx.rand() * totalWeight;
  let cumulativeWeight = 0;

  for (const [option, weight] of Object.entries(weights)) {
     if (typeof weight === 'number' && weight >= 0) {
      cumulativeWeight += weight;
      if (randomVal <= cumulativeWeight) {
        return option;
      }
    }
  }

  // Fallback in case of floating point issues or empty valid weights
  console.warn("Weighted random selection failed to select an item, returning first valid option.");
  return Object.keys(weights).find(key => typeof weights[key] === 'number' && weights[key] >= 0) || null;
}

/**
 * Selects an item based on weighted probabilities using fxrand().
 * @param {object} weights - An object where keys are items and values are their weights (positive numbers).
 * @returns {string|null} The selected item key, or null if weights are invalid or empty.
 */
function fxWeightedRandomSelect(weights) {
  if (!weights || typeof weights !== 'object') {
    console.error("fxWeightedRandomSelect: Invalid weights object provided.");
    return null;
  }

  const items = Object.keys(weights);
  if (items.length === 0) {
    console.error("fxWeightedRandomSelect: Weights object is empty.");
    return null;
  }

  let totalWeight = 0;
  for (const item of items) {
    const weight = weights[item];
    if (typeof weight !== 'number' || weight < 0) {
      console.warn(`fxWeightedRandomSelect: Invalid or negative weight for item '${item}'. Skipping.`);
      continue;
    }
    totalWeight += weight;
  }

  if (totalWeight <= 0) {
     console.error("fxWeightedRandomSelect: Total weight is zero or negative, cannot select.");
     // Fallback: return a random item with equal probability if possible
     return items.length > 0 ? items[Math.floor($fx.rand() * items.length)] : null;
    }

    let random = $fx.rand() * totalWeight;
    let cumulativeWeight = 0;

  for (const item of items) {
     const weight = weights[item];
     if (typeof weight !== 'number' || weight < 0) continue; // Skip invalid weights handled before

    cumulativeWeight += weight;
    if (random < cumulativeWeight) {
      return item;
    }
  }

  // Fallback in case of floating point issues or unexpected structure
  console.warn("fxWeightedRandomSelect: Fallback triggered. Returning last valid item or null.");
   const validItems = items.filter(item => typeof weights[item] === 'number' && weights[item] >= 0);
  return validItems.length > 0 ? validItems[validItems.length - 1] : null;
}

// --- Geometry & Drawing ---

/**
 * Draws a star shape centered at (cx, cy).
 * Requires p5.js context (beginShape, vertex, endShape, cos, sin, TWO_PI).
 * @param {number} cx - Center x-coordinate.
 * @param {number} cy - Center y-coordinate.
 * @param {number} innerR - Inner radius of the star points.
 * @param {number} outerR - Outer radius of the star points.
 * @param {number} points - Number of points on the star.
 */
function drawStar(cx, cy, innerR, outerR, points) {
  if (typeof beginShape !== 'function') {
     console.error("p5.js context not available for drawStar.");
     return;
  }
  let angleStep = TWO_PI / (points * 2);
  beginShape();
  for (let i = 0; i < points * 2; i++) {
    let r = (i % 2 === 0) ? outerR : innerR;
    let sx = cx + cos(i * angleStep) * r;
    let sy = cy + sin(i * angleStep) * r;
    vertex(sx, sy);
  }
  endShape(CLOSE);
}

/**
 * Checks if a point (px, py) is inside a polygon defined by an array of vertices.
 * Uses the ray-casting algorithm.
 * @param {number} px - The x-coordinate of the point.
 * @param {number} py - The y-coordinate of the point.
 * @param {Array<{x: number, y: number}>} polygon - An array of vertex objects {x, y}.
 * @returns {boolean} True if the point is inside the polygon, false otherwise.
 */
function pointInPolygon(px, py, polygon) {
  if (!polygon || polygon.length < 3) {
    return false; // Need at least 3 vertices for a polygon
  }
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    let xi = polygon[i].x, yi = polygon[i].y;
    let xj = polygon[j].x, yj = polygon[j].y;

    // Check if the horizontal ray intersects the edge
    let intersect = ((yi > py) !== (yj > py)) &&
                    (px < (xj - xi) * (py - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * Calculates the distance between two points.
 * Requires p5.js context (dist).
 * @param {number} x1 - x-coordinate of the first point.
 * @param {number} y1 - y-coordinate of the first point.
 * @param {number} x2 - x-coordinate of the second point.
 * @param {number} y2 - y-coordinate of the second point.
 * @returns {number} The distance between the points.
 */
function distance(x1, y1, x2, y2) {
  if (typeof dist !== 'function') {
     console.error("p5.js context not available for distance.");
     return 0;
  }
   return dist(x1, y1, x2, y2);
}

/**
 * Calculates the shortest distance from a point (px, py) to a line segment defined by (x1, y1) and (x2, y2).
 * Requires p5.js context (sqrt).
 * @param {number} x1 - x-coordinate of the line segment's start point.
 * @param {number} y1 - y-coordinate of the line segment's start point.
 * @param {number} x2 - x-coordinate of the line segment's end point.
 * @param {number} y2 - y-coordinate of the line segment's end point.
 * @param {number} px - x-coordinate of the point.
 * @param {number} py - y-coordinate of the point.
 * @returns {number} The shortest distance from the point to the line segment.
 */
function distToLineSegment(x1, y1, x2, y2, px, py) {
  if (typeof sqrt !== 'function') {
     console.error("p5.js context not available for distToLineSegment.");
     return 0;
  }
  const l2 = distance(x1, y1, x2, y2) ** 2;
  if (l2 === 0) return distance(px, py, x1, y1); // Segment is a point

  // Project point (px, py) onto the line defined by (x1, y1) and (x2, y2)
  // Find parameter t representing the projection's position along the segment
  let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
  t = Math.max(0, Math.min(1, t)); // Clamp t to the range [0, 1] to stay on the segment

  // Calculate the coordinates of the closest point on the segment
  const closestX = x1 + t * (x2 - x1);
  const closestY = y1 + t * (y2 - y1);

  // Return the distance from the original point to the closest point on the segment
  return distance(px, py, closestX, closestY);
}

// --- Math Helpers ---

/**
 * Clamps a value between a minimum and maximum.
 * @param {number} value - The value to clamp.
 * @param {number} min - The minimum allowed value.
 * @param {number} max - The maximum allowed value.
 * @returns {number} The clamped value.
 */
function clamp(value, min, max) {
  return Math.max(min, Math.min(value, max));
}

/**
 * Linear interpolation between two values.
 * Requires p5.js context (lerp).
 * @param {number} start - The starting value.
 * @param {number} stop - The ending value.
 * @param {number} amt - The amount to interpolate (0.0 to 1.0).
 * @returns {number} The interpolated value.
 */
function lerp(start, stop, amt) {
   if (typeof lerp !== 'function') {
     console.error("p5.js context not available for lerp.");
     return start + (stop - start) * amt; // Manual fallback
  }
  return lerp(start, stop, amt);
}

// Export functions to global scope for p5.js compatibility if needed
// (though direct usage is preferred if structure allows)
window.random = random;
window.randomInRange = randomInRange;
window.randomInt = randomInt;
window.randomFromArray = randomFromArray;
window.randomChance = randomChance;
window.weightedRandomSelect = weightedRandomSelect;
window.drawStar = drawStar;
window.pointInPolygon = pointInPolygon;
window.distToLineSegment = distToLineSegment; // Export this helper
window.clamp = clamp;
// window.lerp = lerp; // p5 already provides lerp globally
window.fxWeightedRandomSelect = fxWeightedRandomSelect;

// Assuming the file might use CommonJS or ES Modules, will attempt a simple export
// If the project uses ES Modules, this should ideally be `export { fxWeightedRandomSelect };`
// If it uses CommonJS, this should be `module.exports.fxWeightedRandomSelect = fxWeightedRandomSelect;`
// Adding a basic export that might work in simple browser scripts or needs adjustment.
// If there's an existing export pattern, adjust accordingly.
if (typeof module !== 'undefined' && module.exports) {
     // Append to existing exports if module.exports is already an object
     if (typeof module.exports === 'object' && module.exports !== null) {
         module.exports.fxWeightedRandomSelect = fxWeightedRandomSelect;
     } else {
         // Otherwise, create a new object or handle potential conflicts
         module.exports = { ...(typeof module.exports === 'object' ? module.exports : {}), fxWeightedRandomSelect };
     }
} else if (typeof window !== 'undefined') {
     window.fxWeightedRandomSelect = fxWeightedRandomSelect; // Simple global export for browser
}

// --- END OF FILE lib/utils.js ---