// Cart State
let cart = JSON.parse(localStorage.getItem('alquds_cart')) || [];
let products = []; // Will be loaded from JSON
let pricingConfig = {};

// Helper: Calculate Price dynamically
function calculatePrice(item, config) {
    if (item.weight === "Varies" || item.weight === "N/A" || !item.isDynamic) {
        return item.fixedPrice || 0;
    }

    const purityFactor = item.karat / 24;
    const rawPricePerGram = (config.spotPrice24kOunce / config.gramsPerOunce) * purityFactor;
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
function addToCart(id) {
    const product = products.find(p => p.id === id);
    if (!product) return;

    const existingItem = cart.find(item => item.id === id);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ ...product, quantity: 1 });
    }

    localStorage.setItem('alquds_cart', JSON.stringify(cart));
    updateCartCount();
    alert(`${product.name} added to cart!`);
}

// Pagination State
let currentPage = 1;
const ITEMS_PER_PAGE = 24;
let currentFilteredProducts = [];

// Render Product Card HTML
function createProductCard(product) {
    return `
        <div class="product-card">
            <div style="position: relative; overflow: hidden;">
                <a href="product.html?id=${product.id}" style="display: block;">
                    <img src="${product.image}" alt="${product.name}" class="product-image" loading="lazy">
                </a>
                <button onclick="addToCart(${product.id})" style="position: absolute; bottom: 10px; right: 10px; background: white; border: none; padding: 10px; border-radius: 50%; cursor: pointer; box-shadow: 0 2px 5px rgba(0,0,0,0.3); z-index: 5;">
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

// Highlight Active Navigation Link
function setActiveNavLink() {
    const currentPath = window.location.pathname;
    const urlParams = new URLSearchParams(window.location.search);
    const category = urlParams.get('cat');
    const navLinks = document.querySelectorAll('.nav-link');

    navLinks.forEach(link => {
        link.classList.remove('active');
        const href = link.getAttribute('href');

        if (category) {
            // Match category links
            if (href.includes(`cat=${category}`)) {
                link.classList.add('active');
            }
        } else if (currentPath.endsWith('index.html') || currentPath === '/' || currentPath.endsWith('/')) {
            // Match Home link
            if (href === 'index.html') {
                link.classList.add('active');
            }
        } else {
            // Match other static pages (contact, etc)
            if (href && currentPath.endsWith(href) && href !== '#' && href !== 'index.html') {
                link.classList.add('active');
            }
        }
    });
}

// Main Initialization
async function initApp() {
    setActiveNavLink();
    updateCartCount();

    try {
        // 1. Fetch Data
        // Use Root pricing.json
        const [pricingRes, productsRes] = await Promise.all([
            fetch('pricing.json?t=' + new Date().getTime()),
            fetch('data/products.json?t=' + new Date().getTime())
        ]);

        pricingConfig = await pricingRes.json();
        const rawData = await productsRes.json();
        // Handle rawData being array or object
        const rawProducts = Array.isArray(rawData) ? rawData : (rawData.products_list || []);

        // 2. Calculate Prices
        products = rawProducts.map(p => {
            const calculatedPrice = calculatePrice(p, pricingConfig);
            return { ...p, price: calculatedPrice };
        });

        // 3. Render Featured Products (Home)
        const featuredGrid = document.getElementById('featured-products-grid');
        if (featuredGrid) {
            const featured = products.filter(p => p.featured);
            featuredGrid.innerHTML = featured.map(createProductCard).join('');
        }

        // 4. Render Catalog (Catalog Page)
        const catalogGrid = document.getElementById('product-grid');
        if (catalogGrid) {
            renderCatalog();
        }

        // 5. Render Product Detail (Single Product Page)
        renderProductDetail();

    } catch (error) {
        console.error("Error loading jewelry data:", error);
        // Error handling for all grids
        const ids = ['featured-products-grid', 'product-grid', 'product-detail-container'];
        ids.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.innerHTML = '<p class="text-white text-center">Unable to load prices. Please refresh.</p>';
        });
    }
}

// Render Catalog Function (Handles filtering + Pagination)
function renderCatalog(reset = true) {
    const grid = document.getElementById('product-grid');
    const title = document.getElementById('page-title');
    const loadMoreBtn = document.getElementById('load-more-btn');

    if (!grid) return;

    if (reset) {
        currentPage = 1;
        grid.innerHTML = ''; // Clear grid

        // Filter Logic
        const urlParams = new URLSearchParams(window.location.search);
        const category = urlParams.get('cat');

        currentFilteredProducts = products; // Start with all

        if (category) {
            // Update Title
            if (title) {
                if (category === 'coins-bullions') {
                    title.innerText = 'Coins & Bullions';
                } else {
                    title.innerText = category.charAt(0).toUpperCase() + category.slice(1);
                }
            }
            // Filter
            currentFilteredProducts = products.filter(p => p.category === category);
        }
    }

    // Determine slice
    const start = 0;
    const end = currentPage * ITEMS_PER_PAGE;
    const itemsToShow = currentFilteredProducts.slice(start, end);

    // If empty
    if (itemsToShow.length === 0) {
        grid.innerHTML = '<p class="col-span-4 text-center text-muted">No products found in this category.</p>';
        removeLoadMore();
        return;
    }

    // Render Items
    if (reset) {
        grid.innerHTML = itemsToShow.map(createProductCard).join('');
    } else {
        // Append only new items
        const newStart = (currentPage - 1) * ITEMS_PER_PAGE;
        const newItems = currentFilteredProducts.slice(newStart, end);
        const html = newItems.map(createProductCard).join('');
        grid.insertAdjacentHTML('beforeend', html);
    }

    // Manage Load More Button
    if (end < currentFilteredProducts.length) {
        if (!loadMoreBtn) createLoadMoreButton();
    } else {
        removeLoadMore();
    }
}

function createLoadMoreButton() {
    if (document.getElementById('load-more-btn')) return;

    const grid = document.getElementById('product-grid');
    const btnContainer = document.createElement('div');
    btnContainer.id = 'load-more-container';
    btnContainer.className = 'col-span-4 text-center mt-4';
    btnContainer.style.width = '100%';
    btnContainer.style.gridColumn = '1 / -1';
    btnContainer.innerHTML = `
        <button id="load-more-btn" class="btn btn-primary" style="padding: 10px 30px;">Load More</button>
    `;

    grid.parentNode.appendChild(btnContainer);

    document.getElementById('load-more-btn').addEventListener('click', () => {
        currentPage++;
        renderCatalog(false);
    });
}

function removeLoadMore() {
    const container = document.getElementById('load-more-container');
    if (container) container.remove();
}

// Render Product Detail (Single Product Page)
function renderProductDetail() {
    const container = document.getElementById('product-detail-container');
    if (!container) return; // Not on product page

    const urlParams = new URLSearchParams(window.location.search);
    const id = parseInt(urlParams.get('id'));

    if (!id) {
        container.innerHTML = '<h2 class="text-white">Product not found.</h2>';
        return;
    }

    const product = products.find(p => p.id === id);

    if (!product) {
        container.innerHTML = '<h2 class="text-white">Product not found.</h2>';
        return;
    }

    // Update Meta
    document.title = `${product.name} - Alquds Jewelry`;
    const breadCat = document.getElementById('breadcrumb-category');
    const breadProd = document.getElementById('breadcrumb-product');
    if (breadCat) breadCat.innerText = product.category.charAt(0).toUpperCase() + product.category.slice(1);
    if (breadProd) breadProd.innerText = product.name;

    // Render Container
    container.innerHTML = `
        <div style="flex: 1; max-width: 500px;">
            <img src="${product.image}" alt="${product.name}" style="width: 100%; border: 1px solid #333; border-radius: 4px;">
        </div>
        <div style="flex: 1; padding-left: 40px;">
            <h1 style="font-size: 2rem; color: white; margin-bottom: 15px;">${product.name}</h1>
            
            <div style="font-size: 2rem; color: var(--color-gold); margin-bottom: 30px; font-weight: bold;">
                $${product.price ? product.price.toLocaleString() : 'N/A'}
            </div>
            
            <div style="background: #1a1a1a; padding: 20px; border: 1px solid #333; margin-bottom: 25px;">
                <table style="width: 100%; border-collapse: collapse;">
                    <tr style="border-bottom: 1px solid #333;">
                        <td style="padding: 12px 0; color: var(--color-text-muted); font-size: 0.9rem;">Purity:</td>
                        <td style="padding: 12px 0; color: white; text-align: right; font-weight: 500;">${product.karat} Karats</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #333;">
                        <td style="padding: 12px 0; color: var(--color-text-muted); font-size: 0.9rem;">Weight:</td>
                        <td style="padding: 12px 0; color: white; text-align: right; font-weight: 500;">${product.weight} ${product.weight === 'Varies' || typeof product.weight === 'string' ? '' : 'Gms'}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #333;">
                        <td style="padding: 12px 0; color: var(--color-text-muted); font-size: 0.9rem;">Color:</td>
                        <td style="padding: 12px 0; color: white; text-align: right; font-weight: 500;">${product.color || 'Yellow Gold'}</td>
                    </tr>
                    <tr>
                        <td style="padding: 12px 0; color: var(--color-text-muted); font-size: 0.9rem;">Item No.:</td>
                        <td style="padding: 12px 0; color: var(--color-gold); text-align: right; font-weight: 500;">${product.itemNo || 'N/A'}</td>
                    </tr>
                </table>
            </div>
            
            <div class="flex items-center gap-4" style="margin-bottom: 25px;">
                <label class="text-muted" style="font-size: 0.9rem;">Quantity:</label>
                <input type="number" value="1" min="1" id="quantity-${product.id}" 
                    style="width: 80px; padding: 10px; background: #222; border: 1px solid #333; color: white; text-align: center;">
            </div>
            
            <button onclick="addToCart(${product.id})" class="btn btn-primary" style="width: 100%; padding: 18px; font-size: 1rem; margin-bottom: 20px;">
                <i class="fa-solid fa-shopping-bag" style="margin-right: 8px;"></i> ADD TO CART
            </button>
            
            <div style="margin-top: 40px;">
                <div style="border-bottom: 2px solid #333; margin-bottom: 20px;">
                    <button class="tab-btn active" onclick="showTab('description', event)" style="padding: 12px 20px; background: transparent; border: none; color: var(--color-gold); border-bottom: 2px solid var(--color-gold); cursor: pointer; font-size: 0.95rem;">
                        DESCRIPTION
                    </button>
                    <button class="tab-btn" onclick="showTab('shipping', event)" style="padding: 12px 20px; background: transparent; border: none; color: var(--color-text-muted); cursor: pointer; font-size: 0.95rem;">
                        SHIPPING
                    </button>
                </div>
                
                <div id="tab-description" class="tab-content">
                    <p class="text-muted" style="line-height: 1.8;">
                        ${product.description || 'No description available.'}
                    </p>
                </div>
                
                <div id="tab-shipping" class="tab-content" style="display: none;">
                    <p class="text-muted" style="line-height: 1.8;">
                        We offer secure shipping worldwide. Orders are processed within 1-2 business days. 
                        Tracking information will be provided once your order ships. 
                        For high-value items, signature confirmation may be required upon delivery.
                    </p>
                </div>
            </div>
        </div>
    `;
}

// Tab switching function
window.showTab = function (tabName, event) {
    if (!event) return;
    document.querySelectorAll('.tab-content').forEach(tab => tab.style.display = 'none');
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.style.color = 'var(--color-text-muted)';
        btn.style.borderBottom = 'none';
        btn.classList.remove('active');
    });

    document.getElementById('tab-' + tabName).style.display = 'block';
    event.target.style.color = 'var(--color-gold)';
    event.target.style.borderBottom = '2px solid var(--color-gold)';
    event.target.classList.add('active');
}

document.addEventListener('DOMContentLoaded', initApp);
