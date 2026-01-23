// Cart State
let cart = JSON.parse(localStorage.getItem('alquds_cart')) || [];
let products = [];
let pricingConfig = {};

// Config: Map URL 'cat' to Product Data Properties
// Config: Map URL 'cat' to Product Data Properties
const MATERIAL_MAP = {
    'yellow-gold': { filterField: 'color', filterValue: 'Yellow Gold', label: 'Yellow Gold' },
    'white-gold': { filterField: 'color', filterValue: 'White Gold', label: 'White Gold' },
    'silver': { filterField: 'color', filterValue: 'Silver', label: 'Silver Jewelry' },
    'diamonds': { filterField: 'category', filterValue: 'diamonds', label: 'Diamond Jewelry' },
    'coins-bullions': { filterField: 'category', filterValue: 'coins-bullions', label: 'Coins & Bullions' }
};

// Defined Categories for Grid View (Images can be placeholders initially)
const YELLOW_GOLD_CATS = [
    { id: 'necklaces', label: 'Necklaces', image: 'assets/cat_necklaces.png' },
    { id: 'bangles', label: 'Bangles', image: 'assets/cat_bangles.png' },
    { id: 'chains', label: 'Chains', image: 'assets/cat_chains.png' },
    { id: 'rings', label: 'Rings', image: 'assets/cat_rings.png' },
    { id: 'earrings', label: 'Earrings', image: 'assets/cat_earrings.png' },
    { id: 'bracelets', label: 'Bracelets', image: 'assets/cat_bracelets.png' },
    { id: 'pendants', label: 'Pendants', image: 'assets/cat_pendants.png' },
    { id: 'coins', label: 'Coins', image: 'assets/cat_coins.png' },
    { id: 'anklets', label: 'Anklets', image: 'assets/cat_anklets.png' },
    { id: 'children', label: 'Children', image: 'assets/cat_children.png' },
    { id: 'mens', label: 'Men\'s', image: 'assets/cat_mens.png' }
];

// Helper: Calculate Price dynamically
function calculatePrice(item, config) {
    if (item.weight === "Varies" || item.weight === "N/A" || !item.isDynamic) {
        return item.fixedPrice || 0;
    }

    // Default to 31.1035 if missing from JSON (Admin might not save it)
    const gramsPerOunce = config.gramsPerOunce || 31.1035;

    const purityFactor = item.karat / 24;
    const rawPricePerGram = (config.spotPrice24kOunce / gramsPerOunce) * purityFactor;
    const priceWithMargin = rawPricePerGram * (1 + (item.marginPercent / 100));
    const priceWithLabor = priceWithMargin + item.laborPerGram;
    const finalPrice = priceWithLabor * parseFloat(item.weight);

    return Math.ceil(finalPrice);
}

// Update Cart Count UI
function updateCartCount() {
    const count = cart.reduce((acc, item) => acc + item.quantity, 0);
    const badge = document.getElementById('cart-count');
    if (badge) badge.innerText = count;
}

// Add to Cart Function
// Add to Cart Function
function addToCart(id) {
    const product = products.find(p => p.id == id);
    if (!product) return;

    // Check for quantity input (Product Detail Page)
    const qtyInput = document.getElementById(`quantity-${id}`);
    const quantity = qtyInput ? parseInt(qtyInput.value) : 1;

    const existingItem = cart.find(item => item.id === id);
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        // Ensure we save the calculated price if dynamic
        cart.push({
            ...product,
            price: product.price || 0, // Ensure price is saved
            quantity: quantity
        });
    }

    localStorage.setItem('alquds_cart', JSON.stringify(cart));
    console.log("Cart Updated:", cart); // Debug
    updateCartCount();
    // Custom Toast Notification
    showToast(`${product.name} added to cart!`);
}

