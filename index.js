import { toggleTheme, checkThemePreference } from './scripts/theme-toggle.js';
import { showToast } from './scripts/toast.js';
import * as CONSTANTS from './config/constants.js';

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
        filteredIcons = category === 'all'
            ? allIcons
            : allIcons.filter(icon => icon.category.toLowerCase() === category.toLowerCase());

        iconGrid.innerHTML = '';
        observer.disconnect();
        loadNextIcons();
    }

    function loadNextIcons() {
        const nextBatch = filteredIcons.slice(currentIndex, currentIndex + iconsPerPage);

        nextBatch.forEach(icon => {
            const card = document.createElement('div');
            card.className = 'icon-card';
            card.innerHTML = `
            <div class="icon-preview slds-icon_container ${icon.sldsClass}">
                <svg class="slds-icon slds-icon_${currentSize}" aria-hidden="true">
                    <use href="${icon.sprite}"></use>
                </svg>
            </div>
            <div class="icon-name">${icon.name}</div>
        `;

            if (icon.category === 'utility') {
                const svgEl = card.querySelector('svg');
                svgEl.style.fill = '#747474'; // grey for utility icons
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
        // loadingIndicator.style.display = 'block';

        const query = searchInput.value.trim().toLowerCase();

        filteredIcons = allIcons.filter(icon => {
            const matchesCategory = currentCategory === 'all' || icon.category.toLowerCase() === currentCategory.toLowerCase();
            const matchesSearch = icon.name.toLowerCase().includes(query) || icon.tags.some(tag => tag.toLowerCase().includes(query));
            return matchesCategory && matchesSearch;
        });

        currentIndex = 0;
        iconGrid.innerHTML = '';
        observer.disconnect();

        setTimeout(() => {
            loadNextIcons();
            // loadingIndicator.style.display = 'none';
        }, 100);
    });

    let iconColorText = '';
    function showIconDetails(icon) {
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
                    <button class="download-button" id="download-svg">
                        <i class="fa-solid fa-download"></i> SVG
                    </button>
                    <button class="download-button" id="download-png">
                        <i class="fa-solid fa-download"></i> PNG
                    </button>
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
            svgBtn.href = icon.svg || '#';
            svgBtn.style.display = icon.svg ? 'flex' : 'none';
        }
        if (pngBtn) {
            pngBtn.href = icon.png || '#';
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
                enableIconColorCustomization(icon);
                editorConfig(icon);
            });
        }
        editorConfig(icon);
        enableIconColorCustomization(icon);
    }

    function capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    document.addEventListener('click', (e) => {
        const btn = e.target.closest('#copy-name-button');
        if (btn?.dataset.code) {
            navigator.clipboard.writeText(btn.dataset.code)
                .then(() => showToast('Copied!', 'Code copied to clipboard.', 'success'))
                .catch(() => showToast('Copy Failed', 'Could not copy.', 'error'));
        }
    });

    let lwcOutput, auraOutput, sldsOutput;
    function editorConfig(icon) {
        lwcOutput?.dispose();
        auraOutput?.dispose();
        sldsOutput?.dispose();

        lwcOutput = monaco.editor.create(document.getElementById('lwcEditor'), CONSTANTS.LWC_OUTPUT_CONFIG);
        auraOutput = monaco.editor.create(document.getElementById('auraEditor'), CONSTANTS.AURA_OUTPUT_CONFIG);
        sldsOutput = monaco.editor.create(document.getElementById('sldsEditor'), CONSTANTS.SLDS_OUTPUT_CONFIG);
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

    // Call this function *after* the icon SVG is inserted
    function enableIconColorCustomization(icon) {
        const foregroundInput = document.getElementById('foreground-color');
        const backgroundInput = document.getElementById('background-color');
        const foregroundCode = document.getElementById('foreground-color-code');
        const backgroundCode = document.getElementById('background-color-code');
        const cssBlock = document.getElementById('cssCodeBlock');

        function updateIconColors() {

            const detailIconCont = document.getElementById('detail-icon-container');
            const detailIconSvg = document.getElementById('detail-icon-svg');
            const fg = foregroundInput.value;
            const bg = backgroundInput.value;

            // Update color labels
            foregroundCode.textContent = fg;
            backgroundCode.textContent = bg;

            // Update icon preview
            // const svgIcon = document.querySelector(`.${icon.sldsClass}`);
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
    icon-name="${icon.category}:${icon.name}" 
    size="${currentSize}" 
    style="--slds-c-icon-color-foreground: ${fg}; --slds-c-icon-color-background: ${bg};">
</lightning-icon>`;

            const auraCode = `<lightning:icon 
    iconName="${icon.category}:${icon.name}" 
    size="${currentSize}" 
    style="--slds-c-icon-color-foreground: ${fg}; --slds-c-icon-color-background: ${bg};" />`;

            let iconColorText = document.getElementById('slds-text-class')?.value || 'default';
            let textClass = '';
            if (icon.category === 'utility') {
                textClass = ' slds-icon-text-' + iconColorText;
            }

            const sldsCode = `<span class="slds-icon_container ${icon.sldsClass}" 
    style="--slds-c-icon-color-foreground: ${fg}; --slds-c-icon-color-background: ${bg};">
  <svg class="slds-icon slds-icon_${currentSize}" aria-hidden="true">
    <use href="${icon.sprite}"></use>
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

            // Optional raw CSS block update
            // let foreground = icon.category == 'utility' ? '--slds-c-icon-color-foreground-default' : '--slds-c-icon-color-foreground';
            cssBlock.textContent = `.${icon.sldsClass} {\n  --slds-c-icon-color-foreground}: ${fg};\n  --slds-c-icon-color-background: ${bg};\n}`;
        }

        // Attach listeners
        foregroundInput.value = '#000000'; // Default foreground color
        backgroundInput.value = '#FFFFFF'; // Default background color
        foregroundInput.addEventListener('input', updateIconColors);
        backgroundInput.addEventListener('input', updateIconColors);

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