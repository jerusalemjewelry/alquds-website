document.addEventListener('DOMContentLoaded', () => {
    loadCheckoutItems();

    // Update cart count in header
    const cart = JSON.parse(localStorage.getItem('alquds_cart')) || [];
    const count = cart.reduce((acc, item) => acc + item.quantity, 0);
    const badge = document.getElementById('cart-count');
    if (badge) badge.innerText = count;

    // Handle Place Order
    document.getElementById('place-order-btn').addEventListener('click', (e) => {
        e.preventDefault();

        // Basic Validation
        const form = document.getElementById('checkout-form');
        if (!form.checkValidity()) {
            // Trigger built-in browser validation UI
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
});

function loadCheckoutItems() {
    // 1. Get Cart
    const cart = JSON.parse(localStorage.getItem('alquds_cart')) || [];
    console.log("Checkout Cart:", cart); // Debug

    const container = document.getElementById('checkout-items');
    const subtotalEl = document.getElementById('checkout-subtotal');
    const totalEl = document.getElementById('checkout-total');

    // 2. Constants
    // Only charge shipping if cart has items
    const shippingCost = cart.length > 0 ? 50.00 : 0.00;

    // 3. Render Items
    if (cart.length === 0) {
        container.innerHTML = `
            <div class="text-center p-5" style="background: rgba(255,255,255,0.05); border-radius: 4px;">
                <p class="text-muted mb-2">Your cart is currently empty.</p>
                <a href="catalog.html" class="text-gold hover:text-white" style="text-decoration: underline;">Browse Collection</a>
            </div>
        `;
        subtotalEl.innerText = '$0.00';
        totalEl.innerText = '$0.00';
        return;
    }

    // 4. Calculate Subtotal & Generate HTML
    let subtotal = 0;

    const itemsHTML = cart.map((item, index) => {
        // Ensure price is a number
        const price = parseFloat(item.price) || 0;
        const qty = parseInt(item.quantity) || 1;
        const itemTotal = price * qty;

        subtotal += itemTotal;

        return `
            <div class="flex items-center gap-4 mb-4" style="background: rgba(0,0,0,0.2); padding: 10px; border-radius: 4px;">
                <div style="width: 80px; height: 80px; flex-shrink: 0; background: #222; border: 1px solid #444; overflow: hidden; border-radius: 4px;">
                    <img src="${item.image}" alt="${item.name}" style="width: 100%; height: 100%; object-fit: cover;">
                </div>
                <div style="flex: 1;">
                    <div class="text-white" style="font-family: var(--font-heading); font-size: 1.1rem; line-height: 1.2;">
                        ${item.name}
                    </div>
                    <div class="text-muted" style="font-size: 0.85rem; margin-top: 4px;">
                        ${item.karat ? item.karat + ' Gold' : ''} ${item.weight ? '| ' + item.weight : ''}
                    </div>
                    <div class="text-muted" style="font-size: 0.85rem;">
                        Qty: <span class="text-white">${qty}</span> × $${price.toLocaleString()}
                    </div>
                </div>
                <div class="text-gold font-bold" style="font-size: 1.1rem;">
                    $${itemTotal.toLocaleString()}
                </div>
            </div>
        `;
    }).join('');

    container.innerHTML = itemsHTML;

    // 5. Update Totals
    const grandTotal = subtotal + shippingCost;

    subtotalEl.innerText = '$' + subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    totalEl.innerText = '$' + grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    // Also update the static shipping cost display if needed, though it's hardcoded in HTML as $50.00. 
    // If cart is empty we handled return early.
}
