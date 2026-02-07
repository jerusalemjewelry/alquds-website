// Cart State
let cart = JSON.parse(localStorage.getItem('alquds_cart')) || [];
let products = [];
let pricingConfig = {};
let minPriceFilter = 0;
let maxPriceFilter = 100000;



// Config: Map URL 'cat' to Product Data Properties
const MATERIAL_MAP = {
    'yellow-gold': { filterField: 'color', filterValue: 'Yellow Gold', label: 'Yellow Gold' },
    'white-gold': { filterField: 'color', filterValue: 'White Gold', label: 'White Gold' },
    'silver': { filterField: 'color', filterValue: 'Silver', label: 'Silver Jewelry' },
    'diamonds': { filterField: 'category', filterValue: 'diamonds', label: 'Diamond Jewelry' },
    'coins-bullions': { filterField: 'category', filterValue: 'coins-bullions', label: 'Coins & Bullions' }
};

// Defined Categories for Grid View
const YELLOW_GOLD_CATS = [
    { id: 'necklaces', label: 'Necklace Sets', image: 'assets/cat_necklaces.png' },
    { id: 'bangles', label: 'Bangles', image: 'assets/cat_bangles.png' },
    { id: 'chains', label: 'Chains', image: 'assets/cat_chains.png' },
    { id: 'rings', label: 'Rings', image: 'assets/cat_rings.png' },
    { id: 'earrings', label: 'Earrings', image: 'assets/cat_earrings.png' },
    { id: 'bracelets', label: 'Bracelets', image: 'assets/cat_bracelets.png' },
    { id: 'pendants', label: 'Pendants', image: 'assets/cat_pendants.png' },
    { id: 'coins', label: 'Frames', image: 'assets/cat_coins_v2.png' },
    { id: 'anklets', label: 'Anklets', image: 'assets/cat_anklets.png' },
    { id: 'children', label: 'Children', image: 'assets/cat_children.png' },
    { id: 'kladas', label: 'Kladas', image: 'assets/cat_kladas.png' },
    { id: 'bands', label: 'Bands', image: 'assets/cat_mens.png' },
    { id: 'belts', label: 'Belts', image: 'assets/cat_belts.png' },
    { id: 'name-plates', label: 'Name Plates', image: 'assets/cat_name_plates.png' },
    { id: 'chokers', label: 'Chokers', image: 'assets/cat_chokers.png' }
];

// Helper: Calculate Price dynamically
function calculatePrice(item, config) {
    if (item.weight === "Varies" || item.weight === "N/A" || !item.isDynamic) {
        return item.fixedPrice || 0;
    }

    // Default to 31.1035 if missing from JSON (Admin might not save it)
    const gramsPerOunce = config.gramsPerOunce || 31.1035;

    // Special Logic for Coins & Bullions
    if (item.category === 'coins-bullions') {
        let spotPrice = config.spotPrice24kOunce;
        let purityFactor = 1;

        if (item.metal === 'Silver') {
            spotPrice = config.silverPriceOunce;
            // Silver is usually .999 fine (investment grade), so factor is 1. 
            // If it's Sterling (.925), we could handle that, but for bullion it's usually fine.
            purityFactor = 1;
        } else if (item.metal === 'Platinum') {
            spotPrice = config.platinumPriceOunce;
            purityFactor = 1;
        } else {
            // Default to Gold
            const karat = item.karat || 24;
            purityFactor = karat / 24;
        }

        const premium = item.premium || 0;

        // Calculate Base Metal Value (Adjusted)
        let baseValue = 0;
        const weightVal = parseFloat(item.weight);

        // Adjusted Spot Price per Ounce
        const adjustedSpot = spotPrice * purityFactor;

        if (item.unit === 'oz') {
            baseValue = adjustedSpot * weightVal;
        } else {
            // Grams
            baseValue = (adjustedSpot / gramsPerOunce) * weightVal;
        }

        // Final Price = Base Metal Value + Flat Premium
        return Math.ceil(baseValue + premium);
    }

    const purityFactor = item.karat / 24;
    const rawPricePerGram = (config.spotPrice24kOunce / gramsPerOunce) * purityFactor;
    const priceWithMargin = rawPricePerGram * (1 + (item.marginPercent / 100));
    const priceWithLabor = priceWithMargin + item.laborPerGram;
    const finalPrice = priceWithLabor * parseFloat(item.weight);

    return Math.ceil(finalPrice);
}

