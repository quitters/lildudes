// --- START OF FILE src/generators/mound.js ---

/**
 * Mound geometry generation for the Mound Mascot project.
 * Calculates mound vertices and face position based on state parameters.
 */

/**
 * Adds controlled random imperfections to mound vertices for a more organic look.
 * Avoids significantly altering key vertices like corners and the base.
 * @param {Array<object>} vertices - Array of vertex objects {x, y, origX, origY, isKeyVertex}.
 * @param {object} state - The current application state containing personality and shape.
 * @returns {Array<object>} A new array of vertices with imperfections applied.
 */
function addControlledImperfections(vertices, state) {
  // Determine imperfection amount based on personality and shape
  let perturbAmount = 2.0; // Default subtle amount
  const personality = state?.personalityType || "normal";
  const shape = state?.moundShape || "normal";

  if (personality === "grumpy") perturbAmount = 3.0;
  else if (personality === "playful") perturbAmount = 2.5;
  else if (shape === "asymmetric") perturbAmount = 3.5;
  else if (personality === "shy") perturbAmount = 1.5; // Smoother for shy

  const canvasWidth = typeof width !== 'undefined' ? width : 600; // Use global p5 width or default

  const modifiedVertices = vertices.map(vert => {
    // Clone vertex to avoid modifying the original array directly
    const newVert = { ...vert };

    // Skip key vertices (base corners, etc.) to maintain overall structure
    if (newVert.isKeyVertex) {
      return newVert;
    }

    // Calculate distance from center normalized (0 at center, 1 at edge)
    const distanceFromCenter = Math.abs(newVert.origX - canvasWidth / 2) / (canvasWidth / 2);
    // Reduce perturbation near the edges and base for stability
    const scaledPerturbAmount = perturbAmount * (1 - distanceFromCenter * 0.7) * Math.max(0, 1 - (newVert.origY / (canvasWidth*1.5))); // Less perturb near bottom

    // Apply imperfections - More horizontal than vertical generally looks better
    const perturbX = randomInRange(-scaledPerturbAmount, scaledPerturbAmount);
    const perturbY = randomInRange(-scaledPerturbAmount * 0.6, scaledPerturbAmount * 0.6); // Less vertical movement

    newVert.x = newVert.origX + perturbX;
    newVert.y = newVert.origY + perturbY;

    // Note: We don't update origX/origY here after adding imperfections.
    // The 'orig' values should represent the pure geometric shape before imperfections.
    // Animation should ideally deform from the 'orig' position plus imperfections.
    // However, the current animation logic seems to use the modified 'x'/'y' as 'orig'.
    // For consistency with that, we might need to update origX/Y here, but it's less ideal.
    // Let's stick to NOT updating origX/Y for now - animation might need adjustment later.

    return newVert;
  });

  return modifiedVertices;
}

/**
 * Defines the parabolic mound shape vertices and calculates face position.
 * Uses parameters from the current state (set previously by traits.js).
 * Updates the state with the calculated 'moundVertices', 'faceX', and 'faceY'.
 * Requires p5.js context for width, height, max, abs, sin, constrain.
 */
