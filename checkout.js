document.addEventListener('DOMContentLoaded', () => {
    console.log("Checkout Page Loaded");

    // 1. Load Cart Safely
    let cart = [];
    try {
        const raw = localStorage.getItem('alquds_cart');
        console.log("Raw Cart Data:", raw);
        cart = raw ? JSON.parse(raw) : [];
    } catch (e) {
        console.error("Error parsing cart:", e);
        cart = [];
    }

    console.log("Parsed Cart:", cart);

    // 2. Update Header Count
    updateHeaderCount(cart);

    // 3. Load Items into Overview
    loadCheckoutItems(cart);

    // Handle Place Order
    const placeOrderBtn = document.getElementById('place-order-btn');
    if (placeOrderBtn) {
        placeOrderBtn.addEventListener('click', (e) => {
            e.preventDefault();

            // Basic Validation
            const form = document.getElementById('checkout-form');
            if (form && !form.checkValidity()) {
                form.reportValidity();
                return;
            }

            if (cart.length === 0) {
                alert('Your cart is empty.');
                return;
            }

            // Simulate Order Processing
            const btn = document.getElementById('place-order-btn');
            const originalText = btn.innerText;
            btn.innerText = 'PROCESSING...';
            btn.disabled = true;
            btn.style.opacity = '0.7';

            setTimeout(() => {
                alert('Order Placed Successfully! Thank you for shopping with Alquds Jewelry.');
                localStorage.removeItem('alquds_cart'); // Clear cart
                window.location.href = 'index.html';
            }, 2000);
        });
    }
});

function updateHeaderCount(cart) {
    const count = cart.reduce((acc, item) => acc + (parseInt(item.quantity) || 0), 0);
    const badge = document.getElementById('cart-count');
    if (badge) badge.innerText = count;
}

function loadCheckoutItems(cart) {
    const container = document.getElementById('checkout-items');
    const subtotalEl = document.getElementById('checkout-subtotal');
    const totalEl = document.getElementById('checkout-total');

    if (!container || !subtotalEl || !totalEl) {
        console.error("Checkout elements not found!");
        return;
    }

    // Fixed Shipping Logic: Only apply if cart has items
    const shippingCost = cart.length > 0 ? 50.00 : 0.00;

    if (cart.length === 0) {
        container.innerHTML = `
            <div class="text-center p-5" style="border: 1px dashed var(--color-gray); border-radius: 4px; padding: 30px;">
                <p class="text-white mb-3" style="font-size: 1.1rem;">Your cart is currently empty.</p>
                <p class="text-muted mb-4" style="font-size: 0.9rem;">Add items to your bag to proceed with checkout.</p>
                <a href="catalog.html" class="btn btn-primary" style="text-decoration: none; padding: 10px 20px;">Browse Collection</a>
            </div>
        `;
        subtotalEl.innerText = '$0.00';
        totalEl.innerText = '$0.00';
        return;
    }

    let subtotal = 0;

    const itemsHTML = cart.map((item) => {
        const price = parseFloat(item.price) || 0;
        const qty = parseInt(item.quantity) || 1;
        const itemTotal = price * qty;

        subtotal += itemTotal;

        // Ensure image source is valid, fallback if needed
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
                        ${item.karat ? item.karat + ' Gold' : ''} ${item.weight ? ' | ' + item.weight : ''}
                    </div>
                    <div class="text-gold" style="font-size: 0.9rem; margin-top: 5px;">
                        $${price.toLocaleString()} x ${qty}
                    </div>
                </div>
                <div class="text-white font-bold" style="font-size: 1.1rem;">
                    $${itemTotal.toLocaleString()}
                </div>
            </div>
        `;
    }).join('');

    container.innerHTML = itemsHTML;

    // Totals
    const grandTotal = subtotal + shippingCost;

    subtotalEl.innerText = '$' + subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    totalEl.innerText = '$' + grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
