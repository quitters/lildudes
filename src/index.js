// --- START OF FILE src/index.js ---

/**
 * Main entry point for the Parabolic Mound Mascot project (Refactored).
 * Initializes the application, manages the p5.js draw loop, and orchestrates rendering.
 */

// --- Global State & Config (Loaded via index.html) ---
// Assumes core functions like getState, updateState, initConfigParams, generateTraits, etc.
// and modules for rendering, animation, effects, interaction are loaded globally via script tags.

// --- Add flag for button visibility --- 
let buttonsInitiallyHidden = true;
// --- End Add --- 

// --- Global Buffer Storage ---
let moundTextureBuffer = null;

// --- Loading Progress ---
let _loadingProgress = 0;
const TOTAL_LOADING_STEPS = 10; // Adjusted count

function _updateLoadingProgress(step, message = "") {
  _loadingProgress = Math.min(step, TOTAL_LOADING_STEPS);
  const progressBar = document.getElementById('loading-progress-bar');
  const loadingText = document.querySelector('.loading-text');
  if (progressBar) {
    const percentage = (_loadingProgress / TOTAL_LOADING_STEPS) * 100;
    progressBar.style.width = `${percentage}%`;
  }
  if (loadingText && message) {
      loadingText.textContent = message;
  }
}

function _hideLoadingScreen() {
  const loadingContainer = document.getElementById('loading-container');
  if (loadingContainer) {
      document.body.classList.add('loaded'); // Add class to trigger fade-out
      // Remove after transition (optional, depends on CSS)
      // setTimeout(() => { loadingContainer.style.display = 'none'; }, 500);
  }
}

// p5.js function called before setup
function preload() {
  _updateLoadingProgress(0, "Loading assets...");
  // Load any external assets here if needed (fonts, images)
  // For now, just update progress.
  _updateLoadingProgress(1, "Assets loaded.");
}

