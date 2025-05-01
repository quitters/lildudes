# Guide: Adding New Generative Variables (e.g., Backgrounds, Shapes)

This guide outlines the key steps and considerations when adding new options to generative variables within the Mound Mascot project, based on lessons learned debugging background types. Following these steps should help prevent common errors.

## 1. Trait Generation (`src/generators/traits.js`)

*   **Define the Option:** Add the new variable option's name (e.g., `"new_background_type"`) to any relevant lists or maps (like `backgroundList`, `backgroundMap`).
*   **Weighting Logic:** If the variable uses weighted selection (e.g., `selectBackgroundByTypeWeights`), ensure the new option is included in the `weights` object with an appropriate probability.
*   **Consistency is Key:**
    *   **Exact Naming:** Use the *exact* same string (case-sensitive) for the variable option in the trait generator as you will use in the rendering logic and dispatch function. (e.g., Avoid discrepancies like `"starry_night"` vs `"stars"`).
    *   Verify that the names used in weighting functions match the names expected by the rendering functions.

## 2. Rendering/Implementation (e.g., `src/rendering/backgroundManager.js`)

*   **Implement the Logic:** Create the specific function that handles the rendering or behavior of the new option (e.g., `_drawNewBackgroundType`).
*   **Dispatch Function (`drawBackground` / `drawMound` etc.):**
    *   Add a `case` to the central `switch` statement in the main dispatch function (e.g., `drawBackground`) to handle the new option name.
*   **Buffer Handling (for Graphics):**
    *   **Use Provided Buffer:** Rendering functions (like `_draw...`) should receive the graphics buffer (usually named `target`) as a parameter from the central manager (`bufferManager`).
    *   **Draw In-Place:** Draw *directly* onto this `target` buffer.
    *   **NO Internal Buffers:** Do *not* call `target.createGraphics()` inside the specific drawing function. The `bufferManager` handles buffer creation.
    *   **NO Internal Caching:** Do *not* use `getOrCreateBuffer` or `cacheTexture` within the specific drawing function. The `bufferManager` handles caching.
*   **Function Call Pattern:**
    *   Since drawing functions modify the `target` buffer in-place, the dispatch function (`switch` statement) should call them *directly*:
        ```javascript
        case VariableTypes.NEW_OPTION: _drawNewOption(target, palette, type); break;
        ```
    *   **Avoid `target.image()`:** Do *not* wrap the function call in `target.image(...)` if the function doesn't explicitly create and return a *separate* buffer (which is not our current pattern for backgrounds). Doing so will cause "undefined (reading 'width')" errors if the function returns `undefined`.
*   **Safe Property Access:**
    *   When accessing potentially missing properties from `palette` or `state`, use nullish coalescing (`??`) or optional chaining (`?.`) with sensible default/fallback values to prevent errors.
        ```javascript
        // Good: Handles missing palette.sky
        const sky = palette.sky ?? [200, 220, 255];
        target.background(sky[0], sky[1], sky[2]);

        // Bad: Will crash if palette.sky is undefined
        // target.background(palette.sky[0], palette.sky[1], palette.sky[2]);
        ```

## 3. Debug UI (`src/core/logging.js`)

*   If applicable, update any debug UI elements (like dropdown menus) to include the new variable option. Ensure the UI reflects the actual available options.

## 4. Testing

*   After implementing changes, refresh the project in the browser.
*   Thoroughly test the new option and interactions with existing options.
*   Check the browser's developer console for *any* errors during generation or interaction (like using debug controls).

By following these steps, we can hopefully avoid repeating the buffer management and naming inconsistency issues encountered previously.
