# Changelog

All notable changes to the **Icons Kit for Salesforce Developer** extension will be documented in this file.

---

## [1.1.0] - 2026-06-05

### Added
* **Favorites Tab:** Persistable local-storage based favorite icon bookmarking. Icons can be starred directly from cards.
* **Dynamic Recoloring Downloads:** SVG and PNG downloads now fetch, parse, and apply custom foreground and background colors in real-time.
* **Search Clear Button:** A handy `x` button inside the search wrapper to reset search input instantly.
* **Keyboard Shortcut:** Focus the search input dynamically by pressing the `/` key.
* **Empty State Illustration:** Professional "No icons found" message inside the grid when search/filtering queries return 0 results.
* **Standard-Sized Icons:** Resized extension icons (16x16, 32x32, 48x48) added and configured in `manifest.json` for high-DPI browser rendering.

### Fixed
* **Color Customization Crash:** Resolved a null reference exception (`TypeError: Cannot set properties of null`) in `updateIconColors` and corrected the inline CSS custom properties template typo.
* **Monaco Snippet Copy Buttons:** Registered global delegation click listeners for Monaco's LWC, Aura, and SLDS "Copy" buttons.
* **Broken Downloads:** Converted non-functional `<button href="...">` tags for SVG and PNG into standard `<a>` tags with `download` attributes.
* **Absolute Path Resolution:** Replaced absolute imports (`/styles/...`) and CSS layout imports with extension-safe relative paths.
* **Monaco Theme Flash:** Initialized editors with the active visual theme state on startup to prevent visual flashes in dark mode.
* **Static Link fallbacks:** Populated static fallback URLs and added `target="_blank"` properties on footer anchor links.
* **Documentation Cleanups:** Removed all copied boilerplate references to "JSON to Apex Genie" and obsolete npm commands in `README.md`, `CONTRIBUTING.md`, and `PRIVACY.md`.
