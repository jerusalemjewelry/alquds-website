const CHECKOUT_SHIPPING_COST = 50.00;

document.addEventListener('DOMContentLoaded', () => {
    console.log("=== CHECKOUT LOADED ===");

    // 1. Get LocalStorage Cart Objects
    let cart = [];
    try {
        const raw = localStorage.getItem('alquds_cart');
        cart = raw ? JSON.parse(raw) : [];
        console.log("Cart Items:", cart);
    } catch (e) {
        console.error("Cart parse error:", e);
        cart = [];
    }

    // 2. Update Header Count
    const count = cart.reduce((acc, item) => acc + (parseInt(item.quantity) || 0), 0);
    const badge = document.getElementById('cart-count');
    if (badge) badge.innerText = count;

    // 3. Render State
    if (cart.length === 0) {
        renderEmptyState();
    } else {
        renderCheckout(cart);
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

function renderCheckout(cart) {
    const itemsContainer = document.getElementById('checkout-items');
    const subtotalEl = document.getElementById('checkout-subtotal');
    const totalEl = document.getElementById('checkout-total');
    // FIX: Select by NAME attribute since ID is missing in HTML
    const stateSelect = document.querySelector('select[name="state"]');
    const taxEl = document.getElementById('checkout-tax');

    if (!itemsContainer) return;

    // --- RENDER ITEMS ---
    let subtotal = 0;

    // Separate Lists Logic you requested:
    // We render ALL items here, but internally track which are exempt
    itemsContainer.innerHTML = cart.map(item => {
        let price = parseFloat(String(item.price).replace(/[^0-9.-]+/g, "")) || 0;
        const qty = parseInt(item.quantity) || 1;
        const itemTotal = price * qty;
        subtotal += itemTotal;

        // Check Exemption for UI Label
        const isExempt = isItemExempt(item);
        const exemptLabel = isExempt ? '<div style="color: #4ade80; font-size: 0.8rem; margin-top: 4px;">Tax Exempt (Bullion)</div>' : '';

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
                    ${exemptLabel}
                </div>
                <div class="text-gold font-bold" style="font-size: 1.1rem;">
                    $${itemTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
            </div>
        `;
    }).join('');

    // --- TAX CALCULATION LOGIC ---
    function calculateTotals() {
        const state = stateSelect ? stateSelect.value : '';
        const taxRate = (state === 'IL') ? 0.10 : 0;

        let taxableAmount = 0;
        let exemptAmount = 0;

        cart.forEach(item => {
            let price = parseFloat(String(item.price).replace(/[^0-9.-]+/g, "")) || 0;
            const qty = parseInt(item.quantity) || 1;
            const total = price * qty;

            if (isItemExempt(item)) {
                exemptAmount += total;
                console.log(`EXEMPT ITEM: ${item.name} ($${total})`);
            } else {
                taxableAmount += total;
                console.log(`TAXABLE ITEM: ${item.name} ($${total})`);
            }
        });

        const tax = taxableAmount * taxRate;
        const grandTotal = subtotal + tax + CHECKOUT_SHIPPING_COST;

        console.log(`State: ${state}, Rate: ${taxRate}, Taxable: ${taxableAmount}, Tax: ${tax}`);

        // Update UI
        if (subtotalEl) subtotalEl.innerText = '$' + subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

        // Dynamically Update/Create Tax Row
        let taxRow = document.getElementById('checkout-tax-row');
        if (!taxRow && totalEl) {
            // Create Tax Row if missing
            const container = totalEl.closest('.flex.flex-col');
            const totalRow = totalEl.closest('div'); // Grand Total Row
            const newRow = document.createElement('div');
            newRow.id = 'checkout-tax-row';
            newRow.className = 'flex justify-between';
            newRow.style.width = '300px';
            newRow.style.marginBottom = '10px';
            newRow.innerHTML = `<span class="text-muted" id="tax-label">Estimated Tax:</span><span class="text-white" id="checkout-tax-amount">$0.00</span>`;
            if (container && totalRow) {
                container.insertBefore(newRow, totalRow);
            }
            taxRow = newRow;
        }

        if (taxRow) {
            const taxLabel = document.getElementById('tax-label');
            const taxAmountEl = document.getElementById('checkout-tax-amount');
            if (taxLabel) taxLabel.innerText = (state === 'IL') ? `Tax (IL ${taxRate * 100}%):` : 'Estimated Tax:';
            if (taxAmountEl) taxAmountEl.innerText = '$' + tax.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        }

        if (totalEl) totalEl.innerText = '$' + grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    // Helper: Centralized Exemption Logic
    function isItemExempt(item) {
        // 1. Check ID Prefix 'Cb' (Case Insensitive)
        const idStr = String(item.id || '').toUpperCase();
        if (idStr.startsWith('CB')) return true;

        // 2. Check Category 'coins-bullions'
        const cat = (item.category || '').toLowerCase().trim();
        if (cat === 'coins-bullions') return true;

        // 3. Check specific keywords in Name
        const name = (item.name || '').toUpperCase();
        if (name.includes('BAR') || name.includes('BULLION') || name.includes('COIN') ||
            name.includes('SOVEREIGN') || name.includes('OUNCE') || name.includes('1 OZ') ||
            name.includes('MKHAMAS')) {
            return true;
        }

        return false;
    }

    // Initial Recalc
    calculateTotals();

    // Listen for State Change
    if (stateSelect) {
        stateSelect.addEventListener('change', calculateTotals);
    }

    // --- PLACE ORDER BUTTON ---
    const placeOrderBtn = document.getElementById('place-order-btn');
    if (placeOrderBtn) {
        placeOrderBtn.replaceWith(placeOrderBtn.cloneNode(true));
        const newBtn = document.getElementById('place-order-btn');

        newBtn.addEventListener('click', (e) => {
            e.preventDefault();
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
    }
}
