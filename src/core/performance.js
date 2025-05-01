// --- START OF FILE src/core/performance.js ---

/**
 * Performance monitoring and optimization system for the Mound Mascot project.
 * Dynamically adjusts rendering quality and update frequency based on frame rate.
 */

// --- Performance Tracking Variables ---
let _frameRates = []; // Array to store recent frame rates
const FRAME_RATE_SAMPLE_SIZE = 30; // Number of frames to average (reduced from 60)
let _lastFrameRateCheckTime = 0; // Timestamp of the last check
const FRAME_RATE_CHECK_INTERVAL = 8000; // Check every 8000ms (8 seconds) - reduced from 10s

let _currentPerformanceLevel = "high"; // Current level: "high", "medium", "low"
let _frameSkipCounter = 0; // Counter for frame skipping
let _frameSkipRate = 0; // How many frames to skip (0 = no skipping)

// --- Initialization ---

/**
 * Initializes the performance monitoring system.
 * Resets tracking variables and sets initial performance level to high.
 */
function initPerformanceMonitoring() {
  _frameRates = [];
  _lastFrameRateCheckTime = typeof millis === 'function' ? millis() : Date.now(); // Use millis if p5 exists
  _currentPerformanceLevel = "high";

  // Set initial high-performance settings in state
  const initialSettings = {
    level: "high",
    animationUpdateFrequency: 1, // Update mound animation every frame
    effectUpdateFrequency: 1,    // Update effects every frame
    backgroundAnimationEnabled: true,
    textureDetail: "high",      // Use high-detail textures
    effectCountMultiplier: 1.0, // Full number of particles/effects
    resolutionScale: 1.0,       // Full resolution rendering
    frameSkipRate: 0            // No frame skipping
  };

  if (typeof updateState === 'function') {
    updateState('performanceSettings', initialSettings);
    console.log("Performance monitoring initialized at 'high' level.");
  } else {
    console.error("Cannot initialize performance settings: updateState function not found.");
  }
}

// --- Core Monitoring & Adjustment ---

/**
 * Monitors frame rate and adjusts performance settings accordingly.
 * Should be called once per frame, typically within the main draw loop.
 * Requires p5.js context for frameRate() and millis().
 */