// p5.js setup function - runs once
function setup() {
  console.log("Starting setup...");
  try {
    // 1. Initialize Canvas
    _updateLoadingProgress(1, "Creating canvas...");
    // Calculate square size based on minimum window dimension
    let sketchSize = min(windowWidth, windowHeight);
    let mainCanvas = createCanvas(sketchSize, sketchSize); 
    // Optional: Add an ID to the canvas if needed for specific targeting
    // mainCanvas.id('p5Canvas'); 
    frameRate(30); // Target frame rate
    pixelDensity(constrain(window.devicePixelRatio || 1, 1, 2)); // Limit density for performance
    console.log(`Canvas created (1:1): ${width}x${height}`); // Use p5's global width/height
    
    // DISABLED LAYERED CANVAS SYSTEM FOR NOW
    console.log("Using standard single canvas rendering");

    // 2. Initialize Core Systems (State, Config, Error Handling, Utils are loaded first)
    _updateLoadingProgress(2, "Initializing core systems...");
    safeExecute(setState, "Initial State Setup"); // Initialize state manager
    safeExecute(initConfigParams, "Parameter Definition"); // Define fxhash params

    // 3. Initialize Interaction & UI Handlers
    _updateLoadingProgress(3, "Initializing UI...");
    safeExecute(initInputHandlers, "Input Handlers Setup"); // Setup controls help UI
    safeExecute(initInteractionFeedback, "Feedback System Setup");
    safeExecute(initInteractionMemory, "Interaction Memory Setup");
    safeExecute(initShowcase, "Background Showcase Setup");
    safeExecute(initDebugInterface, "Debug UI Setup"); // Setup debug panel toggle

    // 4. Initialize Performance Monitoring
    _updateLoadingProgress(4, "Initializing performance monitor...");
    safeExecute(initPerformanceMonitoring, "Performance Monitor Setup");

    // 5. Generate Traits (using fxrand)
    _updateLoadingProgress(5, "Generating unique traits...");
    let generatedState = safeExecute(generateTraits, "Trait Generation"); // Generates traits and sets state
    if (!generatedState) throw new Error("Trait generation failed.");

    // 6. Validate Traits
    _updateLoadingProgress(6, "Validating trait combinations...");
     if (typeof validateTraitCombination === 'function') {
        const validatedTraits = safeExecute(validateTraitCombination, "Trait Validation", generatedState);
        if (validatedTraits) {
            // Update state ONLY with validated traits, keeping core things like $fx intact
            const coreState = { $fx: generatedState.$fx, performanceSettings: generatedState.performanceSettings, _initialized: true };
            setState({ ...validatedTraits, ...coreState }); // Reset state with validated traits + core
            generatedState = getState(); // Get the final validated state
        } else {
            console.warn("Trait validation returned null, using originally generated traits.");
        }
    } else {
        console.warn("validateTraitCombination function not found, skipping validation.");
    }


    // 7. Define Mound Geometry (based on generated traits)
    _updateLoadingProgress(7, "Defining mound shape...");
    safeExecute(defineParabolaMound, "Mound Geometry Definition"); // Calculates vertices and face position based on state
    generatedState = getState(); // Update local reference after geometry is defined

    // 8. Initialize Animation Systems
    _updateLoadingProgress(8, "Initializing animations...");
    safeExecute(initMoundAnimation, "Mound Animation Setup");
    safeExecute(initEmoteSystem, "Emote System Setup"); // Sets initial mood based on personality
    safeExecute(initIdleAnimation, "Idle Animation Setup");
    
    // Create initial state entry for layer redraw flags if using layered canvas
    if (typeof CanvasLayers !== 'undefined') {
      updateState('layersNeedRedraw', {
        [CanvasLayers.BACKGROUND]: true,
        [CanvasLayers.MOUND_BASE]: true,
        [CanvasLayers.EFFECTS]: true,
        [CanvasLayers.FOREGROUND]: true
      });
    }

    // 9. Initialize Effects & Buffers
    _updateLoadingProgress(9, "Initializing effects...");
    safeExecute(applySeasonalEffects, "Seasonal Effects Setup"); // Determines effect based on date
    // No need to explicitly setup season particles here, applySeasonalEffects handles it
    safeExecute(initParticleSystem, "Interaction Particles Setup");
    safeExecute(initBufferManager, "Buffer Manager Setup"); // Setup buffer system
    // Pre-generate static background buffer
    safeExecute(generateBackgroundBuffer, "Background Buffer Generation");

    // 10. Final Setup (Features, Logging)
    _updateLoadingProgress(10, "Finalizing...");
    safeExecute(registerFeatures, "Feature Registration", generatedState); // Register features with fxhash
    safeExecute(logMoundDetails, "Logging Details"); // Log generated details

    // Attach resize handler
    window.addEventListener('resize', windowResized); // Use standard event listener

    // Generate the main mound texture buffer ONCE after setup is complete
    moundTextureBuffer = generateMoundTextureBuffer();
    if (!moundTextureBuffer) {
        logError("Setup", "Failed to create initial mound texture buffer.");
    }

    console.log("Setup complete.");
    _hideLoadingScreen(); // Hide loading screen

  } catch (error) {
    logError("Setup", error); // Use global error logger
    // Display error message on canvas? (Handled by draw loop error state)
     _updateLoadingProgress(TOTAL_LOADING_STEPS, "Error during setup. Please refresh.");
  }
}

