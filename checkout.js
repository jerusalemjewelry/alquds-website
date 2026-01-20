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
            alert('Please fill in all required shipping fields.');
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

    if (cart.length === 0) {
        container.innerHTML = '<p class="text-muted text-center">Cart is empty</p>';
        subtotalEl.innerText = '$0.00';
        totalEl.innerText = '$0.00';
        return;
    }

    let total = 0;

    container.innerHTML = cart.map(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        return `
            <div class="flex items-center gap-3 mb-3">
                <img src="${item.image}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px;">
                <div style="flex: 1;">
                    <div class="text-white" style="font-size: 0.9rem;">${item.name}</div>
                    <div class="text-muted" style="font-size: 0.8rem;">Qty: ${item.quantity}</div>
                </div>
                <div class="text-gold" style="font-size: 0.9rem;">$${itemTotal.toLocaleString()}</div>
            </div>
        `;
    }).join('');

    subtotalEl.innerText = '$' + total.toLocaleString();
    totalEl.innerText = '$' + total.toLocaleString();
}