function monitorPerformance() {
  // Ensure p5 functions are available
  if (typeof frameRate !== 'function' || typeof millis !== 'function') {
     if (!window._p5MonitorWarned) {
        console.warn("p5.js context (frameRate, millis) not available for performance monitoring.");
        window._p5MonitorWarned = true;
     }
     return;
  }

  const currentFrameRate = frameRate();
  const currentTime = millis();

  // Add current frame rate to sample array
  _frameRates.push(currentFrameRate);

  // Limit sample size
  if (_frameRates.length > FRAME_RATE_SAMPLE_SIZE) {
    _frameRates.shift();
  }

  // Check performance periodically
  if (currentTime - _lastFrameRateCheckTime > FRAME_RATE_CHECK_INTERVAL) {
    if (_frameRates.length === 0) return; // Avoid division by zero if no frames recorded yet

    // Calculate average frame rate
    const avgFrameRate = _frameRates.reduce((sum, fr) => sum + fr, 0) / _frameRates.length;

    // Add hysteresis to avoid rapid fluctuations
    // Only change if the threshold is significantly crossed or persistent for a while
    
    // Track time spent in potential new state
    if (!window._potentialPerformanceState) {
      window._potentialPerformanceState = {
        level: _currentPerformanceLevel,
        timeStart: currentTime,
        changed: false
      };
    }
    
    // Determine potential new performance level with wider thresholds
    let potentialNewLevel;
    if (_currentPerformanceLevel === "high" && avgFrameRate < 25) {
      potentialNewLevel = "medium"; // Drop from high when below threshold
    } else if (_currentPerformanceLevel === "medium" && avgFrameRate < 18) {
      potentialNewLevel = "low"; // Drop from medium when below threshold
    } else if (_currentPerformanceLevel === "low" && avgFrameRate < 12) {
      // If still struggling on low, keep at low but will adjust resolution scaling
      potentialNewLevel = "low";
    } else if (_currentPerformanceLevel === "medium" && avgFrameRate > 35) {
      potentialNewLevel = "high"; // Increase from medium when above threshold
    } else if (_currentPerformanceLevel === "low" && avgFrameRate > 28) {
      potentialNewLevel = "medium"; // Increase from low when above threshold
    } else {
      potentialNewLevel = _currentPerformanceLevel; // No change needed
    }
    
    // Handle extreme cases - if FPS is very low even at low settings, adjust resolution scale
    if (potentialNewLevel === "low" && avgFrameRate < 15) {
      // Calculate a good resolution scale between 0.5 and 0.9 based on how bad performance is
      // The worse the performance, the lower the resolution
      const currentScale = typeof getResolutionScale === 'function' ? getResolutionScale() : 1.0;
      const targetScale = Math.max(0.5, Math.min(0.9, avgFrameRate / 30));
      
      // Only change if there's a significant difference
      if (Math.abs(currentScale - targetScale) > 0.1) {
        console.log(`Adjusting resolution scale: ${currentScale.toFixed(2)} -> ${targetScale.toFixed(2)} (FPS: ${avgFrameRate.toFixed(1)})`);
        if (typeof setResolutionScale === 'function') {
          setResolutionScale(targetScale);
        }
      }
    } else if (potentialNewLevel !== "low" && typeof getResolutionScale === 'function' && getResolutionScale() < 1.0) {
      // If performance is good enough to move up from low, also restore resolution
      setResolutionScale(1.0);
    }
    
    // Track potential state change
    if (potentialNewLevel !== window._potentialPerformanceState.level) {
      // Reset timer for potential new state
      window._potentialPerformanceState = {
        level: potentialNewLevel,
        timeStart: currentTime,
        changed: false
      };
    }
    
    // Only apply change if potential state has been consistent for 3 seconds
    const minTimeInState = 3000; // 3 seconds
    if (!window._potentialPerformanceState.changed && 
        potentialNewLevel !== _currentPerformanceLevel &&
        currentTime - window._potentialPerformanceState.timeStart > minTimeInState) {
      
      console.log(`Performance level changed: ${_currentPerformanceLevel} -> ${potentialNewLevel} (Avg FPS: ${avgFrameRate.toFixed(1)})`); 
      _currentPerformanceLevel = potentialNewLevel;
      updatePerformanceSettings(_currentPerformanceLevel);
      window._potentialPerformanceState.changed = true;
    }

    // Reset check time
    _lastFrameRateCheckTime = currentTime;
  }
}

/**
 * Updates performance settings in the global state based on the specified level.
 * @param {"high" | "medium" | "low"} level - The target performance level.
 */
function updatePerformanceSettings(level) {
  const settings = {
    level: level,
    animationUpdateFrequency: 1, // Update mound vertex animation every N frames
    effectUpdateFrequency: 1,    // Update particles/visual effects every N frames
    backgroundAnimationEnabled: true,
    textureDetail: "high",      // Quality of generated textures ("high", "medium", "low")
    effectCountMultiplier: 1.0,  // Multiplier for particle counts (0.0 to 1.0)
    resolutionScale: 1.0,       // Resolution scaling factor (1.0 = full resolution)
    frameSkipRate: 0            // Skip rendering every N frames (0 = no skipping)
  };

  switch (level) {
    case "low":
      settings.animationUpdateFrequency = 3; // Update animation much less often
      settings.effectUpdateFrequency = 4;    // Update effects much less often
      settings.backgroundAnimationEnabled = false; // Disable background animations entirely
      settings.textureDetail = "low";      // Use low-detail textures or skip textures
      settings.effectCountMultiplier = 0.3; // Significantly reduce particle counts
      settings.resolutionScale = 0.75;     // Reduce resolution for performance
      settings.frameSkipRate = 2;          // Skip every 2nd frame (effectively halving frame rate)
      _frameSkipRate = 2;                  // Update module variable
      break;

    case "medium":
      settings.animationUpdateFrequency = 2; // Update animation less often
      settings.effectUpdateFrequency = 2;    // Update effects less often
      settings.backgroundAnimationEnabled = true; // Keep background animations (if simple)
      settings.textureDetail = "medium";   // Use medium-detail textures
      settings.effectCountMultiplier = 0.6; // Reduce particle counts moderately
      settings.resolutionScale = 0.9;      // Slight resolution reduction
      settings.frameSkipRate = 0;          // No frame skipping
      _frameSkipRate = 0;                  // Update module variable
      break;

    case "high":
    default:
      // Reset frame skip rate
      _frameSkipRate = 0;
      // Keep default high-performance settings
      break;
  }

  // Update state
  if (typeof updateState === 'function') {
    updateState('performanceSettings', settings);
  } else {
    console.error("Cannot update performance settings: updateState function not found.");
  }
}