// p5.js draw function - runs repeatedly
function draw() {
  try {
    // --- Performance Monitoring ---
    monitorPerformance(); // Update FPS and adjust settings if needed
    
    // Check if we should skip this frame entirely for performance
    if (typeof shouldRenderFrame === 'function' && !shouldRenderFrame()) {
      return; // Skip entire frame rendering
    }

    // --- Get State ---
    const state = getState();
    const { showcaseActive, showcaseIndex, showcaseTypes, backgroundType, palette, layersNeedRedraw } = state;

// --- Determine Background ---
const typeToDraw = showcaseActive ? showcaseTypes[showcaseIndex] : backgroundType;
const isStaticBg = ["dots", "stars", "noise", "grid", "stripes", "gradient", "hills", "forest_hills"].includes(typeToDraw);

// Improved background buffer management using proper buffer manager
if (isStaticBg && !showcaseActive) {
    // Static backgrounds should use the buffer manager system
    // The buffer key includes both type and palette name for proper caching
    const bufferKey = `background_${typeToDraw}_${palette.name}`;
    
    // Get or create buffer through the buffer manager
    // This uses a longer expiry time (0) since static backgrounds don't change
    const backgroundBuffer = getBuffer(bufferKey, (buffer) => {
        // Draw the background on the buffer
        if (typeof drawBackground === 'function') {
            drawBackground(typeToDraw, palette, buffer);
        } else {
            buffer.background(palette?.sky ? color(palette.sky) : 200);
        }
    }, 0); // 0 means never expire unless forced
    
    // Use the buffer if successfully created
    if (backgroundBuffer) {
        image(backgroundBuffer, 0, 0);
    } else {
        // Fallback direct drawing if buffer creation failed
        if (typeof drawBackground === 'function') {
            drawBackground(typeToDraw, palette);
        } else {
            background(palette?.sky ? color(palette.sky) : 200);
        }
    }
} else {
    // Dynamic backgrounds or showcase mode - draw directly
    if (typeof drawBackground === 'function') {
        drawBackground(typeToDraw, palette); // Draw directly onto main canvas
    } else {
        background(palette?.sky ? color(palette.sky) : 200); // Fallback clear
    }
    
    // Draw stormy sky animation overlay (clouds, lightning) if active
    if (typeToDraw === BackgroundTypes.STORMY_SKY && typeof drawStormySkyAnimation === 'function') {
        // Call the animation function, passing the main p5 instance (window) and state
        // The animation function expects the main p5 context as the 'target'
        drawStormySkyAnimation(window, state);
    }

    // Draw animated wave overlay if active
    if (typeToDraw === BackgroundTypes.WAVES && typeof drawWaveAnimation === 'function') {
        if (shouldPerformOperation("background")) {
            drawWaveAnimation(state);
        }
    }
}

    // --- Update & Draw Animations / Effects ---
    // Update mound vertex positions based on animation state
    if (typeof updateMoundVertices === 'function') updateMoundVertices();
    // Update animation phase counters
    if (typeof updateAnimationPhases === 'function') updateAnimationPhases();
     // Update emote frame counters and blinking
    if (typeof updateEmoteAnimation === 'function') updateEmoteAnimation();
    // Update which idle action is active
    if (typeof updateIdleState === 'function') updateIdleState();
    // Update misc timers (e.g., breathing phase)
    if (typeof updateIdleTimers === 'function') updateIdleTimers();

    // Wave animation is now handled in the background section

    // --- Draw Mound & Face (Skip if in showcase?) ---
    let showMound = !showcaseActive; // Simple toggle for now
    if (showMound) {
        // Draw Mound Base + Texture + Pattern
        // --- OPTIMIZATION: Removed direct drawMoundBase() call --- 
        // if (typeof drawMoundBase === 'function') drawMoundBase(); 

        // Draw Effects (Glow, Shimmer, Cursed) - Can use buffers or draw directly
        const useBuffersForEffects = state.performanceSettings?.level !== 'low'; // Example: Don't buffer on low perf

        // --- OPTIMIZATION: Draw the pre-generated texture buffer first --- 
        if (moundTextureBuffer) {
            // --- Cascade Revert: Restore buffer drawing --- 
            image(moundTextureBuffer, 0, 0);

            // --- Cascade Revert: Removed direct drawing using live vertices ---
            /*
            const state = getState(); // Get current state
            if (state && state.moundVertices && state.moundVertices.length > 0) {
                push(); // Isolate drawing state

                // 1. Apply base color/texture (Mimic buffer step 1)
                // Assuming applyPaletteTexture sets fill/stroke appropriately
                if (typeof applyPaletteTexture === 'function') {
                    // Cascade Fix: Pass the global p5 context (window) as the target
                    applyPaletteTexture(window); 
                } else {
                    // Fallback: Simple fill based on palette if function missing
                    if (state.palette && state.palette.mound) {
                        fill(state.palette.mound);
                        noStroke(); 
                    }
                }

                // 2. Draw the animated mound shape (Using live vertices)
                beginShape();
                for (const v of state.moundVertices) {
                    vertex(v.x, v.y);
                }
                endShape(CLOSE);

                // 3. Draw the pattern on top (Mimic buffer step 3)
                // Assuming drawMoundPattern draws over the current shape
                if (state.hasPattern && typeof drawMoundPattern === 'function') {
                    drawMoundPattern(); 
                }

                pop(); // Restore drawing state
            } else {
                console.warn("Mound vertices not available for direct drawing.");
            }
            */
            // --- End Cascade Revert ---
        }
        
        if (useBuffersForEffects) {
            // --- OPTIMIZATION: Removed texture buffer generation call from here --- 
            // const textureBuffer = generateMoundTextureBuffer(); // Regenerates if needed
            // if (textureBuffer) image(textureBuffer, 0, 0);

            if (state.hasGlow) {
                 const glowBuffer = generateGlowBuffer(); // Regenerates frequently
                 if (glowBuffer) {
                     blendMode(ADD); // Use ADD or SCREEN for glow
                     image(glowBuffer, 0, 0);
                     blendMode(BLEND);
                 }
            }
            if (state.isShiny) { // isShiny controls shimmer
                 const shimmerBuffer = generateShimmerBuffer(); // Regenerates frequently
                 if (shimmerBuffer) image(shimmerBuffer, 0, 0);
            }
             if (state.isCursed && typeof drawCursedEffects === 'function') {
                // Cursed effects might be better drawn directly unless complex
                if (shouldPerformOperation("effect")) drawCursedEffects();
             }

        } else {
             // Draw effects directly if not using buffers or on low performance
             if (shouldPerformOperation("effect")) {
                 if (state.hasGlow && typeof drawSimplifiedMoundGlow === 'function') drawSimplifiedMoundGlow();
                 if (state.isShiny && typeof drawShimmerEffect === 'function') drawShimmerEffect();
                 if (state.isCursed && typeof drawCursedEffects === 'function') drawCursedEffects();
             }
        }

        // Draw Face & Accessories (Applies idle transform internally)
        if (typeof drawFaceAndAccessories === 'function') drawFaceAndAccessories(state);
    }

    // --- Draw Foreground Effects ---
    // Draw Seasonal Effects (Particles)
    if (typeof updateAndDrawSeasonEffects === 'function') {
       if (shouldPerformOperation("effect")) updateAndDrawSeasonEffects();
    }
    // Draw Interaction Effects (Particles)
    if (typeof updateAndDrawInteractionParticles === 'function') {
       if (shouldPerformOperation("effect")) updateAndDrawInteractionParticles();
    }

    // --- Draw UI ---
    // Draw Showcase UI if active
    if (showcaseActive && typeof drawShowcaseUI === 'function') {
      drawShowcaseUI();
    }
    // Draw Messages (from memory system)
    else if (state.message && state.messageTimer > 0) {
      if(typeof drawMessage === 'function') drawMessage(state.message);
      updateState('messageTimer', state.messageTimer - 1);
    }

    // --- Debug Overlay ---
    if (state.debugMode && !showcaseActive) { // Don't show general debug in showcase
        // Add general debug info if needed (FPS, state values)
        fill(0); textSize(12); textAlign(LEFT, TOP);
        text(`FPS: ${frameRate().toFixed(1)}`, 10, 10);
    }

  } catch (error) {
    logError("Draw Loop", error);
    // Attempt to recover by switching to a simplified error state draw function
    window.draw = simplifiedErrorDraw;
  }
}


