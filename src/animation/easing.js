// --- START OF FILE src/animation/easing.js ---

/**
 * Enhanced animation easing functions for the Mound Mascot project.
 * Provides various curves for creating more natural and expressive movement.
 */

// Ensure PI is available (it should be global in p5 context or standard JS)
const PI = Math.PI;

// Easing function collection
const Easing = {
  // Linear (no easing)
  linear: t => t,

  // --- Standard Easing Functions ---
  // Quadratic (t^2)
  easeInQuad: t => t * t,
  easeOutQuad: t => t * (2 - t),
  easeInOutQuad: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,

  // Cubic (t^3)
  easeInCubic: t => t * t * t,
  easeOutCubic: t => (--t) * t * t + 1,
  easeInOutCubic: t => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,

  // Quartic (t^4)
  easeInQuart: t => t * t * t * t,
  easeOutQuart: t => 1 - (--t) * t * t * t,
  easeInOutQuart: t => t < 0.5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t,

  // Quintic (t^5)
  easeInQuint: t => t * t * t * t * t,
  easeOutQuint: t => 1 + (--t) * t * t * t * t,
  easeInOutQuint: t => t < 0.5 ? 16 * t * t * t * t * t : 1 + 16 * (--t) * t * t * t * t,

  // Sinusoidal
  easeInSine: t => 1 - Math.cos(t * PI / 2),
  easeOutSine: t => Math.sin(t * PI / 2),
  easeInOutSine: t => -(Math.cos(PI * t) - 1) / 2,

  // Exponential
  easeInExpo: t => t === 0 ? 0 : Math.pow(2, 10 * t - 10),
  easeOutExpo: t => t === 1 ? 1 : 1 - Math.pow(2, -10 * t),
  easeInOutExpo: t => t === 0 ? 0 : t === 1 ? 1 : t < 0.5
      ? Math.pow(2, 20 * t - 10) / 2
      : (2 - Math.pow(2, -20 * t + 10)) / 2,

  // Circular
  easeInCirc: t => 1 - Math.sqrt(1 - Math.pow(t, 2)),
  easeOutCirc: t => Math.sqrt(1 - Math.pow(t - 1, 2)),
  easeInOutCirc: t => t < 0.5
      ? (1 - Math.sqrt(1 - Math.pow(2 * t, 2))) / 2
      : (Math.sqrt(1 - Math.pow(-2 * t + 2, 2)) + 1) / 2,

  // --- Fancy Easing Functions ---
  // Elastic
  easeInElastic: t => {
    const c4 = (2 * PI) / 3;
    return t === 0 ? 0 : t === 1 ? 1 : -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * c4);
  },
  easeOutElastic: t => {
    const c4 = (2 * PI) / 3;
    return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  },
  easeInOutElastic: t => {
    const c5 = (2 * PI) / 4.5;
    return t === 0 ? 0 : t === 1 ? 1 : t < 0.5
      ? -(Math.pow(2, 20 * t - 10) * Math.sin((20 * t - 11.125) * c5)) / 2
      : (Math.pow(2, -20 * t + 10) * Math.sin((20 * t - 11.125) * c5)) / 2 + 1;
  },

  // Back (overshoot)
  easeInBack: t => {
    const c1 = 1.70158; // Default overshoot amount
    const c3 = c1 + 1;
    return c3 * t * t * t - c1 * t * t;
  },
  easeOutBack: t => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },
  easeInOutBack: t => {
    const c1 = 1.70158;
    const c2 = c1 * 1.525;
    return t < 0.5
      ? (Math.pow(2 * t, 2) * ((c2 + 1) * 2 * t - c2)) / 2
      : (Math.pow(2 * t - 2, 2) * ((c2 + 1) * (t * 2 - 2) + c2) + 2) / 2;
  },

  // Bounce
  easeOutBounce: t => {
    const n1 = 7.5625;
    const d1 = 2.75;
    if (t < 1 / d1) { return n1 * t * t; }
    else if (t < 2 / d1) { return n1 * (t -= 1.5 / d1) * t + 0.75; }
    else if (t < 2.5 / d1) { return n1 * (t -= 2.25 / d1) * t + 0.9375; }
    else { return n1 * (t -= 2.625 / d1) * t + 0.984375; }
  },
  easeInBounce: t => 1 - Easing.easeOutBounce(1 - t),
  easeInOutBounce: t => t < 0.5
    ? (1 - Easing.easeOutBounce(1 - 2 * t)) / 2
    : (1 + Easing.easeOutBounce(2 * t - 1)) / 2,

   // --- Custom / Specialized --- (Can add more as needed)
   breathe: t => 0.5 + 0.5 * Math.sin(t * PI * 2 - PI / 2), // Simulates breathing in/out
   wobble: t => 0.5 + 0.5 * Math.sin(t * PI * 2.2 + Math.sin(t * PI * 5) * 0.2) // Side-to-side with variation
};

/**
 * Selects an appropriate easing function based on animation type and personality.
 * Provides different "feels" for the same animation type depending on character.
 * @param {string} animationType - The name of the animation (e.g., "jello", "breathe").
 * @param {string} personality - The mascot's personality type.
 * @returns {Function} The selected easing function (defaults to linear if not found).
 */
function getEasingFunction(animationType, personality) {
  // Choose base easing function based on animation type
  switch(animationType) {
    case "jello":
      // Jello uses elastic or bounce variations
      if (personality === "playful" || personality === "cheerful") return Easing.easeOutElastic;
      if (personality === "grumpy") return Easing.easeInOutBounce; // Stiffer bounce
      return Easing.easeOutBack; // Slight overshoot for others

    case "breathe":
      // Breathing uses sinusoidal variations
      if (personality === "sleepy") return Easing.easeInOutSine; // Smoothest
      if (personality === "curious" || personality === "playful") return Easing.easeOutSine; // Faster inhale feel
      return Easing.easeInOutQuad; // Default gentle curve

    case "wobble":
      // Wobble uses sine or custom wobble function
      if (personality === "playful") return Easing.wobble; // Custom wobble
      if (personality === "shy") return Easing.easeInOutSine; // Gentle sway
      return Easing.easeInOutCubic; // Standard smooth wobble

    case "pulse":
      // Pulse uses exponential or elastic variations
      if (personality === "cheerful" || personality === "playful") return Easing.easeOutExpo; // Strong outward pulse
      if (personality === "sleepy") return Easing.easeInOutCubic; // Gentle pulse
      return Easing.easeOutQuad; // Standard pulse

    case "sway":
      // Sway uses sinusoidal or back variations
      if (personality === "playful") return Easing.easeInOutBack; // Bouncy sway
      if (personality === "shy" || personality === "sleepy") return Easing.easeInOutSine; // Gentle rock
      return Easing.easeInOutQuad; // Standard sway

    default:
      // Default to a gentle ease-in-out for unknown types
      return Easing.easeInOutQuad;
  }
}

/**
 * Applies the selected easing function to a normalized time value (0 to 1).
 * @param {number} t - Normalized time (0 to 1).
 * @param {string} animationType - The name of the animation type.
 * @param {string} personality - The mascot's personality type.
 * @returns {number} The eased value (usually between 0 and 1, but some easing functions can exceed this range).
 */
function applyEasing(t, animationType, personality) {
  const easingFunction = getEasingFunction(animationType, personality);
  // Ensure t is clamped between 0 and 1 before applying easing
  const clampedT = Math.max(0, Math.min(1, t));
  return easingFunction(clampedT);
}

// --- Exports ---
window.Easing = Easing; // Make the collection available
window.applyEasing = applyEasing; // Make the helper available

// --- END OF FILE src/animation/easing.js ---