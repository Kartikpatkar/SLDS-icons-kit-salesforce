import { toggleTheme, checkThemePreference } from './scripts/theme-toggle.js';
import { showToast } from './scripts/toast.js';

// Theme setup
const themeToggle = document.getElementById('themeToggle');
themeToggle.addEventListener('click', toggleTheme);
checkThemePreference();

// Icon data and pagination config
let allIcons = [];
let filteredIcons = [];
let currentCategory = 'all';
let currentIndex = 0;
const iconsPerPage = 20;

const iconGrid = document.getElementById('icon-grid');
const scrollAnchor = document.getElementById('scroll-anchor');
const loadingIndicator = document.getElementById('loading-indicator');
const searchInput = document.getElementById('search-input');
const sizeSelect = document.getElementById('size-select');

let currentSize = 'medium'; // default size

// Load icon data from JSON
async function loadIcons() {
    loadingIndicator.style.display = 'block'; // Show loading indicator
    try {
        const res = await fetch('icons-index.json');
        allIcons = await res.json();
        setupCategoryTabs();
        setCategory('all'); // default to all category
        observer.observe(scrollAnchor); // start infinite scroll observer
    } catch (error) {
        console.error('Failed to load icons:', error);
    } finally {
        loadingIndicator.style.display = 'none'; // Hide loading indicator
    }
}

// Listen for size select changes
sizeSelect.addEventListener('change', () => {
    currentSize = sizeSelect.value;
    currentIndex = 0;
    iconGrid.innerHTML = '';
    loadNextIcons();
});

// Set category filter and reset pagination
function setCategory(category) {
    currentCategory = category;
    currentIndex = 0;

    filteredIcons = category === 'all'
        ? allIcons
        : allIcons.filter(icon => icon.category.toLowerCase() === category.toLowerCase());

    iconGrid.innerHTML = '';
    loadNextIcons();
}

// Load next batch of icons (pagination)
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

    if (currentIndex >= filteredIcons.length) {
        observer.disconnect(); // Stop infinite scroll when done
    }
}

// Intersection Observer for infinite scroll
const observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
        loadNextIcons();
    }
}, {
    rootMargin: '100px',
});

// Setup category tab buttons
function setupCategoryTabs() {
    const tabs = document.querySelectorAll('.category-tab');
    tabs.forEach(tab => {
        const category = tab.getAttribute('data-category');
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            observer.disconnect();
            setCategory(category);
            observer.observe(scrollAnchor);

            searchInput.value = ''; // reset search on category change
        });
    });
}

// Search input handler
searchInput.addEventListener('input', () => {
    loadingIndicator.style.display = 'block';

    const query = searchInput.value.trim().toLowerCase();

    if (query === '') {
        filteredIcons = currentCategory === 'all'
            ? allIcons
            : allIcons.filter(icon => icon.category.toLowerCase() === currentCategory.toLowerCase());
    } else {
        filteredIcons = allIcons.filter(icon => {
            const matchesCategory = currentCategory === 'all' || icon.category.toLowerCase() === currentCategory.toLowerCase();
            const matchesSearch = icon.name.toLowerCase().includes(query) || icon.tags.some(tag => tag.toLowerCase().includes(query));
            return matchesCategory && matchesSearch;
        });
    }

    currentIndex = 0;
    iconGrid.innerHTML = '';
    observer.disconnect();

    setTimeout(() => {
        loadNextIcons();
        observer.observe(scrollAnchor);
        loadingIndicator.style.display = 'none';
    }, 100);
});

// Accordion toggle
const accordions = document.querySelectorAll('.accordion');
accordions.forEach(accordion => {
    const header = accordion.querySelector('.accordion-header');
    header.addEventListener('click', () => {
        accordion.classList.toggle('open');
    });
});

