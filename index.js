import { toggleTheme, checkThemePreference } from './scripts/theme-toggle.js';
import { showToast } from './scripts/toast.js';
import * as CONSTANTS from './config/constants.js';

window.MonacoEnvironment = {
    getWorkerUrl: function (workerId, label) {
        return 'libs/monaco/vs/base/worker/workerMain.js';
    }
};

require.config({ paths: { vs: 'libs/monaco/vs' } });

// Theme setup
require(['vs/editor/editor.main'], function () {

    const themeToggle = document.getElementById('themeToggle');
    checkThemePreference(monaco.editor);
    themeToggle.addEventListener('click', () => {
        toggleTheme(monaco.editor);
    });

    // Icon data and pagination config
    let allIcons = [];
    let filteredIcons = [];
    let currentCategory = 'all';
    let currentIndex = 0;
    const iconsPerPage = 30;

    const iconGrid = document.getElementById('icon-grid');
    const scrollAnchor = document.getElementById('scroll-anchor');
    const searchInput = document.getElementById('search-input');
    const sizeSelect = document.getElementById('size-select');
    const scrollContainer = document.querySelector('.icon-grid');

    let currentSize = 'medium'; // default size
    let activeIcon = null;

    // Intersection Observer
    const observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
            loadNextIcons();
        }
    }, {
        root: scrollContainer,
        rootMargin: '200px',
        threshold: 0.1
    });

    async function loadIcons() {
        // loadingIndicator.style.display = 'block';
        try {
            const res = await fetch('icons-index.json');
            allIcons = await res.json();
            setupCategoryTabs();
            setCategory('all');
        } catch (error) {
            console.error('Failed to load icons:', error);
        } finally {
            // loadingIndicator.style.display = 'none';
        }
    }

    function setCategory(category) {
        currentCategory = category;
        currentIndex = 0;
        if (category === 'favorites') {
            const favKeys = getFavorites();
            filteredIcons = allIcons.filter(icon => {
                const key = `${icon.category}:${icon.name}`;
                return favKeys.includes(key);
            });
        } else {
            filteredIcons = category === 'all'
                ? allIcons
                : allIcons.filter(icon => icon.category.toLowerCase() === category.toLowerCase());
        }

        iconGrid.innerHTML = '';
        observer.disconnect();
        loadNextIcons();
    }

    function loadNextIcons() {
        if (filteredIcons.length === 0) {
            iconGrid.innerHTML = `
                <div class="grid-empty-state">
                    <i class="fa-regular fa-face-frown"></i>
                    <p>No icons found matching your selection.</p>
                    <button class="grid-empty-reset-btn" id="grid-empty-reset-btn">Reset Filters</button>
                </div>
            `;
            const resetBtn = document.getElementById('grid-empty-reset-btn');
            if (resetBtn) {
                resetBtn.addEventListener('click', () => {
                    searchInput.value = '';
                    const clearBtn = document.getElementById('search-clear-btn');
                    if (clearBtn) clearBtn.style.display = 'none';
                    setCategory('all');
                    const tabs = document.querySelectorAll('.category-tab');
                    tabs.forEach(t => {
                        if (t.getAttribute('data-category') === 'all') {
                            t.classList.add('active');
                        } else {
                            t.classList.remove('active');
                        }
                    });
                });
            }
            return;
        }

        const nextBatch = filteredIcons.slice(currentIndex, currentIndex + iconsPerPage);

        nextBatch.forEach(icon => {
            const isFav = isFavorite(icon);
            const card = document.createElement('div');
            card.className = 'icon-card';
            card.innerHTML = `
            <div class="icon-card-fav-btn ${isFav ? 'active' : ''}" data-name="${icon.name}" data-category="${icon.category}">
                <i class="${isFav ? 'fa-solid' : 'fa-regular'} fa-heart"></i>
            </div>
            <div class="icon-preview slds-icon_container ${icon.sldsClass}">
                <svg class="slds-icon slds-icon_${currentSize}" aria-hidden="true">
                    <use href="${icon.sprite}"></use>
                </svg>
            </div>
            <div class="icon-name">${icon.name}</div>
        `;

            if (icon.category === 'utility') {
                const svgEl = card.querySelector('svg');
                if (svgEl) svgEl.style.fill = '#747474'; // grey for utility icons
            }

            const favBtn = card.querySelector('.icon-card-fav-btn');
            if (favBtn) {
                favBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    toggleFavorite(icon);
                    const nowFav = isFavorite(icon);
                    favBtn.classList.toggle('active', nowFav);
                    const iconEl = favBtn.querySelector('i');
                    if (iconEl) {
                        iconEl.className = nowFav ? 'fa-solid fa-heart' : 'fa-regular fa-heart';
                    }

                    if (currentCategory === 'favorites') {
                        card.style.animation = 'fadeOut 0.2s ease forwards';
                        setTimeout(() => {
                            card.remove();
                            const displayedCards = iconGrid.querySelectorAll('.icon-card').length;
                            if (displayedCards === 0) {
                                setCategory('favorites');
                            }
                        }, 200);
                    }
                });
            }

            card.addEventListener('click', () => {
                showIconDetails(icon);
            });

            iconGrid.appendChild(card);
        });
        currentIndex += iconsPerPage;
        iconGrid.appendChild(scrollAnchor);

        // Disconnect first to avoid duplicate triggers
        observer.disconnect();

        // Only observe if more icons are available
        if (currentIndex < filteredIcons.length) {
            setTimeout(() => {
                observer.observe(scrollAnchor);

                // In case user is still at bottom, force check
                if (scrollContainer.scrollTop + scrollContainer.clientHeight >= scrollContainer.scrollHeight - 10) {
                    observer.unobserve(scrollAnchor);
                    loadNextIcons(); // recursively load if still at bottom
                }
            }, 100); // wait for DOM update
        }
    }


    sizeSelect.addEventListener('change', () => {
        currentSize = sizeSelect.value;
        currentIndex = 0;
        iconGrid.innerHTML = '';
        observer.disconnect();
        loadNextIcons();
    });

    function setupCategoryTabs() {
        const tabs = document.querySelectorAll('.category-tab');
        tabs.forEach(tab => {
            const category = tab.getAttribute('data-category');
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');

                observer.disconnect();
                searchInput.value = '';
                setCategory(category);
            });
        });
    }

    searchInput.addEventListener('input', () => {
        const query = searchInput.value.trim().toLowerCase();
        const clearBtn = document.getElementById('search-clear-btn');
        if (clearBtn) {
            clearBtn.style.display = query ? 'block' : 'none';
        }

        filteredIcons = allIcons.filter(icon => {
            const key = `${icon.category}:${icon.name}`;
            const matchesCategory = currentCategory === 'all'
                || (currentCategory === 'favorites' && getFavorites().includes(key))
                || icon.category.toLowerCase() === currentCategory.toLowerCase();
            const matchesSearch = icon.name.toLowerCase().includes(query) || icon.tags.some(tag => tag.toLowerCase().includes(query));
            return matchesCategory && matchesSearch;
        });

        currentIndex = 0;
        iconGrid.innerHTML = '';
        observer.disconnect();

        setTimeout(() => {
            loadNextIcons();
        }, 100);
    });

    let iconColorText = '';
    function showIconDetails(icon) {
        activeIcon = icon;
        const detailPanel = document.getElementById('icon-details');
        if (!detailPanel) return;

        detailPanel.classList.remove('empty');
        const placeholder = detailPanel.querySelector('.placeholder-message');
        if (placeholder) placeholder.style.display = 'none';

        let detailsContainer = detailPanel.querySelector('.details-container');
        if (!detailsContainer) {
            detailsContainer = document.createElement('div');
            detailsContainer.className = 'details-container';
            detailPanel.appendChild(detailsContainer);
        }
        detailsContainer.style.display = 'block';

        if (!detailsContainer.querySelector('.detail-header')) {
            detailsContainer.innerHTML = `
            <div class="detail-header">
                <div class="detail-icon"></div>
                <div class="detail-title">
                    <h2 class="detail-name"></h2>
                    <div class="detail-category"></div>
                </div>
            </div>
            
            <div class="detail-section">
                <!-- New Icon Name Display with Copy Button -->
                <div class="icon-name-display">
                    <div class="icon-name-text" id="icon-name-display">${icon.copyName}</div>
                    <i class="fa-regular fa-copy icon-name-copy" data-code="" id="copy-name-button" title="Copy icon name"></i>
                </div>
                <div class="download-options">
                    <a class="download-button" id="download-svg" download style="text-decoration: none;">
                        <i class="fa-solid fa-download"></i> SVG
                    </a>
                    <a class="download-button" id="download-png" download style="text-decoration: none;">
                        <i class="fa-solid fa-download"></i> PNG
                    </a>
                </div>
            </div>

            <div class="accordion" id="modify-icon-accordion">
                <div class="accordion-header" id="modify-icon-accordion-header">
                    <div class="accordion-title">
                        <i class="fa-solid fa-palette"></i>
                        Modify Icon
                    </div>
                    <i class="fa-solid fa-chevron-down accordion-icon"></i>
                </div>
                <div class="accordion-content">
                    <div class="color-picker-grid">
                        <div class="color-picker-item">
                            <label class="color-picker-label" for="foreground-color">Foreground Color</label>
                            <div class="color-picker-wrapper">
                                <input type="color" id="foreground-color" class="color-picker" value="#000000">
                                <div id="foreground-color-code" class="color-code">#000000</div>
                            </div>
                        </div>
                        <div class="color-picker-item">
                            <label class="color-picker-label" for="background-color">Background Color</label>
                            <div class="color-picker-wrapper">
                                <input type="color" id="background-color" class="color-picker" value="#000000">
                                <div id="background-color-code" class="color-code">#ffffff</div>
                            </div>
                        </div>
                    </div>
                    <div style="margin-bottom:0.5rem;" id="sldsIconColor">
                        <div class="slds-select-container">
                            <label class="slds-select-label" for="slds-text-class">SLDS Icon Text Class</label>
                            <select id="slds-text-class" class="slds-select-section">
                                <option value="default" selected>Default</option>
                                <option value="success">Success</option>
                                <option value="warning">Warning</option>
                                <option value="error">Error</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            <div class="accordion open" id="modify-icon-accordion">
                <div class="accordion-header" id="modify-icon-accordion-header">
                    <div class="accordion-title">
                        <i class="fa-solid fa-palette"></i>
                        Code Examples
                    </div>
                    <!-- <i class="fa-solid fa-chevron-down accordion-icon"></i> -->
                </div>
                <div class="accordion-content">
                    <div class="code-tabs">
                        <div class="code-tab active" data-tab="lwc">LWC</div>
                        <div class="code-tab" data-tab="aura">Aura</div>
                        <div class="code-tab" data-tab="slds">SLDS</div>
                    </div>
                    <div class="code-content active" data-content="lwc">
                        <div id="lwcEditor" class="editor output-editor textarea-field"></div>
                        <button class="copy-button" data-code="">
                            <i class="fa-regular fa-copy"></i> Copy LWC
                        </button>
                    </div>
                    <div class="code-content" data-content="aura">
                        <div id="auraEditor" class="editor output-editor textarea-field"></div>
                        <button class="copy-button" data-code="">
                            <i class="fa-regular fa-copy"></i> Copy Aura
                        </button>
                    </div>
                    <div class="code-content" data-content="slds">
                        <div id="sldsEditor" class="editor output-editor textarea-field"></div>
                        <button class="copy-button" data-code="">
                            <i class="fa-regular fa-copy"></i> Copy SLDS
                        </button>
                    </div>
                </div>
            </div>
        `;

            const foregroundInput = document.getElementById('foreground-color');
            const backgroundInput = document.getElementById('background-color');
            if (foregroundInput && backgroundInput) {
                foregroundInput.addEventListener('input', updateIconColors);
                backgroundInput.addEventListener('input', updateIconColors);
            }
        }

        let textClass = '';
        if (icon.category === 'utility') {
            textClass = ' slds-icon-text-default';
        }

        detailPanel.querySelector('.detail-name').textContent = icon.name;
        detailPanel.querySelector('.detail-category').textContent = capitalize(icon.category);
        detailPanel.querySelector('.detail-icon').innerHTML = `
            <div class="slds-icon_container ${icon.sldsClass}" id="detail-icon-container">
                <svg class="slds-icon${textClass} slds-icon_${currentSize}" id="detail-icon-svg" aria-hidden="true">
                <use href="${icon.sprite}"></use>
                </svg>
            </div>
        `;

        const modifySection = document.getElementById('modify-icon-accordion');
        if (modifySection) {
            if (icon.category === 'doctype') {
                modifySection.style.display = 'none';
            } else {
                modifySection.style.display = 'block';
            }
        }

        const sldsIconColor = document.getElementById('sldsIconColor');
        if (sldsIconColor) {
            if (icon.category === 'utility') {
                sldsIconColor.style.display = 'block';
            } else {
                sldsIconColor.style.display = 'none';
            }
        }

        const copyNameBtn = detailPanel.querySelector('#copy-name-button');
        if (copyNameBtn) {
            copyNameBtn.dataset.code = `action:${icon.name}`;
        }

        const svgBtn = detailPanel.querySelector('#download-svg');
        const pngBtn = detailPanel.querySelector('#download-png');
        if (svgBtn) {
            svgBtn.style.display = icon.svg ? 'flex' : 'none';
        }
        if (pngBtn) {
            pngBtn.style.display = icon.png ? 'flex' : 'none';
        }

        detailPanel.querySelectorAll('.code-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const target = tab.dataset.tab;
                detailPanel.querySelectorAll('.code-tab').forEach(t => t.classList.remove('active'));
                detailPanel.querySelectorAll('.code-content').forEach(c => c.classList.remove('active'));

                tab.classList.add('active');
                const content = detailPanel.querySelector(`.code-content[data-content="${target}"]`);
                if (content) content.classList.add('active');
            });
        });

        const accordionHeader = detailPanel.querySelector('#modify-icon-accordion-header');
        const accordion = detailPanel.querySelector('#modify-icon-accordion');

        if (accordionHeader && accordion) {
            // Prevent adding multiple event listeners
            if (!accordionHeader.dataset.listenerAdded) {
                accordionHeader.addEventListener('click', (e) => {
                    e.stopPropagation();
                    accordion.classList.toggle('open');
                });
                accordionHeader.dataset.listenerAdded = 'true'; // Mark listener added
            }
        }

        const textClassDropdown = document.getElementById('slds-text-class');
        const iconContainer = document.getElementById('detail-icon-svg');
        
        if (textClassDropdown && iconContainer) {
            // Set initial value
            textClassDropdown.value =  'default';
            if (!textClassDropdown.dataset.listenerAdded) {
                textClassDropdown.addEventListener('change', (e) => {
                    // Remove all existing slds-icon-text-* classes
                    iconContainer.classList.forEach(cls => {
                        if (cls.startsWith('slds-icon-text-')) {
                            iconContainer.classList.remove(cls);
                        }
                    });

                    // Add the newly selected class
                    iconContainer.classList.add('slds-icon-text-' + e.target.value);
                    iconColorText = e.target.value;
                    resetColorPickers(activeIcon);
                    editorConfig(activeIcon);
                });
                textClassDropdown.dataset.listenerAdded = 'true';
            }
        }
        editorConfig(activeIcon);
        resetColorPickers(activeIcon);
    }

    function capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    document.addEventListener('click', (e) => {
        const copyNameBtn = e.target.closest('#copy-name-button');
        if (copyNameBtn?.dataset.code) {
            navigator.clipboard.writeText(copyNameBtn.dataset.code)
                .then(() => showToast('Copied!', 'Icon name copied to clipboard.', 'success'))
                .catch(() => showToast('Copy Failed', 'Could not copy.', 'error'));
            return;
        }

        const copyBtn = e.target.closest('.copy-button');
        if (copyBtn?.dataset.code) {
            navigator.clipboard.writeText(copyBtn.dataset.code)
                .then(() => showToast('Copied!', 'Code snippet copied to clipboard.', 'success'))
                .catch(() => showToast('Copy Failed', 'Could not copy.', 'error'));
            return;
        }

        const downloadSvgBtn = e.target.closest('#download-svg');
        if (downloadSvgBtn) {
            e.preventDefault();
            if (activeIcon) downloadCustomizedIcon(activeIcon, 'svg');
            return;
        }

        const downloadPngBtn = e.target.closest('#download-png');
        if (downloadPngBtn) {
            e.preventDefault();
            if (activeIcon) downloadCustomizedIcon(activeIcon, 'png');
            return;
        }
    });

    let lwcOutput, auraOutput, sldsOutput;
    function editorConfig(icon) {
        lwcOutput?.dispose();
        auraOutput?.dispose();
        sldsOutput?.dispose();

        const theme = document.body.classList.contains('dark') ? CONSTANTS.MONACO_DARK_THEME : CONSTANTS.MONACO_LIGHT_THEME;

        lwcOutput = monaco.editor.create(document.getElementById('lwcEditor'), { ...CONSTANTS.LWC_OUTPUT_CONFIG, theme });
        auraOutput = monaco.editor.create(document.getElementById('auraEditor'), { ...CONSTANTS.AURA_OUTPUT_CONFIG, theme });
        sldsOutput = monaco.editor.create(document.getElementById('sldsEditor'), { ...CONSTANTS.SLDS_OUTPUT_CONFIG, theme });
        checkThemePreference(monaco.editor);
        let iconColorText = document.getElementById('slds-text-class')?.value || 'default';

        const lwcCode = `<lightning-icon 
    icon-name="${icon.category}:${icon.name}" 
    size="${currentSize}"
    variant="${iconColorText}">
</lightning-icon>`;
        lwcOutput?.setValue(lwcCode);
        document.querySelector('[data-content="lwc"] .copy-button').dataset.code = lwcCode;

        const auraCode = `<lightning:icon 
    iconName="${icon.category}:${icon.name}" 
    size="${currentSize}
    variant="${iconColorText}" 
/>`;
        auraOutput?.setValue(auraCode);
        document.querySelector('[data-content="aura"] .copy-button').dataset.code = auraCode;

        let textClass = '';
        if (icon.category === 'utility') {
            textClass = ' slds-icon-text-' + iconColorText;
        }
        const sldsCode = `<span class="slds-icon_container ${icon.sldsClass}">
    <svg class="slds-icon${textClass} slds-icon_${currentSize}" 
        aria-hidden="true">
        <use href="${icon.sprite}">
        </use>
    </svg>
</span>`;
        sldsOutput?.setValue(sldsCode);
        document.querySelector('[data-content="slds"] .copy-button').dataset.code = sldsCode;
    }

    // Initialize
    loadIcons();

    // Search clear button handler
    const clearBtn = document.getElementById('search-clear-btn');
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            searchInput.value = '';
            clearBtn.style.display = 'none';
            searchInput.focus();
            searchInput.dispatchEvent(new Event('input'));
        });
    }

    // Keyboard shortcut to search
    window.addEventListener('keydown', (e) => {
        if (e.key === '/' && document.activeElement !== searchInput) {
            e.preventDefault();
            searchInput.focus();
            searchInput.select();
        }
    });

    // Favorites Helper functions
    function getFavorites() {
        try {
            return JSON.parse(localStorage.getItem('favorites')) || [];
        } catch {
            return [];
        }
    }

    function isFavorite(icon) {
        const key = `${icon.category}:${icon.name}`;
        return getFavorites().includes(key);
    }

    function toggleFavorite(icon) {
        const key = `${icon.category}:${icon.name}`;
        let favs = getFavorites();
        if (favs.includes(key)) {
            favs = favs.filter(k => k !== key);
            showToast('Removed', 'Removed from favorites.', 'info');
        } else {
            favs.push(key);
            showToast('Added', 'Added to favorites.', 'success');
        }
        localStorage.setItem('favorites', JSON.stringify(favs));
    }

    function updateIconColors() {
        if (!activeIcon) return;

        const foregroundInput = document.getElementById('foreground-color');
        const backgroundInput = document.getElementById('background-color');
        const foregroundCode = document.getElementById('foreground-color-code');
        const backgroundCode = document.getElementById('background-color-code');
        const cssBlock = document.getElementById('cssCodeBlock');

        const fg = foregroundInput.value;
        const bg = backgroundInput.value;

        // Update color labels
        if (foregroundCode) foregroundCode.textContent = fg;
        if (backgroundCode) backgroundCode.textContent = bg;

        const detailIconCont = document.getElementById('detail-icon-container');
        const detailIconSvg = document.getElementById('detail-icon-svg');

        // Update icon preview
        if (detailIconSvg) {
            detailIconSvg.style.removeProperty('fill');
            detailIconSvg.classList.forEach(cls => {
                if (cls.startsWith('slds-icon-text-')) {
                    detailIconSvg.classList.remove(cls);
                }
            });
        }
        if (detailIconCont) {
            detailIconCont.style.setProperty('--slds-c-icon-color-foreground', fg);
            detailIconCont.style.setProperty('--slds-c-icon-color-background', bg);
        }

        // Updated Monaco Code with inline style
        const lwcCode = `<lightning-icon 
    icon-name="${activeIcon.category}:${activeIcon.name}" 
    size="${currentSize}" 
    style="--slds-c-icon-color-foreground: ${fg}; --slds-c-icon-color-background: ${bg};">
</lightning-icon>`;

        const auraCode = `<lightning:icon 
    iconName="${activeIcon.category}:${activeIcon.name}" 
    size="${currentSize}" 
    style="--slds-c-icon-color-foreground: ${fg}; --slds-c-icon-color-background: ${bg};" />`;

        let iconColorText = document.getElementById('slds-text-class')?.value || 'default';
        let textClass = '';
        if (activeIcon.category === 'utility') {
            textClass = ' slds-icon-text-' + iconColorText;
        }

        const sldsCode = `<span class="slds-icon_container ${activeIcon.sldsClass}" 
    style="--slds-c-icon-color-foreground: ${fg}; --slds-c-icon-color-background: ${bg};">
  <svg class="slds-icon slds-icon_${currentSize}" aria-hidden="true">
    <use href="${activeIcon.sprite}"></use>
  </svg>
</span>`;

        // Update Monaco editor values
        lwcOutput?.setValue(lwcCode);
        auraOutput?.setValue(auraCode);
        sldsOutput?.setValue(sldsCode);

        // Update copy buttons
        document.querySelector('[data-content="lwc"] .copy-button').dataset.code = lwcCode;
        document.querySelector('[data-content="aura"] .copy-button').dataset.code = auraCode;
        document.querySelector('[data-content="slds"] .copy-button').dataset.code = sldsCode;

        if (cssBlock) {
            cssBlock.textContent = `.${activeIcon.sldsClass} {\n  --slds-c-icon-color-foreground: ${fg};\n  --slds-c-icon-color-background: ${bg};\n}`;
        }
    }

    function resetColorPickers(icon) {
        if (!icon) return;

        const foregroundInput = document.getElementById('foreground-color');
        const backgroundInput = document.getElementById('background-color');
        const foregroundCode = document.getElementById('foreground-color-code');
        const backgroundCode = document.getElementById('background-color-code');

        if (foregroundInput && backgroundInput) {
            let defaultFg = '#ffffff';
            if (icon.category === 'utility') {
                defaultFg = '#706e6b';
            }

            let defaultBg = '#ffffff';
            const detailIconCont = document.getElementById('detail-icon-container');
            if (detailIconCont) {
                const computedBg = window.getComputedStyle(detailIconCont).backgroundColor;
                defaultBg = rgbToHex(computedBg) || '#ffffff';
            }

            foregroundInput.value = defaultFg;
            backgroundInput.value = defaultBg;
            if (foregroundCode) foregroundCode.textContent = defaultFg;
            if (backgroundCode) backgroundCode.textContent = defaultBg;
        }
    }

    function rgbToHex(rgbStr) {
        if (!rgbStr) return null;
        const match = rgbStr.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+(?:\.\d+)?))?\)$/);
        if (!match) return null;
        const r = parseInt(match[1]);
        const g = parseInt(match[2]);
        const b = parseInt(match[3]);
        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    }

    async function downloadCustomizedIcon(icon, format) {
        try {
            const res = await fetch(icon.svg);
            if (!res.ok) throw new Error("Failed to fetch SVG source.");
            const svgText = await res.text();
            
            const parser = new DOMParser();
            const svgDoc = parser.parseFromString(svgText, 'image/svg+xml');
            const svgEl = svgDoc.querySelector('svg');
            if (!svgEl) throw new Error("Invalid SVG content.");
            
            const foregroundInput = document.getElementById('foreground-color');
            const backgroundInput = document.getElementById('background-color');
            const fg = foregroundInput ? foregroundInput.value : '#000000';
            const bg = backgroundInput ? backgroundInput.value : '#ffffff';
            
            // Apply foreground fill to paths
            svgEl.setAttribute('fill', fg);
            svgEl.querySelectorAll('path, circle, rect, polygon, ellipse').forEach(el => {
                el.setAttribute('fill', fg);
            });
            
            // Doctype and utility don't usually have background shapes, but standard/action/custom do
            if (icon.category !== 'doctype') {
                const rect = svgDoc.createElementNS('http://www.w3.org/2000/svg', 'rect');
                rect.setAttribute('width', '100%');
                rect.setAttribute('height', '100%');
                rect.setAttribute('fill', bg);
                
                let rx = '56'; // standard/action border radius (viewBox is 520x520)
                if (icon.category === 'custom') {
                    rx = '260'; // circular radius
                } else if (icon.category === 'utility') {
                    rx = '0'; // square background
                }
                rect.setAttribute('rx', rx);
                svgEl.insertBefore(rect, svgEl.firstChild);
            }
            
            const serializer = new XMLSerializer();
            const customizedSvgText = serializer.serializeToString(svgEl);
            
            if (format === 'svg') {
                const blob = new Blob([customizedSvgText], { type: 'image/svg+xml' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${icon.name}_customized.svg`;
                a.click();
                URL.revokeObjectURL(url);
                showToast('Success', 'SVG downloaded successfully.', 'success');
            } else if (format === 'png') {
                const svg64 = btoa(unescape(encodeURIComponent(customizedSvgText)));
                const svgDataUrl = 'data:image/svg+xml;base64,' + svg64;
                
                const img = new Image();
                img.src = svgDataUrl;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const width = svgEl.viewBox.baseVal.width || 520;
                    const height = svgEl.viewBox.baseVal.height || 520;
                    canvas.width = width;
                    canvas.height = height;
                    
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0);
                    
                    canvas.toBlob((pngBlob) => {
                        if (!pngBlob) {
                            showToast('Error', 'PNG generation failed.', 'error');
                            return;
                        }
                        const url = URL.createObjectURL(pngBlob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `${icon.name}_customized.png`;
                        a.click();
                        URL.revokeObjectURL(url);
                        showToast('Success', 'PNG downloaded successfully.', 'success');
                    }, 'image/png');
                };
                img.onerror = () => {
                    showToast('Error', 'Failed to render PNG image.', 'error');
                };
            }
        } catch (error) {
            console.error(error);
            showToast('Error', 'Failed to generate file: ' + error.message, 'error');
        }
    }
})

async function loadHTML(id, path) {
    const container = document.getElementById(id);
    if (!container) return;

    try {
        const res = await fetch(path);
        if (!res.ok) throw new Error(`Failed to load ${path}`);
        const html = await res.text();
        container.innerHTML = html;
    } catch (err) {
        console.error(err);
    }
}

window.addEventListener('DOMContentLoaded', () => {
    // Load header
    // loadHTML('header-container', './components/header.html').then(() => {
    //     // Set header text after it's loaded
    //     document.getElementById('title').textContent = CONSTANTS.TITLE;
    //     document.getElementById('subtitle').textContent = CONSTANTS.SUBTITLE;
    // });

    // Load footer
    loadHTML('footer-container', './components/footer.html').then(() => {
        // Set footer content after it's loaded
        document.getElementById('currentYear').textContent = new Date().getFullYear();
        document.getElementById('authorDisplay').textContent = CONSTANTS.AUTHOR.name;
        document.getElementById('copyright').textContent = CONSTANTS.COPYRIGHT;
        document.getElementById('footerTitle').textContent = CONSTANTS.TITLE;
        document.getElementById('tagline').textContent = CONSTANTS.TAGLINE;

        document.querySelector('.footer-link.github').href = CONSTANTS.AUTHOR.github;
        document.querySelector('.footer-link.linkedin').href = CONSTANTS.AUTHOR.linkedin;
        document.querySelector('.footer-link.trailhead').href = CONSTANTS.AUTHOR.trailhead;
        document.querySelector('.footer-link.email').href = `mailto:${CONSTANTS.AUTHOR.email}`;
    });
});