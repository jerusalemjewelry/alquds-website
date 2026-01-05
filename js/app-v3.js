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

// Render Product Card HTML
function createProductCard(product) {
    return `
        <div class="product-card">
            <div style="position: relative; overflow: hidden;">
                <a href="product.html?id=${product.id}" style="display: block;">
                    <img src="${product.image}" alt="${product.name}" class="product-image">
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
const rawProducts = rawData.products_list || [];

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

    } catch (error) {
        console.error("Error loading jewelry data:", error);
        const featuredGrid = document.getElementById('featured-products-grid');
        if (featuredGrid) featuredGrid.innerHTML = '<p class="text-white text-center">Unable to load prices. Please refresh.</p>';
        const catalogGrid = document.getElementById('product-grid');
        if (catalogGrid) catalogGrid.innerHTML = '<p class="col-span-4 text-center text-muted">Unable to load prices.</p>';
    }
}

// Render Catalog Function (Handles filtering)
function renderCatalog() {
    const grid = document.getElementById('product-grid');
    const title = document.getElementById('page-title');
    if (!grid) return;

    const urlParams = new URLSearchParams(window.location.search);
    const category = urlParams.get('cat');
    const sub = urlParams.get('sub');

    let filteredProducts = products;

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
        filteredProducts = products.filter(p => p.category === category);
    }

    if (filteredProducts.length === 0) {
        grid.innerHTML = '<p class="col-span-4 text-center text-muted">No products found in this category.</p>';
    } else {
        grid.innerHTML = filteredProducts.map(createProductCard).join('');
    }
}

document.addEventListener('DOMContentLoaded', initApp);