/**
 * Helper function to consolidate drawing the face and accessories.
 * Handles applying transformations.
 * @param {object} state - The current application state.
 * @param {p5.Graphics | p5.Renderer} [target=window] - The target to draw on.
 */

function drawFaceAndAccessories(state, target = window) { // Keep target param here
    if (!state || typeof drawFace !== 'function' || typeof applyIdleTransform !== 'function') return;

    target.push(); // Isolate transformations

    // --- Calculate Scale Factor (needed for both face and accessories) ---
    const referenceWidth = 600;
    const currentWidth = target.width;
    const faceScaleFactor = Math.max(0.5, currentWidth / referenceWidth);

    target.translate(state.faceX || target.width / 2, state.faceY || target.height / 2);

    // Apply idle transform only if in the base/initial mood
    if (state.currentEmote === state.initialMood) {
        applyIdleTransform(); // applyIdleTransform might also need scaling adjustments internally
    }

    // Draw the face expression - PASS target and scale factor
    drawFace(state.currentEmote, state.emoteFrame, target, faceScaleFactor); // Pass scale factor

    // Draw accessory if present - PASS target and scale factor
    if (state.hasAccessory && typeof drawAccessory === 'function') {
        drawAccessory(target, faceScaleFactor); // Pass scale factor
    }

    target.pop(); // Restore original drawing context
}