function defineParabolaMound() {
  const state = getState(); // Assumes getState is available globally

  // Get necessary parameters from state
  const {
    apexY = 100,
    baseExtra = 80,
    randomAsymmetry = 0, // Used for asymmetric shape distortion calculation
    moundWidthFactor = 1.0,
    moundShape = "normal",
    personalityType = "normal"
  } = state;

  // Ensure p5 context is available
  if (typeof width === 'undefined' || typeof height === 'undefined' || typeof max !== 'function' ) {
      console.error("p5.js context (width, height, max) not available for defineParabolaMound.");
      // Set dummy values to prevent further errors
      updateState('moundVertices', [{x:0,y:0,origX:0,origY:0,isKeyVertex:true}]);
      updateState('faceX', 300);
      updateState('faceY', 300);
      return;
  }

  const canvasWidth = width;
  const canvasHeight = height;
  const centerX = canvasWidth / 2;

  // Calculate parabola parameters a, b, c based on apex and base width
  const effectiveBaseWidth = (canvasWidth + baseExtra) * moundWidthFactor; // Apply width factor
  const h = apexY; // Vertex y
  const k = canvasWidth / 2; // Vertex x (center)

  // Points on parabola: (k, h) = vertex, (k - effectiveBaseWidth/2, canvasHeight) = left base, (k + effectiveBaseWidth/2, canvasHeight) = right base
  // Standard form: y = a(x - k)^2 + h
  // Use one base point to solve for 'a': canvasHeight = a( (k - effectiveBaseWidth/2) - k )^2 + h
  // canvasHeight - h = a (-effectiveBaseWidth/2)^2
  // canvasHeight - h = a * (effectiveBaseWidth^2 / 4)
  // a = 4 * (canvasHeight - h) / (effectiveBaseWidth^2)
  const parabolaA = 4 * (canvasHeight - h) / (effectiveBaseWidth * effectiveBaseWidth);
  const parabolaB = -2 * parabolaA * k; // From expanding (x-k)^2 = x^2 - 2kx + k^2 -> y = ax^2 - 2akx + ak^2 + h -> b = -2ak
  const parabolaC = parabolaA * k * k + h; // c = ak^2 + h

  // --- Generate Vertices ---
  const moundVertices = [];
  const step = clamp(canvasWidth / 150, 2, 10); // Adaptive step size based on width

  for (let x = 0; x <= canvasWidth; x += step) {
    // Calculate horizontal distance from center, adjusted by width factor
    let dxLocal = (x - centerX) / moundWidthFactor;
    // Calculate ideal Y position on the parabola
    let idealY = parabolaA * (x * x) + parabolaB * x + parabolaC;

    // Add initial random asymmetry offset (mostly relevant for 'asymmetric' shape)
    let offsetX = randomInRange(-randomAsymmetry, randomAsymmetry);
    let offsetY = randomInRange(-randomAsymmetry, randomAsymmetry);

    // Add specific distortion for the 'asymmetric' shape type
    if (moundShape === "asymmetric") {
      // Sine wave distortion for wobbliness
      offsetY += 15 * sin(x * 0.03 + randomInRange(-0.5, 0.5)); // Increased amplitude
      // More distortion on one side (determined by initial randomAsymmetry sign if needed)
      // Example: if (x < centerX) offsetY += randomInRange(-8, 8);
    }

    const px = x + offsetX;
    const py = idealY + offsetY;

    // Mark key vertices (used by addControlledImperfections to preserve shape)
    const isEdge = (x === 0 || Math.abs(x-canvasWidth) < step);
    const isNearCenter = Math.abs(x - centerX) < canvasWidth * 0.05;
    const isKeyVertex = isEdge || isNearCenter;

    moundVertices.push({
      x: px,         // Current position (will be modified by imperfections)
      y: py,
      origX: px,     // Original geometric position (before imperfections)
      origY: py,
      isKeyVertex: isKeyVertex
    });
  }
  // Ensure the last point is exactly at x = width
   if (Math.abs(moundVertices[moundVertices.length - 1].origX - canvasWidth) > 1e-3) {
       let dxLocal = (canvasWidth - centerX) / moundWidthFactor;
       let idealY = parabolaA * (canvasWidth * canvasWidth) + parabolaB * canvasWidth + parabolaC;
       moundVertices.push({ x: canvasWidth, y: idealY, origX: canvasWidth, origY: idealY, isKeyVertex: true });
   }


  // --- Add Base Vertices ---
  // Add bottom corners extending well below the canvas to ensure full coverage
  const bottomY = canvasHeight + baseExtra + 50;
  moundVertices.push({ x: canvasWidth + 50, y: bottomY, origX: canvasWidth + 50, origY: bottomY, isKeyVertex: true }); // Extend slightly beyond width
  moundVertices.push({ x: -50, y: bottomY, origX: -50, origY: bottomY, isKeyVertex: true }); // Extend slightly beyond 0

  // --- Add Imperfections ---
  // Apply organic imperfections AFTER the main shape is defined
  const verticesWithImperfections = addControlledImperfections(moundVertices, state);

  // --- Close Shape ---
  // Add the first vertex again to close the path, using its potentially modified position
  if (verticesWithImperfections.length > 0) {
      verticesWithImperfections.push({ ...verticesWithImperfections[0], isKeyVertex: true });
  }

  // --- Find Actual Apex Y --- Must be done *after* imperfections
  let actualApexY = canvasHeight; // Start high
  for (const v of verticesWithImperfections) {
    // Ignore the artificially low base vertices
    if (v.y < canvasHeight + baseExtra) {
        actualApexY = Math.min(actualApexY, v.y);
    }
  }
  // Removed: Don't overwrite the input apexY state value
  // updateState('apexY', actualApexY); 
  // console.log(`[Mound Def] Actual calculated apexY found: ${actualApexY.toFixed(2)}`); // Optional Debug
  // --- End Find Actual Apex Y ---

  // --- Calculate Face Position --- 
  let faceX, faceY;
  // Position the face relative to the *target* apexY read from the state at the function start
  const verticalCenter = apexY + (canvasHeight - apexY) * 0.40; // Lowered: Reference point ~40% down from TARGET apex

  // Base position varies by shape
  if (moundShape === "tall") {
    faceX = centerX + randomInRange(-canvasWidth * 0.08, canvasWidth * 0.08); // Less horizontal variation
    faceY = verticalCenter - canvasHeight * 0.03 + randomInRange(-10, 10); // Higher position
  } else if (moundShape === "wide") {
    faceX = centerX + randomInRange(-canvasWidth * 0.15, canvasWidth * 0.15); // More horizontal variation
    faceY = verticalCenter + canvasHeight * 0.04 + randomInRange(-15, 5); // Lower position but not too low
  } else if (moundShape === "asymmetric") {
    const asymmetryBias = (verticesWithImperfections[Math.floor(verticesWithImperfections.length/4)].x - centerX) * 0.3; // Bias based on shape lean
    faceX = centerX + asymmetryBias + randomInRange(-canvasWidth * 0.1, canvasWidth * 0.1);
    faceY = verticalCenter + randomInRange(-15, 15); // Less vertical variation
  } else if (moundShape === "skinnyTall") {
    faceX = canvasWidth / 2;
    faceY = verticalCenter * 0.98; // Slightly higher than normal for skinny
  } else if (moundShape === "shortWide" || moundShape === "shortSkinny" || moundShape === "veryShortWide" || moundShape === "tallVeryThin") {
    faceX = canvasWidth / 2;
    faceY = verticalCenter;
  } else {
    faceX = canvasWidth / 2;
    faceY = verticalCenter;
  }

  // Further adjust face position based on personality
  if (personalityType === "shy") {
    faceY -= 10; // Slightly higher
    faceX += randomInRange(-15, 15); // Slight side lean
  } else if (personalityType === "playful") {
    faceY -= 15; // Higher
  } else if (personalityType === "grumpy") {
    faceY += 15; // Lower
  } else if (personalityType === "sleepy") {
    faceY += 10; // Slightly lower
  }

  // Constrain face position to stay reasonably within the mound bounds
  faceX = clamp(faceX, canvasWidth * 0.2, canvasWidth * 0.8);
  faceY = clamp(faceY, apexY + 50, canvasHeight * 0.75); // Ensure it's below apex and not too low


  // --- Update State ---
  updateStateProperties({
      moundVertices: verticesWithImperfections,
      faceX: faceX,
      faceY: faceY
  });

  console.log(`Mound defined. Shape: ${moundShape}, Vertices: ${verticesWithImperfections.length}, Face Pos: (${faceX.toFixed(1)}, ${faceY.toFixed(1)})`);
}

// --- Exports ---
// Define globally for now, though internal usage is primary
window.addControlledImperfections = addControlledImperfections;
window.defineParabolaMound = defineParabolaMound;

// --- END OF FILE src/generators/mound.js ---