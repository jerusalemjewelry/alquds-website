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
    const cart = JSON.parse(localStorage.getItem('alquds_cart')) || [];
    const container = document.getElementById('checkout-items');
    const subtotalEl = document.getElementById('checkout-subtotal');
    const totalEl = document.getElementById('checkout-total');

    // Fixed Shipping
    const shippingCost = 50.00;

    if (cart.length === 0) {
        container.innerHTML = '<p class="text-muted text-center">Cart is empty</p>';
        subtotalEl.innerText = '$0.00';
        totalEl.innerText = '$0.00';
        return;
    }

    let subtotal = 0;

    container.innerHTML = cart.map(item => {
        const itemTotal = item.price * item.quantity;
        subtotal += itemTotal;
        return `
            <div class="flex items-center gap-4 mb-4">
                <img src="${item.image}" style="width: 80px; height: 80px; object-fit: cover; border: 1px solid #333;">
                <div style="flex: 1;">
                    <div class="text-white" style="font-size: 1.1rem; font-family: var(--font-heading);">${item.name}</div>
                    <div class="text-muted" style="font-size: 0.9rem;">${item.karat} Gold | ${item.weight}</div>
                    <div class="text-muted" style="font-size: 0.9rem;">Qty: ${item.quantity}</div>
                </div>
                <div class="text-white" style="font-size: 1.1rem;">$${itemTotal.toLocaleString()}</div>
            </div>
        `;
    }).join('');

    const grandTotal = subtotal + shippingCost;

    subtotalEl.innerText = '$' + subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    // Total includes shipping
    totalEl.innerText = '$' + grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
