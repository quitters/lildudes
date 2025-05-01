// --- START OF FILE src/core/layeredCanvas.js ---

/**
 * Layered Canvas System for the Mound Mascot project.
 * Manages multiple stacked canvases for improved performance by separating
 * static and dynamic elements onto different layers.
 */

// --- Layer Constants ---
const CanvasLayers = {
  BACKGROUND: 'background-layer', // Static backgrounds
  MOUND_BASE: 'mound-base-layer',  // Static mound base and texture
  EFFECTS: 'effects-layer',       // Dynamic effects (glow, shimmer)
  FOREGROUND: 'foreground-layer'  // Dynamic elements (face, accessories, particles)
};

// --- Private Module Variables ---
let _layerCanvases = {};
let _p5Instances = {};
let _canvasContainer = null;
let _mainP5Instance = null;
let _resolution = 1.0; // Resolution scaling factor (1.0 = full resolution)

// --- Initialization ---

/**
 * Creates the layered canvas structure.
 * @param {p5} p5Instance - The main p5 instance for reference.
 * @param {number} width - Canvas width.
 * @param {number} height - Canvas height.
 */
function initLayeredCanvas(p5Instance, width, height) {
  console.log("Initializing layered canvas with p5 instance:", p5Instance);
  
  // Use global p5 instance if available (window object has p5 methods)
  if (!p5Instance || typeof p5Instance.createGraphics !== 'function') {
    console.warn("No valid p5 instance provided, attempting to use window");
    // Just checking if window has the necessary p5 methods
    if (typeof window.createGraphics === 'function') {
      console.log("Using window as p5 instance");
      _mainP5Instance = window;
    } else {
      console.error("Cannot find valid p5 instance with createGraphics method");
      return;
    }
  } else {
    _mainP5Instance = p5Instance;
  }
  
  // Get the parent of the original p5 canvas
  let originalCanvas;
  if (p5Instance && p5Instance.canvas) {
    originalCanvas = p5Instance.canvas;
  } else if (typeof window.canvas !== 'undefined') {
    originalCanvas = window.canvas; // If p5 is using global mode
  } else {
    // Look for a canvas element in the body as a fallback
    const canvasElements = document.getElementsByTagName('canvas');
    if (canvasElements.length > 0) {
      originalCanvas = canvasElements[0];
      console.log("Using first canvas element found");
    }
  }
  
  let canvasParent = originalCanvas ? originalCanvas.parentElement : document.body;
  
  // Create container div for all canvases
  _canvasContainer = document.createElement('div');
  _canvasContainer.id = 'canvas-container';
  _canvasContainer.style.position = 'relative';
  _canvasContainer.style.width = `${width}px`;
  _canvasContainer.style.height = `${height}px`;
  _canvasContainer.style.margin = '0 auto'; // Center the container
  
  // Move the container to where p5 would put its canvas
  if (canvasParent) {
    canvasParent.appendChild(_canvasContainer);
  } else {
    document.body.appendChild(_canvasContainer);
  }
  
  // Hide original p5 canvas
  if (originalCanvas) {
    originalCanvas.style.display = 'none';
  }
  
  // Create each layer
  for (const layerName of Object.values(CanvasLayers)) {
    createLayer(layerName, width, height);
  }
  
  console.log("Layered canvas system initialized with resolution scale:", _resolution);
  
  // Apply initial resolution scale
  setResolutionScale(_resolution);
}

/**
 * Creates a single canvas layer.
 * @param {string} layerName - The name/id for the layer.
 * @param {number} width - Canvas width.
 * @param {number} height - Canvas height.
 */
function createLayer(layerName, width, height) {
  // Create a canvas element
  const canvas = document.createElement('canvas');
  canvas.id = layerName;
  canvas.width = width * _resolution;
  canvas.height = height * _resolution;
  canvas.style.position = 'absolute';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  
  // Stack the layers with z-index based on their order
  const layerIndex = Object.values(CanvasLayers).indexOf(layerName);
  canvas.style.zIndex = layerIndex + 1; // Start z-index at 1
  
  // Add to container
  _canvasContainer.appendChild(canvas);
  
  // Store canvas reference
  _layerCanvases[layerName] = canvas;
  
  // Create a p5.Graphics instance for this layer
  if (_mainP5Instance && typeof _mainP5Instance.createGraphics === 'function') {
    try {
      const p5Graphics = _mainP5Instance.createGraphics(width * _resolution, height * _resolution);
      if (p5Graphics) {
        _p5Instances[layerName] = p5Graphics;
        console.log(`Created p5.Graphics for layer: ${layerName}, size: ${width * _resolution}x${height * _resolution}`);
      } else {
        console.error(`Failed to create p5.Graphics for layer ${layerName}: createGraphics returned null`);
      }
    } catch (err) {
      console.error(`Error creating p5.Graphics for layer ${layerName}:`, err);
    }
  } else {
    console.error(`Cannot create p5.Graphics for layer ${layerName}: Invalid p5 instance or missing createGraphics method`);
  }
}

// --- Layer Access Functions ---

/**
 * Gets the p5.Graphics instance for a specific layer.
 * @param {string} layerName - The name of the layer.
 * @returns {p5.Graphics} The p5.Graphics object for the layer.
 */
function getLayer(layerName) {
  return _p5Instances[layerName];
}

/**
 * Gets the actual canvas DOM element for a specific layer.
 * @param {string} layerName - The name of the layer.
 * @returns {HTMLCanvasElement} The canvas element for the layer.
 */
