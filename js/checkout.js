// Register Default Trusted Types Policy for DOM Compatibility
if (window.trustedTypes && window.trustedTypes.createPolicy) {
    if (!window.trustedTypes.defaultPolicy) {
        window.trustedTypes.createPolicy('default', {
            createHTML: (string) => string,
            createScript: (string) => string,
            createScriptURL: (string) => string
        });
    }
}

// Dynamic shipping cost now calculated in calculateTotals()

document.addEventListener('DOMContentLoaded', () => {
    let isRedirecting = false;
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
                    <a href="/" class="btn btn-primary" style="padding: 15px 40px; text-decoration: none;">START SHOPPING</a>
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

        const imageUrl = (item.image && item.image.startsWith('assets/')) ? '/.netlify/images?url=/' + item.image : (item.image || '/.netlify/images?url=/assets/placeholder.png');
        return `
            <div class="flex items-center gap-4 mb-4" style="background: rgba(255,255,255,0.03); padding: 15px; border-radius: 4px; border: 1px solid rgba(255,255,255,0.05);">
                <div style="width: 70px; height: 70px; flex-shrink: 0; background: #000; border: 1px solid #333; overflow: hidden; border-radius: 4px;">
                    <img src="${imageUrl}" alt="${item.name}" style="width: 100%; height: 100%; object-fit: cover;">
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

        // Dynamic Shipping Calculation based on Jewelers Mutual math
        // JM uses a tiered insurance formula. Based on the data ($1k=$35, $5k=$45, $10k=$58):
        // Incremental insurance cost is precisely $2.50 for every $1,000 in value, rounding up.
        // The base cost for FedEx 2nd Day + Adult Signature is exactly $32.50.

        const insuranceRatePerThousand = 2.50;
        const totalThousands = Math.ceil(subtotal / 1000); // 1.1k rounds to 2k for insurance brackets
        // If order is $0, insurance is $0. Otherwise minimum 1 thousand block.
        const insuranceCost = subtotal > 0 ? (Math.max(1, totalThousands) * insuranceRatePerThousand) : 0;

        // --- Weight Calculation ---
        // Since we don't have exact weight values per item in the JSON, we estimate weight by quantity.
        // The base rate covers the first item. We add a small $1.50 fee for every additional item in the cart.
        let totalItemsInCart = 0;
        cart.forEach(item => { totalItemsInCart += (parseInt(item.quantity) || 1); });
        const additionalWeightSurcharge = subtotal > 0 && totalItemsInCart > 1 ? ((totalItemsInCart - 1) * 1.50) : 0;

        // --- Handling Fee (Profit) ---
        const handlingFee = 5.00;

        // Base Rates per speed
        const baseRates = {
            'standard': 26.50, // Approx Ground/Priority
            'express': 32.50,  // Exact 2nd Day Rate
            'overnight': 55.00 // Approx Overnight
        };

        let shippingCost = 0;
        if (subtotal > 0) {
            // Calculate final base rates including weight factor and profit margin
            const finalStandardBase = baseRates.standard + additionalWeightSurcharge + handlingFee;
            const finalExpressBase = baseRates.express + additionalWeightSurcharge + handlingFee;
            const finalOvernightBase = baseRates.overnight + additionalWeightSurcharge + handlingFee;

            // Update UI logic for individual boxes
            if (document.getElementById('cost-standard')) document.getElementById('cost-standard').innerText = '$' + (finalStandardBase + insuranceCost).toFixed(2);
            if (document.getElementById('cost-express')) document.getElementById('cost-express').innerText = '$' + (finalExpressBase + insuranceCost).toFixed(2);
            if (document.getElementById('cost-overnight')) document.getElementById('cost-overnight').innerText = '$' + (finalOvernightBase + insuranceCost).toFixed(2);

            const selectedSpeed = document.querySelector('input[name="shipping"]:checked');
            const speedValue = selectedSpeed ? selectedSpeed.value : 'express'; // Default to express

            // Map the selected speed to the fully calculated final base rate
            let selectedBaseRate = 0;
            if (speedValue === 'standard') selectedBaseRate = finalStandardBase;
            if (speedValue === 'express') selectedBaseRate = finalExpressBase;
            if (speedValue === 'overnight') selectedBaseRate = finalOvernightBase;

            shippingCost = selectedBaseRate + insuranceCost;
        }

        const tax = taxableAmount * taxRate;
        const subAndShippingAndTax = subtotal + shippingCost + tax;
        const serviceFee = subAndShippingAndTax * 0.03;
        const grandTotal = subAndShippingAndTax + serviceFee;

        console.log(`State: ${state}, Rate: ${taxRate}, Taxable: ${taxableAmount}, Tax: ${tax}, Fee: ${serviceFee}`);

        // Update UI
        if (subtotalEl) subtotalEl.innerText = '$' + subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const shippingCostEl = document.getElementById('checkout-shipping-cost');
        if (shippingCostEl) shippingCostEl.innerText = '$' + shippingCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

        const feeAmountEl = document.getElementById('checkout-fee-amount');
        if (feeAmountEl) feeAmountEl.innerText = '$' + serviceFee.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

        const taxLabel = document.getElementById('tax-label');
        const taxAmountEl = document.getElementById('checkout-tax-amount');
        if (taxLabel) taxLabel.innerText = (state === 'IL') ? `Tax (IL ${taxRate * 100}%):` : 'Estimated Tax:';
        if (taxAmountEl) taxAmountEl.innerText = '$' + tax.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

        if (totalEl) totalEl.innerText = '$' + grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        // Store the final calculated total for PayPal/Credit Card providers
        window.currentGrandTotal = grandTotal.toFixed(2);

        // Discard any open PayPal wrappers and re-render to ensure inline frames don't cache old prices
        if (typeof window.forcePayPalRefresh === 'function') {
            window.forcePayPalRefresh();
        }
        if (typeof window.forceStripeRefresh === 'function') {
            window.forceStripeRefresh();
        }
    }

    // Helper: Centralized Exemption Logic
    function isItemExempt(item) {
        // 1. Check ID Prefix 'Cb' (Case Insensitive)
        const idStr = String(item.id || '').toUpperCase();
        if (idStr.startsWith('CB')) return true;

        // 2. Check Category 'coins-bullions'
        const cat = (item.category || '').toLowerCase().trim();
        if (cat === 'coins-bullions') return true;

        // 3. Check specific keywords in Name (excluding jewelry items containing these words, e.g. "Coin Necklace")
        const name = (item.name || '').toUpperCase();
        const hasExemptKeyword = name.includes('BAR') || name.includes('BULLION') || name.includes('COIN') ||
                                 name.includes('SOVEREIGN') || name.includes('OUNCE') || name.includes('1 OZ') ||
                                 name.includes('MKHAMAS');
                                 
        const isJewelry = name.includes('NECKLACE') || name.includes('CHAIN') || name.includes('RING') ||
                          name.includes('BRACELET') || name.includes('EARRING') || name.includes('PENDANT') ||
                          name.includes('ANKLET') || name.includes('SET') || name.includes('HOLDER') ||
                          name.includes('FRAME') || name.includes('KLADA');

        if (hasExemptKeyword && !isJewelry) {
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

    // Listen for Shipping Change
    document.querySelectorAll('input[name="shipping"]').forEach(radio => {
        radio.addEventListener('change', calculateTotals);
    });

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

            const policyAgreement = document.getElementById('policy-agreement');
            if (policyAgreement && !policyAgreement.checked) {
                policyAgreement.reportValidity();
                return;
            }

            newBtn.innerText = 'PROCESSING...';
            newBtn.disabled = true;
            newBtn.style.opacity = '0.7';

            setTimeout(() => {
                const totalText = document.getElementById('checkout-total').innerText.replace(/[^0-9.]/g, '');
                const orderId = Math.floor(100000 + Math.random() * 900000);
                localStorage.removeItem('alquds_cart');
                window.location.href = `order-confirmation.html?id=${orderId}&total=${totalText}&method=Credit+Card`;
            }, 2000);
        });
    }

    // --- PAYPAL INTEGRATION ---
    window.forcePayPalRefresh = function () {
        if (!window.paypal) return;

        const container = document.getElementById('paypal-button-container');
        if (!container) return;

        // Wipe out any existing opened buttons or iframes to prevent locked frames
        container.innerHTML = '';

        // Hide the reset button just in case we are resetting the view
        const resetBtn = document.getElementById('reset-paypal-container');
        if (resetBtn) resetBtn.style.display = 'none';

        window.paypal.Buttons({
            onClick: function (data, actions) {
                const form = document.getElementById('checkout-form');
                const errorBox = document.getElementById('checkout-error-box');
                const policyAgreement = document.getElementById('policy-agreement');

                // If the form is missing required info...
                if (form && !form.checkValidity()) {
                    // Show our Custom Red Error Box
                    if (errorBox) {
                        errorBox.innerHTML = `<i class="fa-solid fa-triangle-exclamation" style="margin-right: 5px;"></i> <strong>Oops!</strong> Looks like you forgot to fill out your Personal & Shipping info. Please complete it before paying.`;
                        errorBox.style.display = 'block';
                    }

                    // Actually highlight the missing fields for them
                    form.reportValidity();

                    // Crucial: Reject the paypal action so it gracefully cancels the window 
                    return actions.reject();
                }

                // If the policy agreement is not checked...
                if (policyAgreement && !policyAgreement.checked) {
                    if (errorBox) {
                        errorBox.innerHTML = `<i class="fa-solid fa-triangle-exclamation" style="margin-right: 5px;"></i> You must agree to the Shipping & Return policies before placing your order.`;
                        errorBox.style.display = 'block';
                    }
                    policyAgreement.reportValidity();
                    return actions.reject();
                }

                // If everything is good, hide the error box if it was showing
                if (errorBox) errorBox.style.display = 'none';

                // Show the reset button when they click a payment option
                if (resetBtn) resetBtn.style.display = 'block';
                return actions.resolve();
            },
            onCancel: function (data) {
                // Hide it if they cancel/close the popup window
                if (resetBtn) resetBtn.style.display = 'none';
            },
            createOrder: function (data, actions) {
                // Ensure form validates before launching paypal
                const form = document.getElementById('checkout-form');
                if (form && !form.checkValidity()) {
                    form.reportValidity();
                    return false; // Prevent PayPal window if form is invalid
                }

                const policyAgreement = document.getElementById('policy-agreement');
                if (policyAgreement && !policyAgreement.checked) {
                    policyAgreement.reportValidity();
                    return false;
                }

                // Dynamically fetch the absolute latest accurate total straight from the DOM 
                // right at the second the PayPal window launches
                const currentTotalEl = document.getElementById('checkout-total');
                let freshTotal = "0.00";

                if (currentTotalEl) {
                    // Extract the raw number from text like "$8,987.40"
                    const rawText = currentTotalEl.innerText.replace(/[^0-9.]/g, '');
                    freshTotal = parseFloat(rawText || 0).toFixed(2);
                }

                // Extract user data from the form to auto-fill the PayPal/Credit Card window
                const firstName = document.querySelector('input[name="firstName"]')?.value || '';
                const lastName = document.querySelector('input[name="lastName"]')?.value || '';
                const email = document.querySelector('input[name="email"]')?.value || '';
                const phone = document.querySelector('input[name="phone"]')?.value || '';
                const address = document.querySelector('input[name="address"]')?.value || '';
                const city = document.querySelector('input[name="city"]')?.value || '';
                const zip = document.querySelector('input[name="zip"]')?.value || '';
                const stateDropdown = document.querySelector('select[name="state"]');
                const stateVal = stateDropdown ? stateDropdown.value : '';
                const countryDropdown = document.querySelector('select[name="country"]');
                const countryVal = countryDropdown ? countryDropdown.value : 'US';

                // Calculate Strict PayPal Breakdown
                let calcItemTotal = 0;
                const paypalItems = cart.map(item => {
                    const unitPrice = parseFloat(String(item.price).replace(/[^0-9.-]+/g, "")) || 0;
                    const qty = parseInt(item.quantity) || 1;
                    calcItemTotal += (unitPrice * qty);
                    return {
                        name: item.name.substring(0, 127),
                        sku: (item.id || item.sku || 'N/A').toString().substring(0, 127),
                        unit_amount: { currency_code: 'USD', value: unitPrice.toFixed(2) },
                        quantity: qty.toString()
                    };
                });
                const domShipping = parseFloat(document.getElementById('checkout-shipping-cost')?.innerText.replace(/[^0-9.]/g, '') || 0);
                const domTax = parseFloat(document.getElementById('checkout-tax-amount')?.innerText.replace(/[^0-9.]/g, '') || 0);
                const domFee = parseFloat(document.getElementById('checkout-fee-amount')?.innerText.replace(/[^0-9.]/g, '') || 0);
                const preciseTotal = (calcItemTotal + domShipping + domTax + domFee).toFixed(2);

                return actions.order.create({
                    intent: 'AUTHORIZE',
                    application_context: {
                        shipping_preference: 'SET_PROVIDED_ADDRESS'
                    },
                    payer: {
                        name: {
                            given_name: firstName,
                            surname: lastName
                        },
                        email_address: email || undefined
                    },
                    purchase_units: [{
                        amount: {
                            currency_code: 'USD',
                            value: preciseTotal,
                            breakdown: {
                                item_total: { currency_code: 'USD', value: calcItemTotal.toFixed(2) },
                                shipping: { currency_code: 'USD', value: domShipping.toFixed(2) },
                                tax_total: { currency_code: 'USD', value: domTax.toFixed(2) },
                                handling: { currency_code: 'USD', value: domFee.toFixed(2) }
                            }
                        },
                        items: paypalItems,
                        description: cart.map(i => `${i.quantity}x ${i.name}`).join(", ").substring(0, 127),
                        shipping: {
                            name: {
                                full_name: `${firstName} ${lastName}`.trim() || 'Customer'
                            },
                            address: {
                                address_line_1: address || 'N/A',
                                admin_area_2: city || 'N/A',
                                admin_area_1: stateVal || 'N/A',
                                postal_code: zip || '00000',
                                country_code: (countryVal === 'OTHER' ? 'US' : countryVal) || 'US'
                            }
                        }
                    }]
                });
            },
            onApprove: function (data, actions) {
                return actions.order.authorize().then(function (details) {
                    // Extract total safely depending on PayPal's response structure
                    const authAmount = details.purchase_units?.[0]?.payments?.authorizations?.[0]?.amount?.value;
                    const captureAmount = details.purchase_units?.[0]?.payments?.captures?.[0]?.amount?.value;
                    const rootAmount = details.purchase_units?.[0]?.amount?.value;
                    const fallbackAmount = document.getElementById('checkout-total')?.innerText.replace(/[^0-9.]/g, '') || '0.00';
                    
                    const totalPaid = rootAmount || authAmount || captureAmount || fallbackAmount;
                    const orderId = details.id || Math.floor(100000 + Math.random() * 900000);

                    // Re-extract form variables since they are block-scoped to createOrder
                    const firstName = document.querySelector('input[name="firstName"]')?.value || '';
                    const lastName = document.querySelector('input[name="lastName"]')?.value || '';
                    const phone = document.querySelector('input[name="phone"]')?.value || '';
                    const address = document.querySelector('input[name="address"]')?.value || '';
                    const city = document.querySelector('input[name="city"]')?.value || '';
                    const zip = document.querySelector('input[name="zip"]')?.value || '';
                    const stateDropdown = document.querySelector('select[name="state"]');
                    const stateVal = stateDropdown ? stateDropdown.value : '';
                    const countryDropdown = document.querySelector('select[name="country"]');
                    const countryVal = countryDropdown ? countryDropdown.value : 'US';

                    // Send Confirmation Email automatically in the background (keepalive ensures it sends even if page unloads)
                    fetch('/.netlify/functions/send-order-email', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        keepalive: true,
                        body: JSON.stringify({
                            customerEmail: details.payer.email_address,
                            customerName: details.payer.name.given_name,
                            orderNumber: orderId,
                            total: totalPaid,
                            cartItems: cart,
                            shippingAddress: {
                                name: `${firstName} ${lastName}`.trim(),
                                address: address,
                                city: city,
                                state: stateVal,
                                zip: zip,
                                country: countryVal,
                                phone: phone
                            }
                        })
                    }).catch(err => console.error("Email trigger failed", err));

                    // Clear the cart and redirect to order confirmation INSTANTLY
                    localStorage.removeItem('alquds_cart');
                    isRedirecting = true;
                    window.location.href = `order-confirmation.html?id=${orderId}&total=${totalPaid}&method=PayPal`;
                });
            },
            onError: function (err) {
                if (isRedirecting) return; // Ignore errors caused by page unload during success redirect
                console.error("PayPal Error:", err);
                alert("There was an error processing your PayPal payment. Please try again.");
            }
        }).render('#paypal-button-container');
    };

    // --- STRIPE INTEGRATION ---
    const stripePublicKey = 'pk_live_51TwpnVAIeLqFl7hQaCuhcDV5h6n4CxkOSfTlS8fQayo89ZH2QpyifO9ofXj1zspdl5dN0x5T3IbOYqQMzaFqiJXt00ygJzL0wZ';
    let stripe, elements, paymentElement;

    const radios = document.querySelectorAll('input[name="paymentMethod"]');
    const stripeContainer = document.getElementById('stripe-container');
    const paypalContainer = document.getElementById('paypal-container');
    const stripeSubmitBtn = document.getElementById('stripe-submit-btn');
    const stripeError = document.getElementById('stripe-error-message');

    if (radios.length > 0) {
        radios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                if (e.target.value === 'stripe') {
                    if (stripeContainer) stripeContainer.style.display = 'block';
                    if (paypalContainer) paypalContainer.style.display = 'none';
                } else {
                    if (stripeContainer) stripeContainer.style.display = 'none';
                    if (paypalContainer) paypalContainer.style.display = 'block';
                }
            });
        });
    }

    window.forceStripeRefresh = async function() {
        if (!document.getElementById('stripe-payment-element')) return;
        
        try {
            if (!stripe) {
                stripe = Stripe(stripePublicKey);
            }
            
            if (!window.currentGrandTotal) return;

            const response = await fetch('/.netlify/functions/create-stripe-intent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount: window.currentGrandTotal })
            });

            const data = await response.json();

            if (!response.ok) {
                console.error("Stripe Intent Error:", data);
                const peContainer = document.getElementById('stripe-payment-element');
                peContainer.innerHTML = `<div style="color: #ff4444; text-align: center; font-size: 0.9rem; padding: 10px;">
                    <i class="fa-solid fa-triangle-exclamation"></i> <b>Stripe Connection Error:</b><br>
                    ${data.error || 'Could not connect to Stripe Backend. Did you upload create-stripe-intent.js and re-deploy Netlify after adding the Secret Key?'}
                </div>`;
                return;
            }

            const appearance = {
                theme: 'night',
                variables: {
                    colorPrimary: '#d4af37',
                    colorBackground: '#111111',
                    colorText: '#ffffff',
                    colorDanger: '#ff4444',
                    fontFamily: 'Lato, sans-serif',
                }
            };

            elements = stripe.elements({ clientSecret: data.clientSecret, appearance });
            
            const peContainer = document.getElementById('stripe-payment-element');
            peContainer.innerHTML = ''; // Clear old

            paymentElement = elements.create('payment');
            paymentElement.mount('#stripe-payment-element');

        } catch (error) {
            console.error('Failed to initialize Stripe:', error);
        }
    };

    if (stripeSubmitBtn) {
        stripeSubmitBtn.addEventListener('click', async () => {
            if (!stripe || !elements) return;

            // Validate form
            const form = document.getElementById('checkout-form');
            const checkbox = document.getElementById('policy-agreement');
            
            if (!form.checkValidity() || !checkbox.checked) {
                document.getElementById('checkout-error-box').style.display = 'block';
                window.scrollTo({ top: document.getElementById('checkout-error-box').offsetTop - 100, behavior: 'smooth' });
                return;
            }
            document.getElementById('checkout-error-box').style.display = 'none';

            stripeSubmitBtn.disabled = true;
            stripeSubmitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> PROCESSING...';
            stripeError.style.display = 'none';

            const firstName = document.querySelector('input[name="firstName"]')?.value || '';
            const lastName = document.querySelector('input[name="lastName"]')?.value || '';
            const email = document.querySelector('input[name="email"]')?.value || '';
            const address = document.querySelector('input[name="address"]')?.value || '';
            const city = document.querySelector('input[name="city"]')?.value || '';
            const zip = document.querySelector('input[name="zip"]')?.value || '';
            const stateVal = document.querySelector('select[name="state"]')?.value || '';
            const countryVal = document.querySelector('select[name="country"]')?.value || 'US';
            const phone = document.querySelector('input[name="phone"]')?.value || '';

            // Save details to localStorage in case of 3D Secure redirect
            localStorage.setItem('alquds_checkout_details', JSON.stringify({
                firstName, lastName, email, address, city, zip, stateVal, countryVal, phone,
                totalPaid: window.currentGrandTotal,
                cart: JSON.parse(localStorage.getItem('alquds_cart') || '[]')
            }));

            const { error, paymentIntent } = await stripe.confirmPayment({
                elements,
                confirmParams: {
                    return_url: window.location.origin + '/order-confirmation.html',
                    payment_method_data: {
                        billing_details: {
                            name: `${firstName} ${lastName}`.trim(),
                            email: email,
                            address: {
                                line1: address,
                                city: city,
                                state: stateVal,
                                postal_code: zip,
                                country: countryVal === 'OTHER' ? 'US' : countryVal
                            }
                        }
                    }
                },
                redirect: 'if_required'
            });

            if (error) {
                stripeError.innerText = error.message;
                stripeError.style.display = 'block';
                stripeSubmitBtn.disabled = false;
                stripeSubmitBtn.innerHTML = '<i class="fa-solid fa-lock"></i> PAY NOW';
            } else if (paymentIntent && (paymentIntent.status === 'requires_capture' || paymentIntent.status === 'succeeded')) {
                const orderId = paymentIntent.id;

                fetch('/.netlify/functions/send-order-email', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    keepalive: true,
                    body: JSON.stringify({
                        customerEmail: email,
                        customerName: firstName,
                        orderNumber: orderId,
                        total: window.currentGrandTotal,
                        cartItems: JSON.parse(localStorage.getItem('alquds_cart') || '[]'),
                        shippingAddress: {
                            name: `${firstName} ${lastName}`.trim(),
                            address: address,
                            city: city,
                            state: stateVal,
                            zip: zip,
                            country: countryVal,
                            phone: phone
                        }
                    })
                }).catch(err => console.error("Email trigger failed", err));

                localStorage.removeItem('alquds_cart');
                localStorage.removeItem('alquds_checkout_details');
                isRedirecting = true;
                window.location.href = `order-confirmation.html?id=${orderId}&total=${window.currentGrandTotal}&method=Stripe`;
            }
        });
    }

    // Run the integration on initial load
    window.forcePayPalRefresh();
    window.forceStripeRefresh();
}
