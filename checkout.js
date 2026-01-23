const CHECKOUT_SHIPPING_COST = 50.00;

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Get LocalStorage Cart Objects (IDs and Quantities)
    let lsCart = [];
    try {
        const raw = localStorage.getItem('alquds_cart');
        lsCart = raw ? JSON.parse(raw) : [];
    } catch (e) {
        console.error("Cart parse error:", e);
        lsCart = [];
    }

    // 2. Fetch Fresh Data (Products & Pricing) to ensure accuracy
    let freshCart = [];
    try {
        const [pricingRes, productsRes] = await Promise.all([
            fetch('data/pricing.json?t=' + new Date().getTime()),
            fetch('data/products.json?t=' + new Date().getTime())
        ]);

        if (!pricingRes.ok || !productsRes.ok) throw new Error("Failed to fetch data");

        const pricingConfig = await pricingRes.json();
        const rawData = await productsRes.json();
        const allProducts = Array.isArray(rawData) ? rawData : (rawData.products_list || []);

        // 3. Re-Hydrate Cart with Real Prices
        freshCart = lsCart.map(lsItem => {
            const product = allProducts.find(p => p.id === lsItem.id);
            if (!product) return null; // Product no longer exists

            // Recalculate Price
            const realPrice = calculatePrice(product, pricingConfig);

            return {
                ...product,
                price: realPrice,
                quantity: lsItem.quantity || 1
            };
        }).filter(item => item !== null);

        // Optional: Update LocalStorage with corrected data? 
        // Better not to mess with it silently, but for display we use freshCart.
    } catch (err) {
        console.error("Error refreshing cart data:", err);
        // Fallback: use LS data if fetch fails, though likely price is missing
        freshCart = lsCart;
    }

    // 4. Update Header Badge
    updateHeaderCount(freshCart);

    // 5. Render State
    if (freshCart.length === 0) {
        renderEmptyState();
    } else {
        renderCheckout(freshCart);
    }
});

// Helper: Calculate Price dynamically (Same as App logic)
function calculatePrice(item, config) {
    if (item.weight === "Varies" || item.weight === "N/A" || !item.isDynamic) {
        return item.fixedPrice || 0;
    }

    // Default to 31.1035 if missing from JSON
    const gramsPerOunce = config.gramsPerOunce || 31.1035;

    const purityFactor = item.karat / 24;
    const rawPricePerGram = (config.spotPrice24kOunce / gramsPerOunce) * purityFactor;
    const priceWithMargin = rawPricePerGram * (1 + (item.marginPercent / 100));
    const priceWithLabor = priceWithMargin + item.laborPerGram;
    const finalPrice = priceWithLabor * parseFloat(item.weight);

    return Math.ceil(finalPrice);
}

function updateHeaderCount(cart) {
    const count = cart.reduce((acc, item) => acc + (parseInt(item.quantity) || 0), 0);
    const badge = document.getElementById('cart-count');
    if (badge) badge.innerText = count;
}

function renderEmptyState() {
    const form = document.getElementById('checkout-form');
    if (form) {
        const container = form.closest('.container');
        if (container) {
            container.innerHTML = `
                <div class="text-center" style="padding: 100px 20px;">
                    <i class="fa-solid fa-cart-shopping text-muted" style="font-size: 4rem; margin-bottom: 20px;"></i>
                    <h1 class="text-white mb-4">Your Bag is Empty</h1>
                    <p class="text-muted mb-8">It looks like you haven't added any jewelry to your collection yet.</p>
                    <a href="catalog.html" class="btn btn-primary" style="padding: 15px 40px; text-decoration: none;">START SHOPPING</a>
                </div>
            `;
        }
    }
}

function renderCheckout(cart) {
    const itemsContainer = document.getElementById('checkout-items');
    const subtotalEl = document.getElementById('checkout-subtotal');
    const totalEl = document.getElementById('checkout-total');

    if (!itemsContainer) return;

    // Render Items
    let subtotal = 0;

    itemsContainer.innerHTML = cart.map(item => {
        let rawPrice = item.price;
        // Strip non-numeric chars in case data is dirty
        if (typeof rawPrice === 'string') {
            rawPrice = rawPrice.replace(/[^0-9.-]+/g, "");
        }
        const price = parseFloat(rawPrice) || 0;
        const qty = parseInt(item.quantity) || 1;

        const itemTotal = price * qty;
        subtotal += itemTotal;

        const imgSrc = item.image || 'assets/placeholder.png';

        return `
            <div class="flex items-center gap-4 mb-4" style="background: rgba(255,255,255,0.03); padding: 15px; border-radius: 4px; border: 1px solid rgba(255,255,255,0.05);">
                <div style="width: 70px; height: 70px; flex-shrink: 0; background: #000; border: 1px solid #333; overflow: hidden; border-radius: 4px;">
                    <img src="${imgSrc}" alt="${item.name}" style="width: 100%; height: 100%; object-fit: cover;">
                </div>
                <div style="flex: 1;">
                    <div class="text-white" style="font-family: var(--font-heading); font-size: 1rem; line-height: 1.2; margin-bottom: 5px;">
                        ${item.name}
                    </div>
                    <div class="text-muted" style="font-size: 0.8rem;">
                        ${item.karat ? item.karat + ' Gold' : ''} | Qty: <span class="text-white">${qty}</span>
                    </div>
                </div>
                <div class="text-gold font-bold" style="font-size: 1.1rem;">
                    $${itemTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
            </div>
        `;
    }).join('');

    // Totals
    const grandTotal = subtotal + CHECKOUT_SHIPPING_COST;

    if (subtotalEl) subtotalEl.innerText = '$' + subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (totalEl) totalEl.innerText = '$' + grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    // Hook up "Place Order" Button
    const placeOrderBtn = document.getElementById('place-order-btn');
    if (placeOrderBtn) {
        // Remove existing listeners to avoid duplicates (though refreshing page handles this)
        placeOrderBtn.replaceWith(placeOrderBtn.cloneNode(true));
        const newBtn = document.getElementById('place-order-btn');

        newBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const form = document.getElementById('checkout-form');
            if (form && !form.checkValidity()) {
                form.reportValidity();
                return;
            }

            // Simulate Order
            newBtn.innerText = 'PROCESSING...';
            newBtn.disabled = true;
            newBtn.style.opacity = '0.7';

            setTimeout(() => {
                alert('Order Placed Successfully! Thank you for shopping with Alquds Jewelry.');
                localStorage.removeItem('alquds_cart');
                window.location.href = 'index.html';
            }, 2000);
        });
    }
}