// Toast Notification Helper
function showToast(message) {
    // Remove existing toast if any
    const existing = document.getElementById('cart-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'cart-toast';
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: rgba(5, 5, 5, 0.95);
        color: var(--color-gold);
        padding: 15px 25px;
        border: 1px solid var(--color-gold);
        border-radius: 4px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.5);
        z-index: 10000;
        font-family: var(--font-heading);
        font-size: 1rem;
        transform: translateY(-20px);
        opacity: 0;
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        gap: 10px;
    `;

    toast.innerHTML = `<i class="fa-solid fa-check-circle" style="color: #4CAF50;"></i> ${message}`;
    document.body.appendChild(toast);

    // Animate In
    requestAnimationFrame(() => {
        toast.style.transform = 'translateY(0)';
        toast.style.opacity = '1';
    });

    // Animate Out
    setTimeout(() => {
        toast.style.transform = 'translateY(-20px)';
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Pagination State
let currentPage = 1;
const ITEMS_PER_PAGE = 24;
let currentFilteredProducts = [];

// Create Product Card HTML
function createProductCard(product) {
    return `
        <div class="product-card">
            <div style="position: relative; overflow: hidden;">
                <a href="product.html?id=${product.id}" style="display: block;">
                    <img src="${product.image}" alt="${product.name}" class="product-image" loading="lazy">
                </a>
                <button onclick="addToCart('${product.id}')" style="position: absolute; bottom: 10px; right: 10px; background: white; border: none; padding: 10px; border-radius: 50%; cursor: pointer; box-shadow: 0 2px 5px rgba(0,0,0,0.3); z-index: 5;">
                    <i class="fa-solid fa-plus text-gold"></i>
                </button>
            </div>
            <div class="product-info">
                <div class="product-meta">${product.karat} Gold | ${product.weight}</div>
                <h3 class="product-title"><a href="product.html?id=${product.id}">${product.name}</a></h3>
                <div class="product-price">$${product.price ? product.price.toLocaleString() : 'N/A'}</div>
            </div>
        </div>
    `;
}

// Create Category Card HTML (New "Popular Collections" Style)
function createCategoryCard(categoryName, image, parentCat, labelOverride) {
    const display = labelOverride || (categoryName.charAt(0).toUpperCase() + categoryName.slice(1));
    const link = `catalog.html?cat=${parentCat}&sub=${categoryName}`;

    return `
        <div class="category-card-container" onclick="window.location.href='${link}'">
            <img src="${image}" alt="${display}" class="category-card-image" onerror="this.src='assets/placeholder.png'">
            <div class="category-card-label">${display}</div>
        </div>
    `;
}


function setActiveNavLink() {
    const currentPath = window.location.pathname;
    const urlParams = new URLSearchParams(window.location.search);
    const category = urlParams.get('cat');
    const navLinks = document.querySelectorAll('.nav-link');

    navLinks.forEach(link => {
        link.classList.remove('active');
        const href = link.getAttribute('href');
        if (category && href.includes(`cat=${category}`)) {
            link.classList.add('active');
        } else if ((currentPath.endsWith('index.html') || currentPath === '/') && href === 'index.html') {
            link.classList.add('active');
        }
    });
}

// Main Initialization
async function initApp() {
    setActiveNavLink();
    updateCartCount();

    try {
        // 1. Fetch Data
        const [pricingRes, productsRes] = await Promise.all([
            fetch('data/pricing.json?t=' + new Date().getTime()),
            fetch('data/products.json?t=' + new Date().getTime())
        ]);

        pricingConfig = await pricingRes.json();
        const rawData = await productsRes.json();
        const rawProducts = Array.isArray(rawData) ? rawData : (rawData.products_list || []);

        // 2. Calculate Prices
        products = rawProducts.map(p => {
            const calculatedPrice = calculatePrice(p, pricingConfig);
            return { ...p, price: calculatedPrice };
        });

        // 3. Render Home Featured
        const featuredGrid = document.getElementById('featured-products-grid');
        if (featuredGrid) {
            const featured = products.filter(p => p.featured);
            featuredGrid.innerHTML = featured.map(createProductCard).join('');
        }

        // 4. Render Catalog
        const catalogGrid = document.getElementById('product-grid');
        if (catalogGrid) {
            renderCatalog();
        }

        // 5. Render Product Detail
        renderProductDetail();

    } catch (error) {
        console.error("Error loading data:", error);
        // Fallback error UI
        const ids = ['featured-products-grid', 'product-grid', 'product-detail-container'];
        ids.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.innerHTML = '<p class="text-white text-center">Unable to load data. Please refresh.</p>';
        });
    }
}

// Render Catalog Logic
function renderCatalog(reset = true) {
    const grid = document.getElementById('product-grid');
    const title = document.getElementById('page-title');
    // const sidebar = document.querySelector('.category-list');

    if (!grid) return;

    if (reset) {
        currentPage = 1;
        grid.innerHTML = '';
    }

    const urlParams = new URLSearchParams(window.location.search);
    const catParam = urlParams.get('cat');
    const subParam = urlParams.get('sub');
    const searchParam = urlParams.get('search'); // Check for search

    // 1. Logic Switch (Search vs Category)
    let scopeProducts = products;
    let pageLabel = 'Catalog';
    let materialConfig = null;

    console.log('RenderCatalog:', { catParam, subParam, searchParam });

    if (searchParam) {
        // --- SEARCH MODE ---
        const term = searchParam.trim().toLowerCase();
        scopeProducts = products.filter(p => {
            const mName = p.name ? p.name.toLowerCase().includes(term) : false;
            const mId = p.id ? String(p.id).toLowerCase().includes(term) : false;
            const mItem = p.itemNo ? String(p.itemNo).toLowerCase().includes(term) : false;
            return mName || mId || mItem;
        });
        pageLabel = `Search Results: "${searchParam}"`;
        currentFilteredProducts = scopeProducts;

        if (title) title.innerText = pageLabel;

    } else {
        // --- STANDARD CATEGORY MODE ---
        materialConfig = MATERIAL_MAP[catParam];
        if (materialConfig) {
            scopeProducts = products.filter(p => {
                if (materialConfig.filterField === 'color') {
                    // Default to Yellow Gold if color is missing/undefined
                    const prodColor = p.color || 'Yellow Gold';
                    return prodColor === materialConfig.filterValue;
                }
                if (materialConfig.filterField === 'category') return p.category === materialConfig.filterValue;
                return true;
            });
            pageLabel = materialConfig.label;
        } else if (catParam) {
            scopeProducts = products.filter(p => p.category === catParam);
            pageLabel = catParam.charAt(0).toUpperCase() + catParam.slice(1);
        }

        // 2. Check if we should show Categories Grid (Root Level)
        const isMaterialRoot = (materialConfig && materialConfig.filterField === 'color' && !subParam);

        if (isMaterialRoot) {
            // SHOW CATEGORY GRID
            if (title) title.innerText = pageLabel + ' Collections';

            let catHTML = '';

            if (catParam === 'yellow-gold') {
                // FORCE YELLOW GOLD GRID
                catHTML = YELLOW_GOLD_CATS.map(cat => {
                    const sample = products.find(p => p.category === cat.id);
                    const img = sample ? sample.image : cat.image;
                    return createCategoryCard(cat.id, img, catParam, cat.label);
                }).join('');

                grid.innerHTML = catHTML;
                removeLoadMore();
                return; // Explicitly stop here
            }

            // Generic logic
            const categoriesInScope = [...new Set(scopeProducts.map(p => p.category))];

            if (categoriesInScope.length === 0) {
                grid.innerHTML = '<p class="col-span-4 text-center text-muted">No products found in this collection.</p>';
                return;
            }

            catHTML = categoriesInScope.map(cat => {
                const sample = scopeProducts.find(p => p.category === cat);
                return createCategoryCard(cat, sample ? sample.image : 'assets/placeholder.png', catParam);
            }).join('');

            grid.innerHTML = catHTML;
            removeLoadMore();
            return;
        }

        // 3. Render Products (Filtered by Subcategory if simple)
        if (subParam) {
            currentFilteredProducts = scopeProducts.filter(p => p.category === subParam);
            pageLabel += ' - ' + subParam.charAt(0).toUpperCase() + subParam.slice(1);
        } else {
            currentFilteredProducts = scopeProducts;
        }

        if (title) title.innerText = pageLabel;
    }

    // Update Sidebar to show active State
    // We need to know available categories to populate sidebar
    // If subParam is set, we still want to show all categories for the parent Material
    if (materialConfig && materialConfig.filterField === 'color') {
        const categoriesInScope = [...new Set(products.filter(p => p.color === materialConfig.filterValue).map(p => p.category))];
        updateSidebar(categoriesInScope, catParam, subParam);
    }

    // Standard Product Rendering (Pagination)
    const start = 0;
    const end = currentPage * ITEMS_PER_PAGE;

    console.log('Filtered Products Count:', currentFilteredProducts.length);
    console.log('Scope Products Count:', scopeProducts.length);

    const itemsToShow = currentFilteredProducts.slice(start, end);

    if (itemsToShow.length === 0) {
        grid.innerHTML = '<p class="col-span-4 text-center text-muted">No products found.</p>';
        removeLoadMore();
        return;
    }

    if (reset) {
        grid.innerHTML = itemsToShow.map(createProductCard).join('');
    } else {
        const newStart = (currentPage - 1) * ITEMS_PER_PAGE;
        const newItems = currentFilteredProducts.slice(newStart, end);
        grid.insertAdjacentHTML('beforeend', newItems.map(createProductCard).join(''));
    }

    if (end < currentFilteredProducts.length) {
        if (!document.getElementById('load-more-btn')) createLoadMoreButton();
    } else {
        removeLoadMore();
    }
}


function updateSidebar(categories, parentCat, activeSub) {
    // Locate the sidebar category list
    // This assumes catalog.html has a sidebar list with specific class or ID.
    // If not, we might need to target '.category-list'
    const list = document.querySelector('.category-list'); // You might need to check your HTML for this
    if (!list) return;

    // We only want to update the sidebar if we are in a "Material" mode
    // Clear list? Or just append? 
    // Best: Re-render the relevant section.

    // Simplified Sidebar Logic:
    // Just list the categories found.
    const html = categories.map(cat => {
        const isActive = (cat === activeSub) ? 'text-gold' : 'text-muted';
        const display = cat.charAt(0).toUpperCase() + cat.slice(1);
        return `
            <li>
                <a href="catalog.html?cat=${parentCat}&sub=${cat}" class="${isActive} hover:text-white transition-colors">
                    ${display}
                </a>
            </li>
        `;
    }).join('');

    list.innerHTML = html;
}

function createLoadMoreButton() {
    if (document.getElementById('load-more-btn')) return;
    const grid = document.getElementById('product-grid');
    const btnContainer = document.createElement('div');
    btnContainer.id = 'load-more-container';
    btnContainer.className = 'col-span-4 text-center mt-4';
    btnContainer.style.width = '100%';
    btnContainer.style.gridColumn = '1 / -1';
    btnContainer.innerHTML = `<button id="load-more-btn" class="btn btn-primary" style="padding: 10px 30px;">Load More</button>`;
    grid.parentNode.appendChild(btnContainer);
    document.getElementById('load-more-btn').addEventListener('click', () => { currentPage++; renderCatalog(false); });
}

function removeLoadMore() {
    const container = document.getElementById('load-more-container');
    if (container) container.remove();
}

function renderProductDetail() {
    const container = document.getElementById('product-detail-container');
    if (!container) return;

    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');

    if (!id) { container.innerHTML = '<h2 class="text-white">Product not found.</h2>'; return; }
    const product = products.find(p => p.id == id);
    if (!product) { container.innerHTML = '<h2 class="text-white">Product not found.</h2>'; return; }

    document.title = `${product.name} - Alquds Jewelry`;
    const breadCat = document.getElementById('breadcrumb-category');
    const breadProd = document.getElementById('breadcrumb-product');
    if (breadCat) breadCat.innerText = product.category.charAt(0).toUpperCase() + product.category.slice(1);
    if (breadProd) breadProd.innerText = product.name;

    container.innerHTML = `
        <div style="flex: 1; max-width: 500px;">
            <img src="${product.image}" alt="${product.name}" style="width: 100%; border: 1px solid #333; border-radius: 4px;">
        </div>
        <div style="flex: 1; padding-left: 40px;">
            <h1 style="font-size: 2rem; color: white; margin-bottom: 15px;">${product.name}</h1>
            <div style="font-size: 2rem; color: var(--color-gold); margin-bottom: 30px; font-weight: bold;">$${product.price ? product.price.toLocaleString() : 'N/A'}</div>
            <div style="background: #1a1a1a; padding: 20px; border: 1px solid #333; margin-bottom: 25px;">
                <table style="width: 100%; border-collapse: collapse;">
                    <tr style="border-bottom: 1px solid #333;"><td style="padding: 12px 0; color: var(--color-text-muted); font-size: 0.9rem;">Purity:</td><td style="padding: 12px 0; color: white; text-align: right; font-weight: 500;">${product.karat} Karats</td></tr>
                    <tr style="border-bottom: 1px solid #333;"><td style="padding: 12px 0; color: var(--color-text-muted); font-size: 0.9rem;">Weight:</td><td style="padding: 12px 0; color: white; text-align: right; font-weight: 500;">${product.weight} ${product.weight === 'Varies' ? '' : 'Gms'}</td></tr>
                    <tr><td style="padding: 12px 0; color: var(--color-text-muted); font-size: 0.9rem;">Item No.:</td><td style="padding: 12px 0; color: var(--color-gold); text-align: right; font-weight: 500;">${product.itemNo || product.id || 'N/A'}</td></tr>
                </table>
            </div>
            <div class="flex items-center gap-4" style="margin-bottom: 25px;">
                <label class="text-muted" style="font-size: 0.9rem;">Quantity:</label>
                <input type="number" value="1" min="1" id="quantity-${product.id}" style="width: 80px; padding: 10px; background: #222; border: 1px solid #333; color: white; text-align: center;">
            </div>
            <button onclick="addToCart('${product.id}')" class="btn btn-primary" style="width: 100%; padding: 18px; font-size: 1rem; margin-bottom: 20px;"><i class="fa-solid fa-shopping-bag" style="margin-right: 8px;"></i> ADD TO CART</button>
            <div style="margin-top: 40px;">
                <p class="text-muted" style="line-height: 1.8;">${product.description || 'No description available.'}</p>
            </div>
        </div>
    `;
}

document.addEventListener('DOMContentLoaded', initApp);
