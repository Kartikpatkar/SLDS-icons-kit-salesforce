# 🧩 Icons Kit for Salesforce Developer

> **Tagline**: *Browse, preview, customize, and copy SLDS icons like a pro.*

## ✨ Overview

**Icons Kit for Salesforce Developer** is a full-tab Chrome Extension built for Salesforce Admins, Developers, and Architects. It provides a lightning-fast, beautifully designed interface to explore the full SLDS icon set — including Utility, Standard, Action, Custom, and Doctype categories.

No more hunting down SVGs, guessing `icon-name`s, or fiddling with styling. With this tool, you can **instantly preview**, **customize**, and **copy** icons in LWC, Aura, or raw HTML/SVG formats.

---

## 🔧 Features

### 🔍 Search & Filter
- Real-time search by icon name or tags
- Category-based filtering (All, Utility, Standard, Custom, Action, Doctype)
- Icon size filter (XX-Small to Large)

### 📁 Category View
- Responsive tabbed layout
- Infinite scroll with lazy loading
- Grid layout with accessible previews

### 🎨 Customization
- Foreground and background color pickers (applies inline or via SLDS tokens)
- Live Monaco Editor previews for:
  - LWC `<lightning-icon>`
  - Aura `<lightning:icon>`
  - SLDS `<svg><use/></svg>` syntax
- Theme-aware code generation with inline styling and classes

### 📋 Copy Options
- One-click copy for:
  - LWC snippet
  - Aura snippet
  - SLDS markup
  - Icon name (`utility:add`)
- Hover-based tooltips for clarity

### 🌓 Dark/Light Theme Toggle
- Modern developer-friendly dark mode
- Auto-persisted via `localStorage`
- Monaco Editor syncs with theme

### 🧰 Icon Tools Panel
- Modify icon variant (`success`, `warning`, `error`, `default`)
- Preview with applied SLDS color classes
- Download buttons for SVG and PNG (if available)
- Accordion-based UI for advanced customization and examples

### 📊 Icon Metadata Display
- Icon name and category displayed prominently
- Sprite path and SLDS class info included

---

## 📸 Screenshots

> Real screenshots from the live Chrome Extension

### 🔷 Light Mode

![Light Mode - Icon Browser](./screenshots/icon-browser-light.png)
![Light Mode - Icon Details](./screenshots/icon-details-light.png)

### 🌑 Dark Mode

![Dark Mode - Icon Browser](./screenshots/icon-browser-dark.png)
![Dark Mode - Code Customizer](./screenshots/code-customizer-dark.png)

---

## 🛠 Built With

- HTML, CSS, JavaScript (ES Modules)
- [Salesforce Lightning Design System](https://www.lightningdesignsystem.com/)
- [Monaco Editor](https://microsoft.github.io/monaco-editor/)
- Font Awesome for UX icons

---

## 📦 Installation

### ✅ Option 1: [Chrome Web Store (Coming Soon)](#)

> Stay tuned! ApexGenie will soon be available on the Chrome Web Store for one-click installation.

<!--
Once published, replace the above with:
[Install from Chrome Web Store](https://chrome.google.com/webstore/detail/your-extension-id)
-->

### 🔧 Option 2: Load ApexGenie Manually in Chrome

Until it's available in the Chrome Web Store, you can load ApexGenie manually for development or testing:

1. **Clone or Download this Repository:**

   ```bash
   git clone https://github.com/Kartikpatkar/apexgenie.git
   ```

   Or download the ZIP from GitHub and extract it.

2. **Open Chrome and go to the Extensions page:**

   ```
   chrome://extensions/
   ```

3. **Enable Developer Mode:**

   Toggle the **Developer mode** switch in the top right corner.

4. **Click "Load unpacked":**

   - Select the root folder of the project (the one containing `manifest.json`).

5. **Done!**

   - You’ll now see ApexGenie in your extensions bar.
   - Click the icon to launch and start generating Apex!

---

## 🧠 Author Info

Built by **Kartik Patkar**  
🔗 [GitHub](https://github.com/Kartikpatkar) • [LinkedIn](https://linkedin.com/in/kartik-patkar) • [Trailhead](https://www.salesforce.com/trailblazer/kpatkar1)

---

## 📜 License

MIT License – free to use, modify, and distribute.