function getLayerCanvas(layerName) {
  return _layerCanvases[layerName];
}

/**
 * Clears a specific layer.
 * @param {string} layerName - The name of the layer to clear.
 */
function clearLayer(layerName) {
  if (_p5Instances[layerName]) {
    _p5Instances[layerName].clear();
  }
}

/**
 * Updates a canvas from its p5.Graphics instance.
 * @param {string} layerName - The name of the layer to update.
 */
function updateLayerCanvas(layerName) {
  if (_p5Instances[layerName] && _layerCanvases[layerName]) {
    const canvas = _layerCanvases[layerName];
    const context = canvas.getContext('2d');
    const graphics = _p5Instances[layerName];
    
    // Clear first
    context.clearRect(0, 0, canvas.width, canvas.height);
    
    // Ensure the graphics element exists before drawing
    if (graphics.elt) {
      try {
        // Draw the graphics content to the canvas
        context.drawImage(graphics.elt, 0, 0);
      } catch (err) {
        console.error(`Error updating layer ${layerName}:`, err);
      }
    } else {
      console.warn(`Graphics element for layer ${layerName} not available`);
    }
  } else {
    console.warn(`Cannot update layer ${layerName}: graphics or canvas missing`);
  }
}

// --- Resolution Scaling ---

/**
 * Sets the resolution scaling factor for all canvases.
 * @param {number} scale - The scaling factor (0.25 to 1.0).
 */
function setResolutionScale(scale) {
  // Constrain scale to reasonable values
  scale = Math.max(0.25, Math.min(1.0, scale));
  
  // Skip if no change
  if (scale === _resolution) return;
  
  const oldResolution = _resolution;
  _resolution = scale;
  
  // If canvases already exist, resize them
  if (_canvasContainer) {
    const containerWidth = parseInt(_canvasContainer.style.width);
    const containerHeight = parseInt(_canvasContainer.style.height);
    
    for (const layerName of Object.values(CanvasLayers)) {
      if (_layerCanvases[layerName]) {
        const canvas = _layerCanvases[layerName];
        
        // Update the actual resolution
        canvas.width = containerWidth * scale;
        canvas.height = containerHeight * scale;
        
        // Keep displayed size the same
        canvas.style.width = `${containerWidth}px`;
        canvas.style.height = `${containerHeight}px`;
        
        // Update p5.Graphics instance size
        if (_p5Instances[layerName]) {
          // Need to recreate the p5.Graphics with new size
          _p5Instances[layerName].remove();
          _p5Instances[layerName] = _mainP5Instance.createGraphics(
            containerWidth * scale, 
            containerHeight * scale
          );
        }
      }
    }
    
    console.log(`Resolution scale changed: ${oldResolution.toFixed(2)} -> ${_resolution.toFixed(2)}`);
    
    // Force redraw of all layers
    resetAllLayers();
  }
}

/**
 * Gets the current resolution scaling factor.
 * @returns {number} The current resolution scale.
 */
function getResolutionScale() {
  return _resolution;
}

// --- Resize Handling ---

/**
 * Resizes all layers.
 * @param {number} newWidth - New width.
 * @param {number} newHeight - New height.
 */
function resizeAllLayers(newWidth, newHeight) {
  if (!_canvasContainer) return;
  
  _canvasContainer.style.width = `${newWidth}px`;
  _canvasContainer.style.height = `${newHeight}px`;
  
  for (const layerName of Object.values(CanvasLayers)) {
    if (_layerCanvases[layerName]) {
      const canvas = _layerCanvases[layerName];
      
      // Set displayed size
      canvas.style.width = `${newWidth}px`;
      canvas.style.height = `${newHeight}px`;
      
      // Set actual resolution-scaled size
      canvas.width = newWidth * _resolution;
      canvas.height = newHeight * _resolution;
      
      // Update p5.Graphics instance
      if (_p5Instances[layerName]) {
        _p5Instances[layerName].remove();
        _p5Instances[layerName] = _mainP5Instance.createGraphics(
          newWidth * _resolution, 
          newHeight * _resolution
        );
      }
    }
  }
  
  console.log(`Resized layered canvases to: ${newWidth}x${newHeight} with scale ${_resolution}`);
}

/**
 * Resets all layers, clearing and forcing a redraw.
 */
function resetAllLayers() {
  if (!_canvasContainer) return;
  
  for (const layerName of Object.values(CanvasLayers)) {
    clearLayer(layerName);
  }
  
  // Flag layers as needing redraw in state
  if (typeof updateState === 'function') {
    updateState('layersNeedRedraw', {
      [CanvasLayers.BACKGROUND]: true,
      [CanvasLayers.MOUND_BASE]: true,
      [CanvasLayers.EFFECTS]: true,
      [CanvasLayers.FOREGROUND]: true
    });
  }
}

// --- Exports ---
window.CanvasLayers = CanvasLayers;
window.initLayeredCanvas = initLayeredCanvas;
window.getLayer = getLayer;
window.getLayerCanvas = getLayerCanvas;
window.clearLayer = clearLayer;
window.updateLayerCanvas = updateLayerCanvas;
window.setResolutionScale = setResolutionScale;
window.getResolutionScale = getResolutionScale;
window.resizeAllLayers = resizeAllLayers;
window.resetAllLayers = resetAllLayers;

// --- END OF FILE src/core/layeredCanvas.js ---