const CHECKOUT_SHIPPING_COST = 50.00;

document.addEventListener('DOMContentLoaded', () => {
    // DEBUG: Inject visual troubleshooter
    const debugBox = document.createElement('div');
    debugBox.style.cssText = "position:absolute; top:0; left:0; width:100%; height: auto; background: red; color: white; padding: 10px; z-index: 9999; font-weight: bold; font-family: monospace; white-space: pre-wrap;";
    document.body.appendChild(debugBox);

    function log(msg) {
        debugBox.innerHTML += msg + "\n";
        console.log(msg);
    }
    log("=== DEBUG CHECKOUT ===");

    // 1. Get LocalStorage Cart Objects (IDs and Quantities)
    let cart = [];
    try {
        const raw = localStorage.getItem('alquds_cart');
        log("Raw LS Data: " + (raw ? raw.substring(0, 100) + '...' : 'NULL'));
        cart = raw ? JSON.parse(raw) : [];
        log("Parsed Cart Length: " + cart.length);
    } catch (e) {
        log("Cart parse error: " + e);
        cart = [];
    }

    // 2. Update Header
    const count = cart.reduce((acc, item) => acc + (parseInt(item.quantity) || 0), 0);
    const badge = document.getElementById('cart-count');
    if (badge) badge.innerText = count;

    // 3. Render State
    if (cart.length === 0) {
        log("Rendering Empty State...");
        renderEmptyState();
    } else {
        log("Rendering Checkout...");
        renderCheckout(cart, log);
    }
});

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

function renderCheckout(cart, log) {
    const itemsContainer = document.getElementById('checkout-items');
    const subtotalEl = document.getElementById('checkout-subtotal');
    const totalEl = document.getElementById('checkout-total');

    if (!itemsContainer) {
        if (log) log("ERROR: #checkout-items not found!");
        return;
    }

    let subtotal = 0;

    itemsContainer.innerHTML = cart.map(item => {
        // Safe Price Parsing from (potentially formatted) string
        let rawPrice = item.price;
        if (log) log(`Item: ${item.name}, Raw Price: ${rawPrice} (${typeof rawPrice})`);

        if (typeof rawPrice === 'string') {
            rawPrice = rawPrice.replace(/[^0-9.-]+/g, "");
        }
        let price = parseFloat(rawPrice);
        if (isNaN(price)) price = 0;

        if (log) log(`Parsed Price: ${price}`);

        const qty = parseInt(item.quantity) || 1;

        const itemTotal = price * qty;
        subtotal += itemTotal;

        return `
            <div class="flex items-center gap-4 mb-4" style="background: rgba(255,255,255,0.03); padding: 15px; border-radius: 4px; border: 1px solid rgba(255,255,255,0.05);">
                <div style="width: 70px; height: 70px; flex-shrink: 0; background: #000; border: 1px solid #333; overflow: hidden; border-radius: 4px;">
                    <img src="${item.image || 'assets/placeholder.png'}" alt="${item.name}" style="width: 100%; height: 100%; object-fit: cover;">
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

    // State-based Tax Logic
    const stateSelect = document.getElementById('state');
    let taxRate = 0;

    function calculateTotals() {
        const state = stateSelect ? stateSelect.value : '';
        // Tax applies ONLY if state is IL
        taxRate = (state === 'IL') ? 0.10 : 0; // 10% for Illinois

        // Calculate Taxable Subtotal
        // Coins & Bullions are ALWAYS exempt
        let taxableSubtotal = 0;
        cart.forEach(item => {
            const isExempt = item.category === 'coins-bullions';
            if (!isExempt) {
                let price = parseFloat(String(item.price).replace(/[^0-9.-]+/g, "")) || 0;
                taxableSubtotal += price * (parseInt(item.quantity) || 1);
            }
        });

        const taxAmount = taxableSubtotal * taxRate;
        const grandTotal = subtotal + taxAmount + CHECKOUT_SHIPPING_COST; // Assuming fixed shipping for now

        if (subtotalEl) subtotalEl.innerText = '$' + subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

        // Update Tax Display
        const taxEl = document.getElementById('checkout-tax');
        if (taxEl) taxEl.innerText = '$' + taxAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

        if (totalEl) totalEl.innerText = '$' + grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

        if (log) log(`State: ${state}, Tax Rate: ${taxRate}, Taxable Subtotal: ${taxableSubtotal}, Tax: ${taxAmount}, GrandTotal: ${grandTotal}`);
    }

    // Initial Calculation
    calculateTotals();

    // Re-calculate on State Change
    if (stateSelect) {
        stateSelect.addEventListener('change', calculateTotals);
    }

    // Hook up "Place Order" Button
    const placeOrderBtn = document.getElementById('place-order-btn');
    if (placeOrderBtn) {
        placeOrderBtn.replaceWith(placeOrderBtn.cloneNode(true));
        const newBtn = document.getElementById('place-order-btn');

        newBtn.addEventListener('click', (e) => {
            e.preventDefault();

            // Remove Debug Box
            const dbg = document.querySelector('div[style*="background: red"]');
            if (dbg) dbg.remove();

            const form = document.getElementById('checkout-form');
            if (form && !form.checkValidity()) {
                form.reportValidity();
                return;
            }

            newBtn.innerText = 'PROCESSING...';
            newBtn.disabled = true;
            newBtn.style.opacity = '0.7';

            setTimeout(() => {
                alert('Order Placed Successfully! Thank you for shopping with Alquds Jewelry.');
                localStorage.removeItem('alquds_cart');
                window.location.href = 'index.html';
            }, 2000);
        });
    } else {
        if (log) log("ERROR: #place-order-btn not found");
    }
}