/**
 * Helper function to draw messages on screen.
 * @param {string} message - The text message to display.
 */
function drawMessage(message) {
  push();
  rectMode(CENTER);
  textAlign(CENTER, CENTER);
  textSize(16);
  const padding = 15;
  const textW = textWidth(message);

  // Background box
  fill(0, 0, 0, 180);
  noStroke();
  rect(width / 2, height * 0.1, textW + padding * 2, 40, 8); // Position near top

  // Text
  fill(255);
  text(message, width / 2, height * 0.1);
  pop();
}


/**
 * Simplified draw function used as a fallback if the main draw loop encounters a critical error.
 */
function simplifiedErrorDraw() {
  try {
    background(50); // Dark gray background
    fill(255, 100, 100); // Reddish text
    textSize(18);
    textAlign(CENTER, CENTER);
    text("A critical error occurred in the draw loop.", width / 2, height / 2 - 20);
    text("Please check the console and refresh the page.", width / 2, height / 2 + 20);
  } catch (finalError) {
    // If even this fails, stop the loop entirely
    console.error("Error in simplifiedErrorDraw:", finalError);
    noLoop();
  }
}


/**
 * p5.js function called when the window is resized.
 */
function windowResized() {
    console.log("Window resized");
    // Resize canvas to fill the new window dimensions, maintaining 1:1
    let sketchSize = min(windowWidth, windowHeight);
    resizeCanvas(sketchSize, sketchSize);
    console.log(`Canvas resized (1:1) to: ${width}x${height}`);

    // Re-calculate things that depend on screen size
    // Re-define mound geometry based on the new size
    // safeExecute(defineParabolaMound, "Mound Geometry Update on Resize"); // This might be needed if mound scales with canvas
    
    // Re-generate static background buffer if it depends on canvas size
    // safeExecute(generateBackgroundBuffer, "Background Buffer Regeneration on Resize");

    // Regenerate mound texture if needed (less likely unless aspect ratio changes dramatically)
    // moundTextureBuffer = generateMoundTextureBuffer();

    // Trigger redraw for all layers if using layered canvas
    if (typeof CanvasLayers !== 'undefined' && typeof updateState === 'function') {
        updateState('layersNeedRedraw', {
            [CanvasLayers.BACKGROUND]: true,
            [CanvasLayers.MOUND_BASE]: true,
            [CanvasLayers.EFFECTS]: true,
            [CanvasLayers.FOREGROUND]: true
        });
    }

    // Optional: Redraw immediately to prevent flickering (might be handled by p5 loop)
    // draw(); 
}

// --- Added mouseMoved function for button fade-in ---
function mouseMoved() {
    if (buttonsInitiallyHidden) {
        const debugButton = document.getElementById('debug-button');
        const controlsButton = document.getElementById('show-controls-button');
        
        if (debugButton && controlsButton) {
            console.log("Mouse interaction detected, showing buttons.");
            debugButton.classList.add('button-visible');
            controlsButton.classList.add('button-visible');
            buttonsInitiallyHidden = false; // Only do this once
        }
    }
    
    // Prevent default browser behavior if necessary (usually not needed for mouseMoved)
    // return false;
}
// --- End Added --- 

// --- Global Exports (p5.js hooks) ---
// p5.js automatically calls functions named setup, draw, preload, keyPressed, windowResized if they exist globally.
// We ensure they are assigned correctly.
window.preload = preload;
window.setup = setup;
window.draw = draw;
// window.keyPressed is assigned in inputs.js
// window.windowResized = windowResized; // Already assigned listener

// --- END OF FILE src/index.js ---
