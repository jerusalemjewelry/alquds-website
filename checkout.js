document.addEventListener('DOMContentLoaded', () => {
    // 1. Get Cart
    let cart = [];
    try {
        const raw = localStorage.getItem('alquds_cart');
        cart = raw ? JSON.parse(raw) : [];
    } catch (e) {
        console.error("Cart parse error:", e);
        cart = [];
    }

    // 2. Update Header
    const count = cart.reduce((acc, item) => acc + (parseInt(item.quantity) || 0), 0);
    const badge = document.getElementById('cart-count');
    if (badge) badge.innerText = count;

    // 3. Handle Empty State vs Active State
    if (cart.length === 0) {
        renderEmptyState();
    } else {
        renderCheckout(cart);
    }
});

function renderEmptyState() {
    const container = document.querySelector('.container');
    // Replace valid content with Empty Message
    container.innerHTML = `
        <div class="text-center" style="padding: 100px 20px;">
            <i class="fa-solid fa-cart-shopping text-muted" style="font-size: 4rem; margin-bottom: 20px;"></i>
            <h1 class="text-white mb-4">Your Bag is Empty</h1>
            <p class="text-muted mb-8">It looks like you haven't added any jewelry to your collection yet.</p>
            <a href="catalog.html" class="btn btn-primary" style="padding: 15px 40px; text-decoration: none;">START SHOPPING</a>
        </div>
    `;
}

function renderCheckout(cart) {
    // We are on the existing form, just populate the dynamic bits
    const itemsContainer = document.getElementById('checkout-items');
    const subtotalEl = document.getElementById('checkout-subtotal');
    const totalEl = document.getElementById('checkout-total');

    // 1. Render Items
    let subtotal = 0;

    itemsContainer.innerHTML = cart.map(item => {
        // Robust Price Parsing
        let rawPrice = item.price;
        if (typeof rawPrice === 'string') {
            rawPrice = rawPrice.replace(/[^0-9.-]+/g, "");
        }
        const price = parseFloat(rawPrice) || 0;
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

    // 2. Calculations
    const shipping = 50.00;
    const grandTotal = subtotal + shipping;

    // 3. Update Text
    if (subtotalEl) subtotalEl.innerText = '$' + subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (totalEl) totalEl.innerText = '$' + grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    // 4. Hook up "Place Order" Button
    const placeOrderBtn = document.getElementById('place-order-btn');
    if (placeOrderBtn) {
        placeOrderBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const form = document.getElementById('checkout-form');
            if (form && !form.checkValidity()) {
                form.reportValidity();
                return;
            }

            placeOrderBtn.innerText = 'PROCESSING...';
            placeOrderBtn.disabled = true;
            placeOrderBtn.style.opacity = '0.7';

            setTimeout(() => {
                alert('Order Placed Successfully! Thank you for shopping with Alquds Jewelry.');
                localStorage.removeItem('alquds_cart');
                window.location.href = 'index.html';
            }, 2000);
        });
    }
}
