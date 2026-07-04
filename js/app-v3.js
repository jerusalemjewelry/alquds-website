// Dynamic CSS Injection for Ring Sizer Hover Animations
(function() {
    const style = document.createElement('style');
    style.textContent = `
        .ring-sizer-link-integrated, .necklace-sizer-link-integrated {
            color: #ffffff !important;
            font-size: 1.1rem !important;
            font-weight: 600 !important;
            text-decoration: none !important;
            display: inline-flex !important;
            align-items: center !important;
            gap: 8px !important;
            transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1) !important;
            border: none !important;
            background: none !important;
            cursor: pointer !important;
            position: relative !important;
            padding: 4px 0 !important;
        }
        .ring-sizer-link-integrated i, .necklace-sizer-link-integrated i {
            transition: transform 0.3s ease !important;
            color: #ffffff !important;
        }
        .ring-sizer-link-integrated:hover, .necklace-sizer-link-integrated:hover {
            color: var(--color-gold, #DAA520) !important;
            transform: scale(1.04) !important;
            text-shadow: 0 0 8px rgba(212, 175, 55, 0.4) !important;
        }
        .ring-sizer-link-integrated:hover i, .necklace-sizer-link-integrated:hover i {
            transform: rotate(15deg) scale(1.1) !important;
            color: var(--color-gold, #DAA520) !important;
        }
        .ring-sizer-link-integrated::after, .necklace-sizer-link-integrated::after {
            content: '' !important;
            position: absolute !important;
            bottom: -2px !important;
            left: 0 !important;
            width: 100% !important;
            height: 1.5px !important;
            background-color: var(--color-gold, #DAA520) !important;
            transform: scaleX(0) !important;
            transform-origin: right !important;
            transition: transform 0.3s ease !important;
        }
        .ring-sizer-link-integrated:hover::after, .necklace-sizer-link-integrated:hover::after {
            transform: scaleX(1) !important;
            transform-origin: left !important;
        }
        #catalog-sizer-link {
            display: none !important;
        }
        @media (max-width: 768px) {
            #catalog-sizer-link {
                display: flex !important;
            }
        }
        .karat-filter-checkbox {
            -webkit-appearance: none !important;
            -moz-appearance: none !important;
            appearance: none !important;
            width: 8px !important;
            height: 8px !important;
            border: 1px solid #555 !important;
            border-radius: 50% !important;
            outline: none !important;
            cursor: pointer !important;
            transition: all 0.25s ease !important;
            display: inline-block !important;
            position: relative !important;
            background: #111115 !important;
            margin: 0 !important;
            flex-shrink: 0 !important;
            vertical-align: middle !important;
        }
        .karat-filter-checkbox:checked {
            border-color: var(--color-gold, #DAA520) !important;
            background: var(--color-gold, #DAA520) !important;
        }
        .karat-filter-checkbox:checked::after {
            content: '' !important;
            position: absolute !important;
            top: 50% !important;
            left: 50% !important;
            transform: translate(-50%, -50%) !important;
            width: 2px !important;
            height: 2px !important;
            border-radius: 50% !important;
            background: #000000 !important;
        }
        .karat-filter-label {
            transition: color 0.25s ease !important;
        }
        .karat-filter-label:hover {
            color: #ffffff !important;
        }
        .karat-filter-label:hover .karat-filter-checkbox {
            border-color: var(--color-gold, #DAA520) !important;
        }
        .sidebar-category-link {
            display: flex !important;
            align-items: center !important;
            gap: 10px !important;
            color: #94a3b8 !important;
            text-decoration: none !important;
            font-size: 0.95rem !important;
            font-family: var(--font-body) !important;
            transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1) !important;
            padding: 6px 10px !important;
            border-radius: 4px !important;
            border-left: 2px solid transparent !important;
            background: transparent !important;
        }
        .sidebar-category-link:hover {
            color: #ffffff !important;
            padding-left: 15px !important;
            background: rgba(255, 255, 255, 0.02) !important;
            border-left-color: var(--color-gold, #DAA520) !important;
        }
        .sidebar-category-link.active {
            color: var(--color-gold, #DAA520) !important;
            font-weight: 600 !important;
            background: rgba(212, 175, 55, 0.05) !important;
            border-left-color: var(--color-gold, #DAA520) !important;
            padding-left: 15px !important;
        }
        .sidebar-category-link::before {
            content: '•' !important;
            color: var(--color-gold, #DAA520) !important;
            opacity: 0 !important;
            transition: opacity 0.3s ease !important;
            margin-right: -4px !important;
        }
        .sidebar-category-link:hover::before, .sidebar-category-link.active::before {
            opacity: 1 !important;
        }
    `;
    document.head.appendChild(style);
})();

// Cart State
let cart = JSON.parse(localStorage.getItem('alquds_cart')) || [];
let products = [];
let pricingConfig = {};
let minPriceFilter = 0;
let maxPriceFilter = 100000;

// Helper: Get Random Items from Array
function getRandomItems(array, count) {
    const shuffled = [...array].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(count, array.length));
}



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
    { id: 'bangle-sets', label: 'Bangle Sets', image: 'assets/cat_bangle_sets.png' },
    { id: 'chains', label: 'Chains', image: 'assets/cat_chains.png' },
    { id: 'rings', label: 'Rings', image: 'assets/cat_rings.png' },
    { id: 'earrings', label: 'Earrings', image: 'assets/cat_earrings.png' },
    { id: 'bracelets', label: 'Bracelets', image: 'assets/cat_bracelets.png' },
    { id: 'pendants', label: 'Pendants', image: 'assets/cat_pendants.png' },
    { id: 'frames', label: 'Frames', image: 'assets/cat_coins_v2.png' },
    { id: 'anklets', label: 'Anklets', image: 'assets/cat_anklets.png' },
    { id: 'children', label: 'Children', image: 'assets/cat_children.png' },
    { id: 'kladas', label: 'Kladas', image: 'assets/cat_kladas.png' },
    { id: 'bands', label: 'Bands', image: 'assets/cat_mens.png' },
    { id: 'belts', label: 'Belts', image: 'assets/cat_belts.png' },
    { id: 'name-plates', label: 'Name Plates', image: 'assets/cat_name_plates.png' },
    { id: 'chokers', label: 'Chokers', image: 'assets/cat_chokers.png' },
    { id: 'long-necklaces', label: 'Long Necklaces', image: 'assets/cat_yg_long_necklaces.png' }
];

