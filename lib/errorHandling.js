
// --- START OF FILE lib/errorHandling.js ---

/**
 * Error handling utilities for the Mound Mascot project.
 * Provides centralized error logging and safe execution wrappers.
 */

/**
 * Logs an error with consistent formatting to the console.
 * Optionally attempts to update the loading UI if present.
 * @param {string} context - A string describing the context where the error occurred (e.g., 'Setup', 'Draw cycle').
 * @param {Error|any} error - The error object or message.
 */
function logError(context, error) {
  const errorMessage = error?.message || (typeof error === 'string' ? error : 'Unknown error');
  console.error(
    `%c[${context} Error]:%c ${errorMessage}`,
    'font-weight: bold; color: #D32F2F;', // Material Design error color
    'font-weight: normal; color: inherit;'
  );

  // Log stack trace if available
  if (error?.stack) {
    console.error(error.stack);
  }

  // Attempt to update UI if loading indicator is visible
  try {
    const loadingContainer = document.getElementById('loading-container');
    if (loadingContainer && loadingContainer.style.display !== 'none') {
      const loadingText = document.querySelector('.loading-text');
      if (loadingText) {
        loadingText.textContent = `Error during ${context}: ${errorMessage}. Please refresh.`;
        loadingText.style.color = "#D32F2F"; // Error color
      }
      // Optionally stop loading animation or progress bar updates here
    }
  } catch (uiError) {
    // Ignore errors happening during error reporting UI update
    console.error("Error updating loading UI during error reporting:", uiError);
  }
}

/**
 * Executes a function safely within a try-catch block.
 * Logs an error if the function throws one.
 * @param {Function} fn - The function to execute.
 * @param {string} [context="Function"] - The context description for error logging.
 * @param {...any} args - Arguments to pass to the function.
 * @returns {any | null} The return value of the function, or null if an error occurred.
 */
function safeExecute(fn, context = "Function", ...args) {
  if (typeof fn !== 'function') {
    logError(context, "Provided target for safeExecute is not a function.");
    return null;
  }
  try {
    return fn(...args);
  } catch (error) {
    logError(context, error);
    return null; // Indicate failure
  }
}

/**
 * Safely retrieves a configuration parameter using getConfigParam.
 * Returns a default value if retrieval fails or the parameter is undefined.
 * Assumes getConfigParam is available globally.
 * @param {string} id - The ID of the parameter to retrieve.
 * @param {any} defaultValue - The value to return if retrieval fails or param is undefined.
 * @returns {any} The parameter value or the default value.
 */
function safeGetParam(id, defaultValue) {
  if (typeof getConfigParam !== 'function') {
    // Log this error only once to avoid spamming
    if (!window._getConfigParamWarned) {
       logError("safeGetParam", "getConfigParam function is not available globally.");
       window._getConfigParamWarned = true;
    }
    return defaultValue;
  }
  try {
    // Directly call getConfigParam, which should handle undefined itself
    return getConfigParam(id, defaultValue);
  } catch (error) {
    // Catch errors during the getConfigParam call itself
    logError(`Parameter retrieval (${id})`, error);
    return defaultValue;
  }
}

// --- Global Error Handler ---

// Store the original handler if it exists
const _originalWindowOnError = window.onerror;

/**
 * Global error handler to catch unhandled exceptions.
 */
window.onerror = function(message, source, lineno, colno, error) {
  console.error("Unhandled global error caught by window.onerror.");
  logError(`Unhandled Exception at ${source}:${lineno}:${colno}`, error || message);

  // Optionally call the original handler if it existed
  if (typeof _originalWindowOnError === 'function') {
    return _originalWindowOnError.apply(this, arguments);
  }

  // Return false to allow the default browser error handling to continue
  return false;
};

// --- Global Promise Rejection Handler ---

// Store the original handler if it exists
const _originalWindowOnUnhandledRejection = window.onunhandledrejection;

/**
 * Global handler for unhandled promise rejections.
 */
window.onunhandledrejection = function(event) {
  console.error("Unhandled promise rejection caught by window.onunhandledrejection.");
  logError("Unhandled Promise Rejection", event.reason);

  // Optionally call the original handler if it existed
  if (typeof _originalWindowOnUnhandledRejection === 'function') {
     return _originalWindowOnUnhandledRejection.apply(this, arguments);
  }
};


// --- Exports ---
// Ensure functions are available globally
window.logError = logError;
window.safeExecute = safeExecute;
window.safeGetParam = safeGetParam;

// Note: safeStateUpdate is intentionally omitted as updateState itself should be robust.
// If backward compatibility is strictly needed, uncomment the line below:
// window.safeStateUpdate = (key, value) => safeExecute(updateState, `State update (${key})`, key, value);


// --- END OF FILE lib/errorHandling.js ---