// Update Cart Count UI and Render Mini Cart
function updateCartCount() {
    // Ensure mini cart HTML exists (Injection)
    injectMiniCart();

    const count = cart.reduce((acc, item) => acc + item.quantity, 0);
    const badge = document.getElementById('cart-count');
    if (badge) badge.innerText = count;

    renderMiniCart();
}

// Inject Mini Cart HTML Structure if missing
function injectMiniCart() {
    if (document.getElementById('mini-cart')) return;

    // Locate the Cart Link
    const cartLink = document.querySelector('a[href="cart.html"]');
    if (!cartLink) return;

    // Only inject if not already wrapped properly (check parent)
    if (!cartLink.parentElement.classList.contains('cart-wrapper')) {
        // Create Wrapper
        const wrapper = document.createElement('div');
        wrapper.className = 'cart-wrapper';

        // Move Link into Wrapper
        cartLink.parentNode.insertBefore(wrapper, cartLink);
        wrapper.appendChild(cartLink);

        // Create Dropdown
        const dropdown = document.createElement('div');
        dropdown.id = 'mini-cart';
        dropdown.className = 'mini-cart';
        // HTML Structure inside
        dropdown.innerHTML = `
            <div class="mini-cart-header">
                <span>SHOPPING BAG</span>
                <span id="mini-cart-count">0 ITEMS</span>
            </div>
            <div id="mini-cart-items" class="mini-cart-items">
                <!-- Items injected here -->
            </div>
            <div id="mini-cart-footer" class="mini-cart-footer">
                <div class="mini-cart-total">
                    <span>TOTAL:</span>
                    <span id="mini-cart-total">$0.00</span>
                </div>
                <a href="cart.html" class="btn btn-primary" style="width: 100%; display: block; text-align: center; padding: 10px;">VIEW CART & CHECKOUT</a>
            </div>
        `;
        wrapper.appendChild(dropdown);
    }
}

// Render Mini Cart Contents
function renderMiniCart() {
    const list = document.getElementById('mini-cart-items');
    const totalEl = document.getElementById('mini-cart-total');
    const countEl = document.getElementById('mini-cart-count');

    if (!list) return;

    if (cart.length === 0) {
        list.innerHTML = '<p class="text-muted text-center py-4">Your bag is empty.</p>';
        if (totalEl) totalEl.innerText = '$0.00';
        if (countEl) countEl.innerText = '0 ITEMS';
        document.getElementById('mini-cart-footer').style.display = 'none';
        return;
    }

    document.getElementById('mini-cart-footer').style.display = 'block';

    let total = 0;
    let totalQty = 0;

    const itemsHTML = cart.map(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        totalQty += item.quantity;
        return `
            <div class="mini-cart-item">
                <a href="product.html?id=${item.id}">
                    <img src="${item.image}" class="mini-cart-img" alt="${item.name}">
                </a>
                <div class="mini-cart-details">
                    <div class="mini-cart-title"><a href="product.html?id=${item.id}" class="hover-gold">${item.name}</a></div>
                    <div class="text-muted" style="font-size: 0.8rem;">${item.quantity} x $${item.price.toLocaleString()}</div>
                </div>
                <!-- Remove via mini cart? maybe later. Just show summary for now -->
            </div>
        `;
    }).join('');

    list.innerHTML = itemsHTML;
    if (totalEl) totalEl.innerText = '$' + total.toLocaleString();
    if (countEl) countEl.innerText = totalQty + (totalQty === 1 ? ' ITEM' : ' ITEMS');
}