// Show details of selected icon
function showIconDetails(icon) {
    const detailPanel = document.getElementById('icon-details');
    detailPanel.classList.remove('empty');

    detailPanel.querySelector('.placeholder-message').style.display = 'none';

    // Make sure detail container exists and is shown
    let detailsContainer = detailPanel.querySelector('.details-container');
    if (!detailsContainer) {
        detailsContainer = document.createElement('div');
        detailsContainer.className = 'details-container';
        detailPanel.appendChild(detailsContainer);
    }
    detailsContainer.style.display = 'block';

    // Update detail content or create if missing
    if (!detailsContainer.querySelector('.detail-header')) {
        detailsContainer.innerHTML = `
            <div class="detail-header">
                <div class="detail-icon"></div>
                <div class="detail-title">
                    <h2 class="detail-name"></h2>
                    <div class="detail-category"></div>
                </div>
            </div>

            <!-- Quick Actions -->
            <div class="detail-section">
                <div class="detail-section-title">Quick Actions</div>
                <button class="copy-button" data-code="" data-prefix-dynamic="true">
                    <i class="fa-regular fa-copy"></i> Copy Name
                </button>
                <div class="download-options">
                    <button class="download-button" id="download-svg">
                        <i class="fa-solid fa-download"></i> SVG
                    </button>
                    <button class="download-button" id="download-png">
                        <i class="fa-solid fa-download"></i> PNG
                    </button>
                </div>
            </div>

            <!-- Code Examples -->
            <div class="detail-section">
                <div class="detail-section-title">Code Examples</div>
                <div class="code-tabs">
                    <div class="code-tab" data-tab="lwc">LWC</div>
                    <div class="code-tab" data-tab="aura">Aura</div>
                </div>

                <div class="code-content active" data-content="lwc">
                    <div class="code-block"></div>
                    <button class="copy-button" data-code="">
                        <i class="fa-regular fa-copy"></i> Copy LWC
                    </button>
                </div>

                <div class="code-content" data-content="aura">
                    <div class="code-block"></div>
                    <button class="copy-button" data-code="">
                        <i class="fa-regular fa-copy"></i> Copy Aura
                    </button>
                </div>
            </div>
        `;
    }

    detailPanel.querySelector('.detail-name').textContent = icon.name;
    detailPanel.querySelector('.detail-category').textContent = capitalize(icon.category);

    const iconPreview = `
        <div class="slds-icon_container ${icon.sldsClass}">
            <svg class="slds-icon slds-icon_${currentSize}" aria-hidden="true">
                <use href="${icon.sprite}"></use>
            </svg>
        </div>
    `;
    detailPanel.querySelector('.detail-icon').innerHTML = iconPreview;

    // Quick actions copy button update
    const copyNameBtn = detailPanel.querySelector('.copy-button[data-code]');
    copyNameBtn.dataset.code = icon.name;

    // Downloads
    const svgBtn = detailPanel.querySelector('#download-svg');
    const pngBtn = detailPanel.querySelector('#download-png');

    if (icon.svg) {
        svgBtn.href = icon.svg;
        svgBtn.style.display = 'flex';
    } else {
        svgBtn.style.display = 'none';
    }

    if (icon.png) {
        pngBtn.href = icon.png;
        pngBtn.style.display = 'inline-block';
    } else {
        pngBtn.style.display = 'none';
    }

    // Code examples
    const lwcBlock = detailPanel.querySelector('[data-content="lwc"] .code-block');
    const lwcCopyBtn = detailPanel.querySelector('[data-content="lwc"] .copy-button');
    const auraBlock = detailPanel.querySelector('[data-content="aura"] .code-block');
    const auraCopyBtn = detailPanel.querySelector('[data-content="aura"] .copy-button');

    lwcBlock.textContent = `<lightning-icon icon-name="${icon.category}:${icon.name}" size="${currentSize}"></lightning-icon>`;
    lwcCopyBtn.dataset.code = `<lightning-icon icon-name="${icon.category}:${icon.name}" size="${currentSize}"></lightning-icon>`;

    auraBlock.textContent = `<lightning:icon iconName="${icon.category}:${icon.name}" size="${currentSize}" />`;
    auraCopyBtn.dataset.code = `<lightning:icon iconName="${icon.category}:${icon.name}" size="${currentSize}" />`;
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// Initial call to load icons
loadIcons();

// Global copy button handler
document.addEventListener('click', (e) => {
    const btn = e.target.closest('.copy-button');
    if (btn && btn.dataset.code) {
        let code = btn.dataset.code;

        // If dynamic prefixing is enabled
        if (btn.dataset.prefixDynamic === 'true') {
            // Find the category from the details section
            const categoryEl = document.querySelector('#icon-details .detail-category');
            const category = categoryEl?.textContent?.toLowerCase() || '';

            code = `${category}:${code}`;
        }

        navigator.clipboard.writeText(code).then(() => {
            showToast('Copied!', `Name copied to clipboard.`, 'success');
        }).catch(err => {
            console.error('Copy failed:', err);
            showToast('Copy Failed', 'Could not copy to clipboard.', 'error');
        });
    }
});