const WHITE_GOLD_CATS = [
    { id: 'necklaces', label: 'Necklace Sets', image: 'assets/cat_wg_necklaces.png' },
    { id: 'bangles', label: 'Bangles', image: 'assets/cat_wg_bangles.png' },
    { id: 'bangle-sets', label: 'Bangle Sets', image: 'assets/cat_wg_bangle_sets.png' },
    { id: 'chains', label: 'Chains', image: 'assets/cat_wg_chains.png' },
    { id: 'rings', label: 'Rings', image: 'assets/cat_wg_rings.png' },
    { id: 'earrings', label: 'Earrings', image: 'assets/cat_wg_earrings.png' },
    { id: 'bracelets', label: 'Bracelets', image: 'assets/cat_wg_bracelets.png' },
    { id: 'pendants', label: 'Pendants', image: 'assets/cat_wg_pendants.png' }
];

const SILVER_CATS = [
    { id: 'rings', label: 'Rings', image: 'assets/cat_sv_rings.png' },
    { id: 'bands', label: 'Bands', image: 'assets/cat_sv_bands.png' },
    { id: 'pendants', label: 'Pendants', image: 'assets/cat_sv_pendants.png' },
    { id: 'bracelets', label: 'Bracelets', image: 'assets/cat_sv_bracelets.png' },
    { id: 'chains', label: 'Chains', image: 'assets/cat_sv_chains.png' },
    { id: 'women', label: 'Women', image: 'assets/cat_sv_women.png' }
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

// Inject Mini Cart/Sidebar Drawer HTML Structure if missing
function injectCartDrawer() {
    if (document.getElementById('cart-drawer')) return;

    // Create Drawer CSS Styles
    const styleId = 'cart-drawer-styles';
    if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.innerHTML = `
            /* Drawer Overlay/Backdrop */
            .cart-drawer-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.7);
                backdrop-filter: blur(4px);
                z-index: 99998;
                opacity: 0;
                visibility: hidden;
                transition: opacity 0.4s ease, visibility 0.4s ease;
            }
            .cart-drawer-overlay.open {
                opacity: 1;
                visibility: visible;
            }

            /* Drawer Panel */
            .cart-drawer {
                position: fixed;
                top: 0;
                right: -460px; /* Hidden initially offscreen */
                width: 460px;
                max-width: 100%;
                height: 100%;
                background: #111;
                border-left: 1px solid #222;
                box-shadow: -10px 0 30px rgba(0, 0, 0, 0.9);
                z-index: 99999;
                display: flex;
                flex-direction: column;
                transition: right 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
                color: white;
                font-family: var(--font-body);
            }
            .cart-drawer.open {
                right: 0;
            }

            /* Header */
            .cart-drawer-header {
                padding: 20px;
                border-bottom: 1px solid #222;
                display: flex;
                justify-content: space-between;
                align-items: center;
                background: #090909;
            }
            .cart-drawer-header h3 {
                margin: 0;
                font-size: 1.1rem;
                font-weight: 500;
                letter-spacing: 2px;
                color: var(--color-gold);
            }
            .cart-drawer-close {
                background: none;
                border: none;
                color: #aaa;
                font-size: 1.5rem;
                cursor: pointer;
                transition: color 0.2s;
            }
            .cart-drawer-close:hover {
                color: white;
            }

            /* Body/Items Container */
            .cart-drawer-body {
                flex: 1;
                overflow-y: auto;
                padding: 20px;
                display: flex;
                flex-direction: column;
                gap: 20px;
            }

            /* Item Card */
            .cart-drawer-item {
                display: flex;
                gap: 15px;
                padding-bottom: 20px;
                border-bottom: 1px solid #222;
                position: relative;
            }
            .cart-drawer-img {
                width: 80px;
                height: 80px;
                object-fit: cover;
                border-radius: 4px;
                border: 1px solid #333;
                background: #000;
            }
            .cart-drawer-details {
                flex: 1;
                display: flex;
                flex-direction: column;
                gap: 5px;
            }
            .cart-drawer-title {
                font-size: 0.95rem;
                font-weight: 500;
                color: white;
                text-decoration: none;
                line-height: 1.4;
            }
            .cart-drawer-title:hover {
                color: var(--color-gold);
            }
            .cart-drawer-meta {
                font-size: 0.8rem;
                color: #888;
            }
            .cart-drawer-price-qty {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-top: 5px;
            }
            .cart-drawer-qty-controls {
                display: flex;
                align-items: center;
                border: 1px solid #333;
                border-radius: 4px;
                overflow: hidden;
                background: #1a1a1a;
            }
            .cart-drawer-qty-btn {
                background: none;
                border: none;
                color: #aaa;
                width: 25px;
                height: 25px;
                cursor: pointer;
                font-size: 0.9rem;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: background 0.2s, color 0.2s;
            }
            .cart-drawer-qty-btn:hover {
                background: #2a2a2a;
                color: white;
            }
            .cart-drawer-qty-val {
                width: 30px;
                text-align: center;
                font-size: 0.85rem;
                color: white;
            }
            .cart-drawer-remove {
                background: none;
                border: none;
                color: #888;
                cursor: pointer;
                font-size: 0.85rem;
                transition: color 0.2s;
                padding: 0;
                width: fit-content;
                margin-top: 5px;
                text-align: left;
            }
            .cart-drawer-remove:hover {
                color: #ff4d4d;
            }

            /* Footer */
            .cart-drawer-footer {
                padding: 20px;
                border-top: 1px solid #222;
                background: #090909;
                display: flex;
                flex-direction: column;
                gap: 15px;
            }
            .cart-drawer-subtotal {
                display: flex;
                justify-content: space-between;
                align-items: center;
                font-size: 1.05rem;
                font-weight: 500;
            }
            .cart-drawer-subtotal-val {
                color: var(--color-gold);
                font-size: 1.15rem;
                font-weight: 600;
            }

            /* Actions */
            .cart-drawer-actions {
                display: flex;
                flex-direction: column;
                gap: 10px;
            }
            .cart-drawer-btn {
                width: 100%;
                padding: 14px;
                border-radius: 4px;
                font-size: 0.9rem;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 1px;
                cursor: pointer;
                transition: all 0.2s;
                text-align: center;
                text-decoration: none;
                display: block;
            }
            .cart-drawer-btn-checkout {
                background: var(--color-gold);
                color: black;
                border: 1px solid var(--color-gold);
            }
            .cart-drawer-btn-checkout:hover {
                background: white;
                border-color: white;
            }
            .cart-drawer-btn-continue {
                background: transparent;
                color: white;
                border: 1px solid #333;
            }
            .cart-drawer-btn-continue:hover {
                border-color: white;
                background: rgba(255, 255, 255, 0.05);
            }
        `;
        document.head.appendChild(style);
    }

    // Create Drawer Element
    const drawer = document.createElement('div');
    drawer.id = 'cart-drawer';
    drawer.className = 'cart-drawer';
    drawer.innerHTML = `
        <div class="cart-drawer-header">
            <h3>SHOPPING BAG</h3>
            <button class="cart-drawer-close" onclick="closeCartDrawer()">&times;</button>
        </div>
        <div id="cart-drawer-body" class="cart-drawer-body">
            <!-- Items injected here -->
        </div>
        <div class="cart-drawer-footer">
            <div class="cart-drawer-subtotal">
                <span>SUBTOTAL:</span>
                <span id="cart-drawer-subtotal-val">$0.00</span>
            </div>
            <div class="cart-drawer-actions">
                <a href="checkout.html" class="cart-drawer-btn cart-drawer-btn-checkout">PROCEED TO CHECKOUT</a>
                <button class="cart-drawer-btn cart-drawer-btn-continue" onclick="closeCartDrawer()">CONTINUE SHOPPING</button>
            </div>
        </div>
    `;

    // Create Overlay Element
    const overlay = document.createElement('div');
    overlay.id = 'cart-drawer-overlay';
    overlay.className = 'cart-drawer-overlay';
    overlay.onclick = closeCartDrawer;

    // Append to body
    document.body.appendChild(overlay);
    document.body.appendChild(drawer);

    // Redirect header cart link to open drawer on click
    document.querySelectorAll('a[href="cart.html"]').forEach(link => {
        link.addEventListener('click', (e) => {
            if (!window.location.pathname.includes('cart.html')) {
                e.preventDefault();
                openCartDrawer();
            }
        });
    });
}