// Add to Cart Function
function addToCart(id) {
    const product = products.find(p => p.id == id);
    if (!product) return;

    // Check if out of stock
    if (product.outOfStock) {
        showToast("Sorry, this item is out of stock.");
        return;
    }

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
let currentFilteredProducts = [];

// Create Product Card HTML
// Create Product Card HTML
function createProductCard(product) {
    const isOutOfStock = product.outOfStock === true;
    const cardClass = isOutOfStock ? 'product-card out-of-stock' : 'product-card';
    const overlayHTML = isOutOfStock ?
        `<div class="out-of-stock-overlay"><span class="badge-out-of-stock">Out of Stock</span></div>` : '';

    // Disable button if out of stock
    // Disable button if out of stock
    const btnAction = isOutOfStock ? 'disabled' : `onclick="addToCart('${product.id}')"`;
    // Use Class for Styling
    const btnClass = isOutOfStock ? 'add-to-cart-btn btn-disabled' : 'add-to-cart-btn';
    const iconClass = isOutOfStock ? 'fa-solid fa-ban' : 'fa-solid fa-plus';

    return `
        <div class="${cardClass}">
            <div style="position: relative; overflow: hidden;">
                <a href="product.html?id=${product.id}" style="display: block;">
                    ${overlayHTML}
                    <img src="${product.image}" alt="${product.name}" class="product-image" loading="lazy">
                </a>
                <button ${btnAction} class="${btnClass}">
                    <i class="${iconClass}"></i>
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

// Create Category Card HTML
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
        // 1. Fetch Data
        const pricingRes = await fetch('data/pricing.json?t=' + new Date().getTime());
        pricingConfig = await pricingRes.json();

        // Fetch all category files dynamically
        const categoryFiles = [
            'bangles', 'chains', 'earrings', 'rings', 'name-plates', 'white-gold',
            'bands', 'coins', 'kladas', 'necklaces', 'children',
            'anklets', 'bracelets', 'pendants', 'belts', 'chokers', 'frames',
            'diamonds', 'coins-bullions', 'silver'
        ];

        const productPromises = categoryFiles.map(cat =>
            fetch(`data/products/${cat}.json?t=${new Date().getTime()}`)
                .then(res => {
                    if (!res.ok) return { products_list: [] };
                    return res.json();
                })
                .catch(e => ({ products_list: [] }))
        );

        const productsResults = await Promise.all(productPromises);
        const rawProducts = productsResults.flatMap(data => data.products_list || []);


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

const ITEMS_PER_PAGE = 12;

// ... (other code)

function renderCatalog(reset = true) {
    const grid = document.getElementById('product-grid');
    const title = document.getElementById('page-title');

    if (!grid) return;

    // Enforce 4 Columns Layout for all views as requested
    // Responsive Grid: 2 columns on mobile, 4 on desktop
    // Responsive Grid: Force 2 columns on mobile for Product Grid (Catalog)
    // This allows the catalog to keep the 2-column layout the user wants
    if (window.innerWidth < 768) {
        grid.style.gridTemplateColumns = 'repeat(2, 1fr)';
    } else {
        grid.style.gridTemplateColumns = 'repeat(4, 1fr)';
    }

    if (reset) {
        currentPage = 1;
        grid.innerHTML = '';
    }

    const urlParams = new URLSearchParams(window.location.search);
    const catParam = urlParams.get('cat');
    const subParam = urlParams.get('sub');
    const searchParam = urlParams.get('search');

    let scopeProducts = products;
    let pageLabel = 'Catalog';
    let materialConfig = null;
    let isMaterialRoot = false;

    if (searchParam) {
        const term = searchParam.trim().toLowerCase();
        scopeProducts = products.filter(p => {
            // Tokenize search term for smarter matching
            const searchTerms = term.split(/\s+/).filter(t => t.length > 0);

            // searchable string combining all relevant fields
            const productText = [
                p.name,
                String(p.id),
                String(p.itemNo),
                p.category,
                p.description,
                p.color
            ].join(' ').toLowerCase();

            // Check if ALL search terms are present in the product text
            return searchTerms.every(t => productText.includes(t));
        });
        pageLabel = `Search Results: "${searchParam}"`;
        currentFilteredProducts = scopeProducts;
        if (title) title.innerText = pageLabel;
    } else {
        materialConfig = MATERIAL_MAP[catParam];
        if (materialConfig) {
            scopeProducts = products.filter(p => {
                if (materialConfig.filterField === 'color') {
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

        isMaterialRoot = (materialConfig && materialConfig.filterField === 'color' && !subParam);

        if (isMaterialRoot) {
            if (title) title.innerText = pageLabel + ' Collections';
            let catHTML = '';

            if (catParam === 'yellow-gold') {
                // Hide Filter Sidebar for Yellow Gold Main Page
                const sidebar = document.querySelector('aside');
                if (sidebar) sidebar.style.display = 'none';

                catHTML = YELLOW_GOLD_CATS.map(cat => {
                    // Use the predefined category image to ensure consistency
                    return createCategoryCard(cat.id, cat.image, catParam, cat.label);
                }).join('');
                grid.innerHTML = catHTML;
                removeLoadMore();
                return;
            }

            // Show Sidebar for other pages (if hidden previously)
            const sidebar = document.querySelector('aside');
            if (sidebar) sidebar.style.display = 'block';

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

        if (subParam) {
            currentFilteredProducts = scopeProducts.filter(p => p.category === subParam);
            pageLabel += ' - ' + subParam.charAt(0).toUpperCase() + subParam.slice(1);
        } else {
            currentFilteredProducts = scopeProducts;
        }

        if (title) title.innerText = pageLabel;
    }

    if (materialConfig && materialConfig.filterField === 'color') {
        const categoriesInScope = [...new Set(products.filter(p => p.color === materialConfig.filterValue).map(p => p.category))];
        updateSidebar(categoriesInScope, catParam, subParam);
    }

    // Apply Price Filter
    if (!isMaterialRoot) { // Don't filter category cards
        currentFilteredProducts = currentFilteredProducts.filter(p => {
            const price = p.price || 0;
            return price >= minPriceFilter && price <= maxPriceFilter;
        });
    }

    const start = 0;
    const end = currentPage * ITEMS_PER_PAGE;
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
    const list = document.querySelector('.category-list');
    if (!list) return;

    // Use the predefined categories to ensure specific order and labels
    // This restores the full list similar to the hardcoded version the user prefers
    const html = YELLOW_GOLD_CATS.map(cat => {
        const isActive = (cat.id === activeSub) ? 'text-gold' : 'text-muted';
        return `
            <li>
                <a href="catalog.html?cat=${parentCat}&sub=${cat.id}" class="${isActive} hover:text-white transition-colors">
                    ${cat.label}
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

    if (!id) { container.innerHTML = '<h2 class="text-white">Product not found (No ID provided).</h2>'; return; }

    // Normalize ID for comparison
    const searchId = id.trim();

    // Find product - Robust comparison
    let product = products.find(p => String(p.id).trim() === searchId);

    // Fallback: Try finding by Item No if ID lookup fails
    if (!product) {
        product = products.find(p => String(p.itemNo).trim() === searchId);
    }

    if (!product) {
        console.error(`Product not found. Searched for ID: "${searchId}" in ${products.length} products.`);
        container.innerHTML = `<h2 class="text-white">Product not found. (ID: ${searchId})</h2><p class="text-muted">Please check if the product exists in the database.</p>`;
        return;
    }

    document.title = `${product.name} - Alquds Jewelry`;
    const breadCat = document.getElementById('breadcrumb-category');
    const breadProd = document.getElementById('breadcrumb-product');
    if (breadCat) breadCat.innerText = product.category.charAt(0).toUpperCase() + product.category.slice(1);
    if (breadProd) breadProd.innerText = product.name;

    const isOutOfStock = product.outOfStock === true;
    const btnHTML = isOutOfStock
        ? `<button disabled class="btn btn-primary btn-disabled" style="width: 100%; padding: 18px; font-size: 1rem; margin-bottom: 20px;"><i class="fa-solid fa-ban" style="margin-right: 8px;"></i> OUT OF STOCK</button>`
        : `<button onclick="addToCart('${product.id}')" class="btn btn-primary" style="width: 100%; padding: 18px; font-size: 1rem; margin-bottom: 20px;"><i class="fa-solid fa-shopping-bag" style="margin-right: 8px;"></i> ADD TO CART</button>`;

    container.innerHTML = `
        <div class="pd-image-col">
            <div style="position: relative;">
                ${isOutOfStock ? `<div class="out-of-stock-overlay" style="border-radius: 4px;"><span class="badge-out-of-stock" style="font-size: 1.2rem; padding: 10px 20px;">Out of Stock</span></div>` : ''}
                <img src="${product.image}" alt="${product.name}" style="width: 100%; border: 1px solid #333; border-radius: 4px; ${isOutOfStock ? 'filter: grayscale(100%); opacity: 0.6;' : ''}">
            </div>
        </div>
        <div class="pd-info-col">
            <h1 class="pd-title">${product.name}</h1>
            <div class="pd-price">$${product.price ? product.price.toLocaleString() : 'N/A'}</div>
            <div style="background: #1a1a1a; padding: 20px; border: 1px solid #333; margin-bottom: 25px;">
                <table style="width: 100%; border-collapse: collapse;">
                    ${product.category === 'coins-bullions' ?
            `<tr><td style="padding: 12px 0; color: var(--color-text-muted); font-size: 0.9rem;">Item No.:</td><td style="padding: 12px 0; color: var(--color-gold); text-align: right; font-weight: 500;">${product.itemNo || product.id || 'N/A'}</td></tr>`
            :
            `<tr style="border-bottom: 1px solid #333;"><td style="padding: 12px 0; color: var(--color-text-muted); font-size: 0.9rem;">Purity:</td><td style="padding: 12px 0; color: white; text-align: right; font-weight: 500;">${product.karat} Karats</td></tr>
                         <tr style="border-bottom: 1px solid #333;"><td style="padding: 12px 0; color: var(--color-text-muted); font-size: 0.9rem;">Weight:</td><td style="padding: 12px 0; color: white; text-align: right; font-weight: 500;">${product.weight} ${product.weight === 'Varies' ? '' : 'Gms'}</td></tr>
                         <tr><td style="padding: 12px 0; color: var(--color-text-muted); font-size: 0.9rem;">Item No.:</td><td style="padding: 12px 0; color: var(--color-gold); text-align: right; font-weight: 500;">${product.itemNo || product.id || 'N/A'}</td></tr>`
        }
                </table>
            </div>
            <div class="flex items-center gap-4" style="margin-bottom: 25px;">
                <label class="text-muted" style="font-size: 0.9rem;">Quantity:</label>
                <input type="number" value="1" min="1" id="quantity-${product.id}" ${isOutOfStock ? 'disabled' : ''} style="width: 80px; padding: 10px; background: #222; border: 1px solid #333; color: white; text-align: center; ${isOutOfStock ? 'opacity: 0.5; cursor: not-allowed;' : ''}">
            </div>
            ${btnHTML}
            <div style="margin-top: 40px;">
                <p class="text-muted" style="line-height: 1.8;">${product.description || 'No description available.'}</p>
            </div>
        </div>
    `;
}

function setupPriceFilter() {
    const rangeMin = document.getElementById('range-min');
    const rangeMax = document.getElementById('range-max');
    const displayMin = document.getElementById('price-min-val');
    const displayMax = document.getElementById('price-max-val');
    const activeTrack = document.getElementById('slider-track-active');
    const filterBtn = document.getElementById('btn-filter-price');

    if (!rangeMin || !rangeMax || !filterBtn) return;

    const minGap = 500;
    const sliderMaxValue = parseInt(rangeMax.max);

    function updateSlider() {
        let val1 = parseInt(rangeMin.value);
        let val2 = parseInt(rangeMax.value);

        if (val2 - val1 < minGap) {
            if (this === rangeMin) {
                rangeMin.value = val2 - minGap;
            } else {
                rangeMax.value = val1 + minGap;
            }
        } else {
            displayMin.textContent = val1.toLocaleString();
            displayMax.textContent = val2.toLocaleString();

            const percent1 = (val1 / sliderMaxValue) * 100;
            const percent2 = (val2 / sliderMaxValue) * 100;

            activeTrack.style.left = percent1 + "%";
            activeTrack.style.right = (100 - percent2) + "%";
        }
    }

    rangeMin.addEventListener('input', updateSlider);
    rangeMax.addEventListener('input', updateSlider);

    filterBtn.addEventListener('click', () => {
        minPriceFilter = parseInt(rangeMin.value);
        maxPriceFilter = parseInt(rangeMax.value);
        renderCatalog(); // Re-render with new filter
    });

    updateSlider(); // Init visuals
}

document.addEventListener('DOMContentLoaded', () => {
    initApp();
    setupPriceFilter();
});