// --- Helper Functions for Other Modules ---

/**
 * Should the current frame be rendered or skipped entirely?
 * Used for extreme performance optimization.
 * @returns {boolean} True if the frame should be rendered, false if it should be skipped.
 */
function shouldRenderFrame() {
  // If frame skipping is disabled, always render
  if (_frameSkipRate <= 0) return true;
  
  // Otherwise, only render some frames based on the skip rate
  _frameSkipCounter = (_frameSkipCounter + 1) % (_frameSkipRate + 1);
  return _frameSkipCounter === 0;
}

/**
 * Checks if a performance-intensive operation should be performed on the current frame.
 * @param {"animation" | "effect" | "background" | "texture"} operationType - The type of operation.
 * @returns {boolean} True if the operation should proceed, false otherwise.
 */
function shouldPerformOperation(operationType) {
  // Check if we're skipping this frame entirely
  if (_frameSkipRate > 0 && !shouldRenderFrame()) {
    return false;
  }
  
  // Ensure p5 context and state are available
  if (typeof frameCount === 'undefined' || typeof getState !== 'function') {
     return true; // Default to allowing operation if checks fail
  }

  const state = getState();
  // Provide default settings if not yet initialized
  const settings = state.performanceSettings || {
    level: "high",
    animationUpdateFrequency: 1,
    effectUpdateFrequency: 1,
    backgroundAnimationEnabled: true,
    textureDetail: "high",
    resolutionScale: 1.0,
    frameSkipRate: 0
  };

  switch (operationType) {
    case "animation":
      return frameCount % settings.animationUpdateFrequency === 0;
    case "effect":
      return frameCount % settings.effectUpdateFrequency === 0;
    case "background":
      // Check if background animation is enabled at all
      return settings.backgroundAnimationEnabled;
    case "texture":
      // Only allow texture generation/updates on medium or high
      return settings.level !== "low";
    default:
      return true; // Allow unknown operation types
  }
}

/**
 * Gets appropriate detail level settings based on the current performance level.
 * Used by rendering modules to adjust complexity.
 * @param {"texture" | "particles"} detailType - The type of detail required.
 * @returns {object} An object containing detail settings (e.g., stepSize, multiplier).
 */
function getDetailLevel(detailType) {
   const state = getState();
   // Provide default settings if not yet initialized
   const settings = state.performanceSettings || {
      level: "high",
      textureDetail: "high",
      effectCountMultiplier: 1.0
   };

  if (detailType === "texture") {
    switch (settings.textureDetail) {
      case "low":
        return { stepSize: 8, noiseScale: 0.02, skipFactor: 4 }; // Coarser texture
      case "medium":
        return { stepSize: 4, noiseScale: 0.025, skipFactor: 2 }; // Medium texture
      case "high":
      default:
        return { stepSize: 2, noiseScale: 0.03, skipFactor: 1 }; // Fine texture
    }
  }

  if (detailType === "particles" || detailType === "effects") {
    // Return the multiplier directly
    return { multiplier: settings.effectCountMultiplier };
  }

  // Default fallback
  return { level: settings.level, multiplier: 1.0, stepSize: 4 };
}

// --- Exports ---
window.initPerformanceMonitoring = initPerformanceMonitoring;
window.monitorPerformance = monitorPerformance;
window.updatePerformanceSettings = updatePerformanceSettings;
window.shouldPerformOperation = shouldPerformOperation;
window.shouldRenderFrame = shouldRenderFrame;
window.getDetailLevel = getDetailLevel;

// --- END OF FILE src/core/performance.js ---