window.openCartDrawer = function() {
    injectCartDrawer();
    renderCartDrawer();
    document.getElementById('cart-drawer').classList.add('open');
    document.getElementById('cart-drawer-overlay').classList.add('open');
    document.body.style.overflow = 'hidden'; // Disable background scrolling
};

window.closeCartDrawer = function() {
    const drawer = document.getElementById('cart-drawer');
    const overlay = document.getElementById('cart-drawer-overlay');
    if (drawer) drawer.classList.remove('open');
    if (overlay) overlay.classList.remove('open');
    document.body.style.overflow = ''; // Re-enable background scrolling
};

function renderCartDrawer() {
    const body = document.getElementById('cart-drawer-body');
    const subtotalVal = document.getElementById('cart-drawer-subtotal-val');
    if (!body) return;

    if (cart.length === 0) {
        body.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; text-align: center; gap: 15px; color: #888;">
                <i class="fa-solid fa-shopping-bag" style="font-size: 3rem; color: #333;"></i>
                <p>Your bag is empty.</p>
            </div>
        `;
        if (subtotalVal) subtotalVal.innerText = '$0.00';
        return;
    }

    let subtotal = 0;
    const itemsHTML = cart.map(item => {
        const itemTotal = item.price * item.quantity;
        subtotal += itemTotal;
        
        let metaDetails = `${item.karat}k`;
        if (item.metal === 'Silver') metaDetails = 'Silver';
        if (item.weight && item.weight !== 'Varies' && item.weight !== 'N/A') {
            metaDetails += ` • ${item.weight}g`;
        }

        return `
            <div class="cart-drawer-item">
                <img src="${item.image}" class="cart-drawer-img" alt="${item.name}">
                <div class="cart-drawer-details">
                    <a href="product.html?id=${item.id}" class="cart-drawer-title">${item.name}</a>
                    <div class="cart-drawer-meta">${metaDetails}</div>
                    <div class="cart-drawer-price-qty">
                        <div class="cart-drawer-qty-controls">
                            <button class="cart-drawer-qty-btn" onclick="updateDrawerQty('${item.id}', -1)">-</button>
                            <span class="cart-drawer-qty-val">${item.quantity}</span>
                            <button class="cart-drawer-qty-btn" onclick="updateDrawerQty('${item.id}', 1)">+</button>
                        </div>
                        <div style="font-weight: 500; font-size: 0.95rem;">$${itemTotal.toLocaleString()}</div>
                    </div>
                    <button class="cart-drawer-remove" onclick="removeDrawerItem('${item.id}')">Remove</button>
                </div>
            </div>
        `;
    }).join('');

    body.innerHTML = itemsHTML;
    if (subtotalVal) subtotalVal.innerText = '$' + subtotal.toLocaleString();
}

window.updateDrawerQty = function(id, offset) {
    const item = cart.find(i => i.id === id);
    if (!item) return;
    
    item.quantity += offset;
    if (item.quantity <= 0) {
        cart = cart.filter(i => i.id !== id);
    }
    
    localStorage.setItem('alquds_cart', JSON.stringify(cart));
    updateCartCount();
    renderCartDrawer();
    
    // Sync main cart page render if open
    if (typeof renderCart === 'function') renderCart();
};

window.removeDrawerItem = function(id) {
    cart = cart.filter(i => i.id !== id);
    localStorage.setItem('alquds_cart', JSON.stringify(cart));
    updateCartCount();
    renderCartDrawer();
    
    // Sync main cart page render if open
    if (typeof renderCart === 'function') renderCart();
};

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
    
    // Open the Slide-out Cart Drawer sidebar immediately
    openCartDrawer();
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
let activeFrameFilter = null; // 'coin' or 'ounce'

// Style injection for animated oval filters on frames page
(function() {
    const styleId = 'frames-filter-styles';
    if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.innerHTML = `
            .frames-filter-container {
                display: flex;
                justify-content: center;
                gap: 20px;
                margin: 20px 0 30px 0;
                width: 100%;
                grid-column: 1 / -1;
            }
            .frames-filter-btn {
                background: rgba(0, 0, 0, 0.4);
                border: 2px solid #8e703f;
                color: #d4af37;
                padding: 12px 30px;
                font-size: 0.95rem;
                font-weight: 500;
                text-transform: uppercase;
                letter-spacing: 1px;
                border-radius: 50px;
                cursor: pointer;
                transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
                position: relative;
                overflow: hidden;
                box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
                display: inline-flex;
                align-items: center;
                justify-content: center;
            }
            .frames-filter-btn::after {
                content: '';
                position: absolute;
                top: 50%;
                left: 50%;
                width: 150%;
                height: 150%;
                background: rgba(212, 175, 55, 0.1);
                transform: translate(-50%, -50%) scale(0);
                border-radius: 50%;
                transition: transform 0.6s ease;
            }
            .frames-filter-btn:hover {
                transform: translateY(-3px) scale(1.05);
                border-color: #d4af37;
                color: white;
                box-shadow: 0 5px 15px rgba(212, 175, 55, 0.25);
            }
            .frames-filter-btn:hover::after {
                transform: translate(-50%, -50%) scale(1);
            }
            .frames-filter-btn.active {
                background: #d4af37;
                border-color: #d4af37;
                color: black;
                font-weight: bold;
                box-shadow: 0 0 20px rgba(212, 175, 55, 0.5);
                animation: pulse-active 2s infinite alternate;
            }
            @keyframes pulse-active {
                0% {
                    box-shadow: 0 0 15px rgba(212, 175, 55, 0.4);
                }
                100% {
                    box-shadow: 0 0 25px rgba(212, 175, 55, 0.7);
                }
            }
        `;
        document.head.appendChild(style);
    }
})();

window.toggleFrameFilter = function(type) {
    if (activeFrameFilter === type) {
        activeFrameFilter = null;
    } else {
        activeFrameFilter = type;
    }
    renderCatalog(true);
};

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
                <a href="product.html?id=${encodeURIComponent(product.id)}" style="display: block;">
                    ${overlayHTML}
                    <img src="${product.image}" alt="${product.name}" class="product-image" loading="lazy">
                </a>
                <button ${btnAction} class="${btnClass}">
                    <i class="${iconClass}"></i>
                </button>
            </div>
            <div class="product-info">
                <div class="product-meta">
                    ${product.metal === 'Silver' ? 'Silver' : (product.metal === 'Platinum' ? 'Platinum' : (product.karat ? product.karat + 'k Gold' : 'Gold'))} 
                    | ${product.weight}
                </div>
                <h3 class="product-title"><a href="product.html?id=${encodeURIComponent(product.id)}">${product.name}</a></h3>
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
    injectCartDrawer();

    try {
        // 1. Fetch Data
        // 1. Fetch Data
        const pricingRes = await fetch('data/pricing.json?t=' + new Date().getTime());
        pricingConfig = await pricingRes.json();

        // Fetch all category files dynamically
        const categoryFiles = [
            'bangles', 'bangle-sets', 'chains', 'earrings', 'rings', 'name-plates', 'white-gold',
            'bands', 'coins', 'kladas', 'necklaces', 'children',
            'anklets', 'bracelets', 'pendants', 'belts', 'chokers', 'frames',
            'diamonds', 'coins-bullions', 'silver', 'long-necklaces'
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

        // 3. Render Home Featured (4 Random Items)
        const featuredGrid = document.getElementById('featured-products-grid');
        if (featuredGrid) {
            const featured = products.filter(p => p.featured);
            // Get 4 random featured items
            const randomFeatured = getRandomItems(featured, 4);
            featuredGrid.innerHTML = randomFeatured.map(createProductCard).join('');
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

    const sidebar = document.querySelector('aside');
    if (sidebar && catParam === 'silver') {
        const existingKarat = document.getElementById('sidebar-karat-filter');
        if (existingKarat) existingKarat.remove();
    }
    if (sidebar && catParam !== 'silver' && !document.getElementById('sidebar-karat-filter')) {
        const priceContainer = sidebar.querySelector('.price-filter-container');
        if (priceContainer) {
            priceContainer.insertAdjacentHTML('afterend', `
                <div id="sidebar-karat-filter" style="margin-top: 30px; border-top: 1px solid #333; padding-top: 20px;">
                    <h3 style="color: white; font-size: 1rem; margin-bottom: 20px; font-weight: normal; border-bottom: 1px solid #333; padding-bottom: 10px;">Filter by Karat</h3>
                    <div style="display: flex; flex-direction: column; gap: 12px; padding: 5px 0;">
                        <label class="karat-filter-label" style="display: flex; align-items: center; gap: 10px; color: #ccc; cursor: pointer; font-size: 0.95rem; font-family: var(--font-body);">
                            <input type="checkbox" value="22" class="karat-filter-checkbox">
                            22K Gold
                        </label>
                        <label class="karat-filter-label" style="display: flex; align-items: center; gap: 10px; color: #ccc; cursor: pointer; font-size: 0.95rem; font-family: var(--font-body);">
                            <input type="checkbox" value="21" class="karat-filter-checkbox">
                            21K Gold
                        </label>
                        <label class="karat-filter-label" style="display: flex; align-items: center; gap: 10px; color: #ccc; cursor: pointer; font-size: 0.95rem; font-family: var(--font-body);">
                            <input type="checkbox" value="18" class="karat-filter-checkbox">
                            18K Gold
                        </label>
                    </div>
                </div>
            `);
            
            // Add change listener to checkboxes to trigger re-render on toggle
            document.querySelectorAll('.karat-filter-checkbox').forEach(cb => {
                cb.addEventListener('change', () => {
                    renderCatalog(true); // Re-render the catalog grid
                });
            });
        }
    }

    // Name Plates Modal Logic
    if (reset && (catParam === 'name-plates' || subParam === 'name-plates')) {
        // Show once per session
        if (!sessionStorage.getItem('seenNPModal')) {
            setTimeout(showNamePlatesModal, 500); // Slight delay for effect
            sessionStorage.setItem('seenNPModal', 'true');
        }
    }

    let scopeProducts = products;
    let pageLabel = 'Catalog';
    let materialConfig = null;
    let isMaterialRoot = false;

    if (searchParam) {
        const term = searchParam.trim().toLowerCase();

        // Keyword Mapping for Smarter Search
        const keywordMap = {
            'oz': 'ounce',
            'ounce': 'oz',
            'g': 'gram',
            'gms': 'grams',
            'gram': 'g',
            'k': 'karat',
            'karat': 'k',
            'wht': 'white',
            'yel': 'yellow',
            'chn': 'chain',
            'brac': 'bracelet'
        };

        scopeProducts = products.filter(p => {
            // Tokenize search term
            let searchTerms = term.split(/\s+/).filter(t => t.length > 0);

            // Expand search terms with mapped keywords
            let expandedTerms = [];
            searchTerms.forEach(t => {
                expandedTerms.push(t);
                if (keywordMap[t]) expandedTerms.push(keywordMap[t]);
            });

            // searchable string combining all relevant fields
            const productText = [
                p.name,
                String(p.id),
                String(p.itemNo),
                p.category,
                p.description,
                p.color,
                p.weight, // Added weight to searchable fields
                p.unit    // Added unit to searchable fields
            ].join(' ').toLowerCase();

            // Check if ANY of the expanded terms for EACH original term is present
            // e.g. if user types "1 oz", we check:
            // "1" is in text AND ("oz" OR "ounce") is in text
            return searchTerms.every(originalTerm => {
                const variants = [originalTerm];
                if (keywordMap[originalTerm]) variants.push(keywordMap[originalTerm]);
                return variants.some(v => productText.includes(v));
            });
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

            if (catParam === 'yellow-gold' || catParam === 'white-gold' || catParam === 'silver') {
                // Hide Filter Sidebar for Material Root Pages
                const sidebar = document.querySelector('aside');
                if (sidebar) sidebar.style.display = 'none';

                let catsList = YELLOW_GOLD_CATS;
                if (catParam === 'white-gold') catsList = WHITE_GOLD_CATS;
                if (catParam === 'silver') catsList = SILVER_CATS;

                catHTML = catsList.map(cat => {
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

    // Inject Ring Sizer, Necklace Sizer or Wrist Sizer link under catalog title (for mobile) and under price filter in the sidebar (for desktop)
    const existingCatalogSizer = document.getElementById('catalog-sizer-link');
    if (existingCatalogSizer) existingCatalogSizer.remove();
    
    const existingSidebarSizer = document.getElementById('sidebar-sizer-link');
    if (existingSidebarSizer) existingSidebarSizer.remove();

    const existingCats = document.getElementById('sidebar-categories-filter');
    if (existingCats) existingCats.remove();
    
    if (title && title.parentNode) {
        title.parentNode.style.flexDirection = 'row'; // Restore default
    }

    const isCatalogRingOrBand = (catParam === 'rings' || catParam === 'bands' || subParam === 'rings' || subParam === 'bands') ||
                                (searchParam && (searchParam.toLowerCase().includes('ring') || searchParam.toLowerCase().includes('band')));
                                
    const isCatalogNecklaceOrChain = (catParam === 'necklaces' || catParam === 'chains' || catParam === 'chokers' || catParam === 'pendants' || subParam === 'necklaces' || subParam === 'chains' || subParam === 'chokers' || subParam === 'pendants') ||
                                     (searchParam && (searchParam.toLowerCase().includes('necklace') || searchParam.toLowerCase().includes('chain') || searchParam.toLowerCase().includes('pendant') || searchParam.toLowerCase().includes('choker')));

    const isCatalogWristwear = (catParam === 'bangles' || catParam === 'bangle-sets' || catParam === 'bracelets' || catParam === 'anklets' || subParam === 'bangles' || subParam === 'bangle-sets' || subParam === 'bracelets' || subParam === 'anklets') ||
                               (searchParam && (searchParam.toLowerCase().includes('bangle') || searchParam.toLowerCase().includes('bracelet') || searchParam.toLowerCase().includes('anklet')));

    if (isCatalogRingOrBand) {
        // 1. Mobile placement (under page title, styled to hide on desktop)
        if (title && title.parentNode) {
            title.parentNode.style.flexDirection = 'column';
            title.insertAdjacentHTML('afterend', `
                <div id="catalog-sizer-link" style="text-align: center; margin-top: 12px; margin-bottom: 12px; display: flex; justify-content: center; width: 100%;">
                    <a href="ring-sizer/index.html" target="_blank" class="ring-sizer-link-integrated">
                        <i class="fa-solid fa-ruler-horizontal"></i> Ring Sizing Guide
                    </a>
                </div>
            `);
        }
        
        // 2. Desktop placement (under price filter in the sidebar)
        const sidebar = document.querySelector('aside');
        if (sidebar) {
            sidebar.insertAdjacentHTML('beforeend', `
                <div id="sidebar-sizer-link" style="margin-top: 30px; border-top: 1px solid #333; padding-top: 20px; text-align: left; width: 100%;">
                    <a href="ring-sizer/index.html" target="_blank" class="ring-sizer-link-integrated" style="font-size: 1rem !important;">
                        <i class="fa-solid fa-ruler-horizontal"></i> Ring Sizing Guide
                    </a>
                </div>
            `);
        }
    } else if (isCatalogNecklaceOrChain) {
        // 1. Mobile placement (under page title, styled to hide on desktop)
        if (title && title.parentNode) {
            title.parentNode.style.flexDirection = 'column';
            title.insertAdjacentHTML('afterend', `
                <div id="catalog-sizer-link" style="text-align: center; margin-top: 12px; margin-bottom: 12px; display: flex; justify-content: center; width: 100%;">
                    <a href="necklace-sizer/index.html" target="_blank" class="necklace-sizer-link-integrated">
                        <i class="fa-solid fa-ruler-horizontal"></i> Necklace Sizing Guide
                    </a>
                </div>
            `);
        }
        
        // 2. Desktop placement (under price filter in the sidebar)
        const sidebar = document.querySelector('aside');
        if (sidebar) {
            sidebar.insertAdjacentHTML('beforeend', `
                <div id="sidebar-sizer-link" style="margin-top: 30px; border-top: 1px solid #333; padding-top: 20px; text-align: left; width: 100%;">
                    <a href="necklace-sizer/index.html" target="_blank" class="necklace-sizer-link-integrated" style="font-size: 1rem !important;">
                        <i class="fa-solid fa-ruler-horizontal"></i> Necklace Sizing Guide
                    </a>
                </div>
            `);
        }
    } else if (isCatalogWristwear) {
        // 1. Mobile placement (under page title, styled to hide on desktop)
        if (title && title.parentNode) {
            title.parentNode.style.flexDirection = 'column';
            title.insertAdjacentHTML('afterend', `
                <div id="catalog-sizer-link" style="text-align: center; margin-top: 12px; margin-bottom: 12px; display: flex; justify-content: center; width: 100%;">
                    <a href="wrist-sizer/index.html" target="_blank" class="necklace-sizer-link-integrated">
                        <i class="fa-solid fa-ruler-horizontal"></i> Wrist Sizing Guide
                    </a>
                </div>
            `);
        }
        
        // 2. Desktop placement (under price filter in the sidebar)
        const sidebar = document.querySelector('aside');
        if (sidebar) {
            sidebar.insertAdjacentHTML('beforeend', `
                <div id="sidebar-sizer-link" style="margin-top: 30px; border-top: 1px solid #333; padding-top: 20px; text-align: left; width: 100%;">
                    <a href="wrist-sizer/index.html" target="_blank" class="necklace-sizer-link-integrated" style="font-size: 1rem !important;">
                        <i class="fa-solid fa-ruler-horizontal"></i> Wrist Sizing Guide
                    </a>
                </div>
            `);
        }
    }

    // Inject Collections Switcher in the sidebar last (so it sits at the bottom)
    if (sidebar && subParam) {
        sidebar.insertAdjacentHTML('beforeend', `
            <div id="sidebar-categories-filter" style="margin-top: 30px; border-top: 1px solid #333; padding-top: 20px; text-align: left; width: 100%;">
                <h3 style="color: white; font-size: 1rem; margin-bottom: 20px; font-weight: normal; border-bottom: 1px solid #333; padding-bottom: 10px;">Collections</h3>
                <ul class="sidebar-category-list" style="list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 8px;">
                </ul>
            </div>
        `);
        
        const categoryListContainer = document.querySelector('.sidebar-category-list');
        if (categoryListContainer) {
            const parent = catParam || 'yellow-gold';
            let catsList = YELLOW_GOLD_CATS;
            if (parent === 'white-gold') catsList = WHITE_GOLD_CATS;
            if (parent === 'silver') catsList = SILVER_CATS;

            const html = catsList.map(cat => {
                const isActive = (cat.id === subParam) ? 'active' : '';
                return `
                    <li>
                        <a href="catalog.html?cat=${parent}&sub=${cat.id}" class="sidebar-category-link ${isActive}">
                            ${cat.label}
                        </a>
                    </li>
                `;
            }).join('');
            categoryListContainer.innerHTML = html;
        }
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

    // Apply Karat Filter
    if (!isMaterialRoot) { // Don't filter category cards
        const activeKarats = Array.from(document.querySelectorAll('.karat-filter-checkbox:checked')).map(cb => parseInt(cb.value));
        if (activeKarats.length > 0) {
            currentFilteredProducts = currentFilteredProducts.filter(p => {
                const k = p.karat ? parseInt(p.karat) : null;
                return k && activeKarats.includes(k);
            });
        }
    }

    // Frames page custom filters
    const isFramesPage = subParam === 'frames';
    let filterContainer = document.getElementById('frames-filter-container');
    if (isFramesPage) {
        if (!filterContainer) {
            filterContainer = document.createElement('div');
            filterContainer.id = 'frames-filter-container';
            filterContainer.className = 'frames-filter-container';
            filterContainer.innerHTML = `
                <button class="frames-filter-btn ${activeFrameFilter === 'coin' ? 'active' : ''}" onclick="toggleFrameFilter('coin')">Coin Frames</button>
                <button class="frames-filter-btn ${activeFrameFilter === 'ounce' ? 'active' : ''}" onclick="toggleFrameFilter('ounce')">Ounce Frames</button>
            `;
            grid.parentNode.insertBefore(filterContainer, grid);
        } else {
            const btns = filterContainer.querySelectorAll('.frames-filter-btn');
            if (btns.length === 2) {
                btns[0].className = `frames-filter-btn ${activeFrameFilter === 'coin' ? 'active' : ''}`;
                btns[1].className = `frames-filter-btn ${activeFrameFilter === 'ounce' ? 'active' : ''}`;
            }
        }
        
        // Filter products based on selected tab
        if (activeFrameFilter === 'ounce') {
            currentFilteredProducts = currentFilteredProducts.filter(p => 
                String(p.name || '').toLowerCase().includes('ounce')
            );
        } else if (activeFrameFilter === 'coin') {
            currentFilteredProducts = currentFilteredProducts.filter(p => 
                !String(p.name || '').toLowerCase().includes('ounce')
            );
        }
    } else {
        if (filterContainer) filterContainer.remove();
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
    let catsList = YELLOW_GOLD_CATS;
    if (parentCat === 'white-gold') catsList = WHITE_GOLD_CATS;
    if (parentCat === 'silver') catsList = SILVER_CATS;

    const html = catsList.map(cat => {
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

    const isRingOrBand = product.category === 'rings' || 
                         product.category === 'bands' || 
                         String(product.category || '').toLowerCase().includes('ring') ||
                         String(product.category || '').toLowerCase().includes('band') ||
                         String(product.name || '').toLowerCase().includes('ring') ||
                         String(product.name || '').toLowerCase().includes('band');

    const isNecklaceOrChain = product.category === 'necklaces' || 
                              product.category === 'chains' || 
                              product.category === 'chokers' || 
                              product.category === 'pendants' ||
                              product.category === 'kladas' ||
                              product.category === 'name-plates' ||
                              String(product.category || '').toLowerCase().includes('necklace') ||
                              String(product.category || '').toLowerCase().includes('chain') ||
                              String(product.category || '').toLowerCase().includes('pendant') ||
                              String(product.category || '').toLowerCase().includes('choker') ||
                              String(product.name || '').toLowerCase().includes('necklace') ||
                              String(product.name || '').toLowerCase().includes('chain') ||
                              String(product.name || '').toLowerCase().includes('pendant') ||
                              String(product.name || '').toLowerCase().includes('choker');

    const isWristwear = product.category === 'bangles' || 
                        product.category === 'bangle-sets' || 
                        product.category === 'bracelets' || 
                        product.category === 'anklets' ||
                        String(product.category || '').toLowerCase().includes('bangle') ||
                        String(product.category || '').toLowerCase().includes('bracelet') ||
                        String(product.category || '').toLowerCase().includes('anklet') ||
                        String(product.name || '').toLowerCase().includes('bangle') ||
                        String(product.name || '').toLowerCase().includes('bracelet') ||
                        String(product.name || '').toLowerCase().includes('anklet');

    let sizerLinkHTML = '';
    if (isRingOrBand) {
        sizerLinkHTML = `
            <div style="margin-top: -10px; margin-bottom: 25px; text-align: right; display: flex; justify-content: flex-end; width: 100%;">
                <a href="ring-sizer/index.html" target="_blank" class="ring-sizer-link-integrated">
                    <i class="fa-solid fa-ruler-horizontal"></i> Ring Sizing Guide
                </a>
            </div>
        `;
    } else if (isNecklaceOrChain) {
        sizerLinkHTML = `
            <div style="margin-top: -10px; margin-bottom: 25px; text-align: right; display: flex; justify-content: flex-end; width: 100%;">
                <a href="necklace-sizer/index.html" target="_blank" class="necklace-sizer-link-integrated">
                    <i class="fa-solid fa-ruler-horizontal"></i> Necklace Sizing Guide
                </a>
            </div>
        `;
    } else if (isWristwear) {
        sizerLinkHTML = `
            <div style="margin-top: -10px; margin-bottom: 25px; text-align: right; display: flex; justify-content: flex-end; width: 100%;">
                <a href="wrist-sizer/index.html" target="_blank" class="necklace-sizer-link-integrated">
                    <i class="fa-solid fa-ruler-horizontal"></i> Wrist Sizing Guide
                </a>
            </div>
        `;
    }

    const isOutOfStock = product.outOfStock === true;
    const btnHTML = isOutOfStock
        ? `<button disabled class="btn btn-primary btn-disabled" style="width: 100%; padding: 18px; font-size: 1rem; margin-bottom: 20px;"><i class="fa-solid fa-ban" style="margin-right: 8px;"></i> OUT OF STOCK</button>`
        : `<button onclick="addToCart('${product.id}')" class="btn btn-primary" style="width: 100%; padding: 18px; font-size: 1rem; margin-bottom: 20px;"><i class="fa-solid fa-shopping-bag" style="margin-right: 8px;"></i> ADD TO CART</button>`;

    // Image Gallery Logic
    const allImages = [product.image];
    if (product.additionalImages && Array.isArray(product.additionalImages)) {
        allImages.push(...product.additionalImages);
    }

    // Store state for navigation
    window.currentProductImages = allImages;
    window.currentImageIndex = 0;

    // Navigation Function
    window.changeImage = function (offset) {
        window.currentImageIndex += offset;
        if (window.currentImageIndex >= window.currentProductImages.length) window.currentImageIndex = 0;
        if (window.currentImageIndex < 0) window.currentImageIndex = window.currentProductImages.length - 1;

        const img = document.getElementById('main-product-img');
        if (img) {
            img.src = window.currentProductImages[window.currentImageIndex];
        }
    };

    let thumbnailsHTML = '';
    let arrowsHTML = '';

    if (allImages.length > 1) {
        // Arrows
        arrowsHTML = `
            <button onclick="changeImage(-1)" style="position: absolute; left: 10px; top: 50%; transform: translateY(-50%); background: rgba(0,0,0,0.6); border: 1px solid var(--color-gold); color: var(--color-gold); font-size: 1.2rem; cursor: pointer; width: 40px; height: 40px; border-radius: 50%; z-index: 10; display: flex; align-items: center; justify-content: center; transition: all 0.2s;" onmouseover="this.style.background='var(--color-gold)'; this.style.color='black'" onmouseout="this.style.background='rgba(0,0,0,0.6)'; this.style.color='var(--color-gold)'">
                <i class="fa-solid fa-chevron-left"></i>
            </button>
            <button onclick="changeImage(1)" style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%); background: rgba(0,0,0,0.6); border: 1px solid var(--color-gold); color: var(--color-gold); font-size: 1.2rem; cursor: pointer; width: 40px; height: 40px; border-radius: 50%; z-index: 10; display: flex; align-items: center; justify-content: center; transition: all 0.2s;" onmouseover="this.style.background='var(--color-gold)'; this.style.color='black'" onmouseout="this.style.background='rgba(0,0,0,0.6)'; this.style.color='var(--color-gold)'">
                <i class="fa-solid fa-chevron-right"></i>
            </button>
        `;

        // Thumbnails
        thumbnailsHTML = `<div style="display: flex; gap: 10px; margin-top: 15px; overflow-x: auto; padding-bottom: 5px;">
            ${allImages.map((img, index) => `
                <img src="${img}" 
                     onclick="window.currentImageIndex = ${index}; document.getElementById('main-product-img').src = '${img}'" 
                     style="width: 80px; height: 80px; object-fit: cover; border: 1px solid #444; cursor: pointer; border-radius: 4px; transition: border-color 0.2s;"
                     onmouseover="this.style.borderColor='var(--color-gold)'"
                     onmouseout="this.style.borderColor='#444'"
                >
            `).join('')}
        </div>`;
    }

    // Back to Category Link
    let backUrl = 'catalog.html';
    let catSlug = String(product.category || '').toLowerCase();

    // Determine the most appropriate parent link
    if (product.category === 'coins-bullions') {
        backUrl = 'catalog.html?cat=coins-bullions';
    } else if (catSlug === 'diamonds') {
        backUrl = 'catalog.html?cat=diamonds';
    } else if (product.metal === 'Silver') {
        backUrl = `catalog.html?cat=silver&sub=${catSlug}`;
    } else if (product.color === 'White Gold') {
        backUrl = `catalog.html?cat=white-gold&sub=${catSlug}`;
    } else {
        // Default to Yellow Gold
        backUrl = `catalog.html?cat=yellow-gold&sub=${catSlug}`;
    }

    const catName = catSlug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

    container.innerHTML = `
        <div style="width: 100%; max-width: 900px; margin-bottom: 20px;">
             <a href="${backUrl}" class="text-white hover-gold" style="display: inline-flex; align-items: center; gap: 8px; font-size: 0.9rem; text-decoration: none;">
                <i class="fa-solid fa-arrow-left"></i> Back to ${catName}
            </a>
        </div>
        <div class="pd-image-col">
            <div style="position: relative;">
                ${isOutOfStock ? `<div class="out-of-stock-overlay" style="border-radius: 4px;"><span class="badge-out-of-stock" style="font-size: 1.2rem; padding: 10px 20px;">Out of Stock</span></div>` : ''}
                ${arrowsHTML}
                <img id="main-product-img" src="${product.image}" alt="${product.name}" class="pd-main-image" onclick="openLightbox(this.src)">
            </div>
            ${thumbnailsHTML}
        </div>
        <div class="pd-info-col">
            <h1 class="pd-title">${product.name}</h1>
            <div class="pd-price">$${product.price ? product.price.toLocaleString() : 'N/A'}</div>
            <div style="background: #1a1a1a; padding: 20px; border: 1px solid #333; margin-bottom: 25px;">
                <table style="width: 100%; border-collapse: collapse;">
                    ${product.category === 'coins-bullions' ?
            (() => {
                // Determine Purity Display
                let purityDisplay = `${product.karat}k`;
                if (product.metal === 'Silver') purityDisplay = 'Silver (.999)';
                else if (product.metal === 'Platinum') purityDisplay = 'Platinum (.9995)';

                return `
                    <tr style="border-bottom: 1px solid #333;"><td style="padding: 12px 0; color: var(--color-text-muted); font-size: 0.9rem;">Purity:</td><td style="padding: 12px 0; color: white; text-align: right; font-weight: 500;">${purityDisplay}</td></tr>
                    <tr style="border-bottom: 1px solid #333;"><td style="padding: 12px 0; color: var(--color-text-muted); font-size: 0.9rem;">Weight:</td><td style="padding: 12px 0; color: white; text-align: right; font-weight: 500;">${product.weight} ${product.unit}</td></tr>
                    <tr><td style="padding: 12px 0; color: var(--color-text-muted); font-size: 0.9rem;">Item No.:</td><td style="padding: 12px 0; color: var(--color-gold); text-align: right; font-weight: 500;">${product.itemNo || product.id || 'N/A'}</td></tr>
                `;
            })()
            :
            `<tr style="border-bottom: 1px solid #333;"><td style="padding: 12px 0; color: var(--color-text-muted); font-size: 0.9rem;">Purity:</td><td style="padding: 12px 0; color: white; text-align: right; font-weight: 500;">${product.karat} Karats</td></tr>
                         <tr style="border-bottom: 1px solid #333;"><td style="padding: 12px 0; color: var(--color-text-muted); font-size: 0.9rem;">Weight:</td><td style="padding: 12px 0; color: white; text-align: right; font-weight: 500;">${product.weight} ${product.weight === 'Varies' ? '' : 'Gms'}</td></tr>
                         <tr><td style="padding: 12px 0; color: var(--color-text-muted); font-size: 0.9rem;">Item No.:</td><td style="padding: 12px 0; color: var(--color-gold); text-align: right; font-weight: 500;">${product.itemNo || product.id || 'N/A'}</td></tr>`
        }
                </table>
            </div>
            ${sizerLinkHTML}
            <div class="flex items-center gap-4" style="margin-bottom: 25px;">
                <label class="text-muted" style="font-size: 0.9rem;">Quantity:</label>
                <input type="number" value="1" min="1" id="quantity-${product.id}" ${isOutOfStock ? 'disabled' : ''} style="width: 80px; padding: 10px; background: #222; border: 1px solid #333; color: white; text-align: center; ${isOutOfStock ? 'opacity: 0.5; cursor: not-allowed;' : ''}">
            </div>
            ${btnHTML}
            <div style="margin-top: 40px;">
                <h3 class="text-gold" style="border-bottom: 1px solid #333; padding-bottom: 10px; margin-bottom: 20px;">Description</h3>
                <p class="text-muted" style="line-height: 1.8;">
                    ${(() => {
                        let desc = product.description || '';
                        const isFrame = product.category === 'frames' || String(product.name || '').toLowerCase().includes('frame');
                        if (isFrame) {
                            if (!desc) {
                                return `This premium gold bezel frame is specifically crafted to encase and secure a standard 1 oz PAMP Suisse minted gold bar, transforming your investment bullion into a stunning piece of fine jewelry.<br><br><strong>Compatible Bar Dimensions:</strong> 41.0 mm (Length) x 24.0 mm (Width) x 1.7 mm (Thickness).`;
                            } else if (!desc.includes('41mm') && !desc.includes('41 mm') && !desc.includes('41.0')) {
                                return desc + `<br><br><strong>Fits Standard 1 oz PAMP Suisse Bar:</strong> 41.0 mm (Length) x 24.0 mm (Width) x 1.7 mm (Thickness).`;
                            }
                        }
                        return desc || 'No description available.';
                    })()}
                </p>
            </div>
        </div>
    `;
}

// Name Plates Modal Functions
function showNamePlatesModal() {
    // Check if modal already exists
    if (document.getElementById('np-modal')) return;

    const modalHTML = `
        <div id="np-modal" class="np-modal-overlay">
            <div class="np-modal-content">
                <h2 class="np-modal-title">Custom Designs Available</h2>
                
                <p class="np-modal-text">
                    These are not our only designs! We have many more custom styles to choose from. 
                    Before placing your order, please contact us at 
                    <a href="tel:7082339508" class="np-phone-link">708-233-9508</a> 
                    for inquiries and to see full options.
                </p>

                <div class="np-modal-arabic">
                    <p style="margin-bottom: 10px; font-weight: bold;">تصاميم مخصصة متاحة</p>
                    <p>هذه ليست التصاميم الوحيدة المتوفرة لدينا! لدينا العديد من الأنماط المخصصة للاختيار من بينها. قبل الطلب، يرجى الاتصال بنا على <span dir="ltr" style="display:inline-block;"><a href="tel:7082339508" class="np-phone-link">708-233-9508</a></span> للاستفسار والاطلاع على كامل الخيارات.</p>
                </div>

                <button class="np-btn-ok" onclick="closeNamePlatesModal()">Okay / حسناً</button>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Trigger animation
    requestAnimationFrame(() => {
        document.getElementById('np-modal').classList.add('active');
    });
}

function closeNamePlatesModal() {
    const modal = document.getElementById('np-modal');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => {
            modal.remove();
        }, 500);
    }
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

// Lightbox Logic
function openLightbox(src) {
    let overlay = document.getElementById('lightbox-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'lightbox-overlay';
        overlay.className = 'lightbox-overlay';
        overlay.innerHTML = `
    < button class="lightbox-close" onclick = "closeLightbox()" >& times;</button >
        <img src="" class="lightbox-image" id="lightbox-img">
            `;
        document.body.appendChild(overlay);

        // Close on click outside
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeLightbox();
        });

        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeLightbox();
        });
    }

    const img = document.getElementById('lightbox-img');
    img.src = src;

    // Slight delay for animation
    setTimeout(() => {
        overlay.classList.add('active');
    }, 10);
}

function closeLightbox() {
    const overlay = document.getElementById('lightbox-overlay');
    if (overlay) {
        overlay.classList.remove('active');
    }
}

// Expose globally
window.openLightbox = openLightbox;
window.closeLightbox = closeLightbox;
