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
        if (!window.paypal) {
            console.log("PayPal SDK not loaded yet.");
            return;
        }

        const container = document.getElementById('paypal-button-container');
        if (!container) return;
        container.innerHTML = '';

        const resetBtn = document.getElementById('reset-paypal-container');
        if (resetBtn) resetBtn.style.display = 'none';

        window.paypal.Buttons({
            onClick: function (data, actions) {
                const form = document.getElementById('checkout-form');
                const policyAgreement = document.getElementById('policy-agreement');
                if (form && !form.checkValidity()) {
                    form.reportValidity();
                    return actions.reject();
                }
                if (policyAgreement && !policyAgreement.checked) {
                    policyAgreement.reportValidity();
                    return actions.reject();
                }
                return actions.resolve();
            },
            onCancel: function (data) {
                // Do nothing
            },
            createOrder: function (data, actions) {
                const form = document.getElementById('checkout-form');
                if (form && !form.checkValidity()) return false;

                let calcItemTotal = 0;
                let cart = JSON.parse(localStorage.getItem('alquds_cart')) || [];
                const paypalItems = cart.map((item, idx) => {
                    const unitPrice = parseFloat(String(item.price).replace(/[^0-9.-]+/g, "")) || 0;
                    const qty = parseInt(item.quantity) || 1;
                    calcItemTotal += (unitPrice * qty);

                    const baseName = (item.name || item.title || 'Jewelry Item').trim();
                    const rawSkuCandidate = item.itemNo || item.sku || item.id || item.code;
                    const fallbackSku = 'ITEM-' + (idx + 1);
                    const cleanSku = (rawSkuCandidate ? String(rawSkuCandidate).replace(/[^a-zA-Z0-9_.-]/g, '').trim() : '') || fallbackSku;

                    const specDetails = [];
                    if (item.karat) specDetails.push(item.karat + 'k Gold');
                    if (item.weight && item.weight !== 'N/A' && item.weight !== 'Varies') specDetails.push(item.weight + 'g');
                    if (item.size) specDetails.push('Size: ' + item.size);
                    if (item.length) specDetails.push('Length: ' + item.length);
                    if (item.customName) specDetails.push('Custom: ' + item.customName);

                    const specStr = specDetails.length > 0 ? ' (' + specDetails.join(', ') + ')' : '';

                    let cleanName = (baseName + specStr).replace(/[^\w\s.,&'()-]/gi, '').trim();
                    if (!cleanName) cleanName = baseName.replace(/[^\w\s.,&'()-]/gi, '').trim() || 'Jewelry Item';
                    cleanName = cleanName.substring(0, 127);

                    const descText = (baseName + (specDetails.length > 0 ? ' | ' + specDetails.join(' | ') : '') + ' | SKU: ' + cleanSku).substring(0, 127);

                    return {
                        name: cleanName,
                        sku: cleanSku.substring(0, 60),
                        description: descText,
                        unit_amount: { currency_code: 'USD', value: unitPrice.toFixed(2) },
                        quantity: qty.toString(),
                        category: 'PHYSICAL_GOODS'
                    };
                });

                const domShippingStr = document.getElementById('checkout-shipping-cost')?.innerText || '0';
                const shippingNum = domShippingStr.includes('Free') ? 0 : (parseFloat(domShippingStr.replace(/[^0-9.-]+/g, '') || 0));
                const taxNum = (parseFloat(document.getElementById('checkout-tax-amount')?.innerText.replace(/[^0-9.-]+/g, '') || 0));
                const domFeeStr = document.getElementById('checkout-fee-amount')?.innerText || '0';
                const handlingNum = (parseFloat(domFeeStr.replace(/[^0-9.-]+/g, '') || 0));
                
                const itemTotalNum = parseFloat(calcItemTotal.toFixed(2));
                const exactGrandTotal = (itemTotalNum + shippingNum + taxNum + handlingNum).toFixed(2);

                const firstName = document.querySelector('input[name="firstName"]')?.value || '';
                const lastName = document.querySelector('input[name="lastName"]')?.value || '';
                const email = document.querySelector('input[name="email"]')?.value || '';
                const address = document.querySelector('input[name="address"]')?.value || '';
                const city = document.querySelector('input[name="city"]')?.value || '';
                const zip = document.querySelector('input[name="zip"]')?.value || '';
                const stateDropdown = document.querySelector('select[name="state"]');
                const stateVal = stateDropdown ? stateDropdown.value : '';
                const countryDropdown = document.querySelector('select[name="country"]');
                const countryVal = countryDropdown ? countryDropdown.value : 'US';

                const cleanState = (stateVal && stateVal !== 'OTHER' && stateVal.length === 2) ? stateVal.toUpperCase() : 'IL';
                const cleanCountry = (countryVal && countryVal !== 'OTHER' && countryVal.length === 2) ? countryVal.toUpperCase() : 'US';

                const summaryDesc = paypalItems.map(i => i.name + ' (' + i.sku + ')').join(', ').substring(0, 120) || 'Jewelry Purchase';

                return actions.order.create({
                    intent: 'CAPTURE',
                    application_context: {
                        shipping_preference: 'SET_PROVIDED_ADDRESS',
                        user_action: 'PAY_NOW'
                    },
                    payer: {
                        name: { given_name: firstName || 'Valued', surname: lastName || 'Customer' },
                        ...(email && email.includes('@') ? { email_address: email.trim() } : {})
                    },
                    purchase_units: [{
                        description: summaryDesc,
                        amount: {
                            currency_code: 'USD',
                            value: exactGrandTotal,
                            breakdown: {
                                item_total: { currency_code: 'USD', value: itemTotalNum.toFixed(2) },
                                shipping: { currency_code: 'USD', value: shippingNum.toFixed(2) },
                                tax_total: { currency_code: 'USD', value: taxNum.toFixed(2) },
                                handling: { currency_code: 'USD', value: handlingNum.toFixed(2) }
                            }
                        },
                        items: paypalItems,
                        shipping: {
                            name: { full_name: (firstName + " " + lastName).trim() || 'Customer' },
                            address: {
                                address_line_1: address || '123 Main St',
                                admin_area_2: city || 'Bridgeview',
                                admin_area_1: cleanState,
                                postal_code: zip ? zip.replace(/[^0-9]/g, '') : '60455',
                                country_code: cleanCountry
                            }
                        }
                    }]
                });
            },
            onApprove: function (data, actions) {
                return actions.order.capture().then(function (details) {
                    console.log('PayPal Payment Completed:', details);
                    const captureObj = details.purchase_units?.[0]?.payments?.captures?.[0];
                    const orderId = captureObj?.id || details.id || Math.floor(100000 + Math.random() * 900000);

                    localStorage.setItem('alquds_latest_order', JSON.stringify({
                        id: orderId,
                        orderId: details.id,
                        method: 'PayPal/Credit Card',
                        status: 'Completed',
                        details: details
                    }));

                    const formEmail = document.querySelector('input[name="email"]')?.value || '';
                    const formFirstName = document.querySelector('input[name="firstName"]')?.value || '';
                    const formLastName = document.querySelector('input[name="lastName"]')?.value || '';
                    const formAddress = document.querySelector('input[name="address"]')?.value || '';
                    const formCity = document.querySelector('input[name="city"]')?.value || '';
                    const formState = document.querySelector('select[name="state"]')?.value || '';
                    const formZip = document.querySelector('input[name="zip"]')?.value || '';
                    const formCountry = document.querySelector('select[name="country"]')?.value || 'US';
                    const formPhone = document.querySelector('input[name="phone"]')?.value || '';

                    fetch('/.netlify/functions/send-order-email', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        keepalive: true,
                        body: JSON.stringify({
                            customerEmail: formEmail || details.payer?.email_address,
                            customerName: (formFirstName + ' ' + formLastName).trim() || details.payer?.name?.given_name || 'Valued Customer',
                            orderNumber: orderId,
                            cartItems: JSON.parse(localStorage.getItem('alquds_cart')) || [],
                            total: details.purchase_units?.[0]?.amount?.value || exactGrandTotal,
                            shippingAddress: {
                                name: (formFirstName + ' ' + formLastName).trim() || details.payer?.name?.given_name || 'Customer',
                                address: formAddress,
                                city: formCity,
                                state: formState,
                                zip: formZip,
                                country: formCountry,
                                phone: formPhone
                            }
                        })
                    }).catch(e => console.error('Email Dispatch Error:', e));

                    localStorage.removeItem('alquds_cart');
                    window.location.href = '/order-confirmation.html?id=' + orderId + '&total=' + (details.purchase_units?.[0]?.amount?.value || exactGrandTotal) + '&method=PayPal';
                }).catch(function (err) {
                    console.error('PayPal Authorization Error:', err);
                    alert('Payment Processing Error: ' + (err.message || 'There was an issue processing your payment. Please check your card details and try again.'));
                });
            },
            onError: function (err) {
                console.error('PayPal Error:', err);
                alert('Payment Processing Error: ' + (err.message || 'There was an issue processing your payment with PayPal. Please check your card details and address, or try again.'));
            }
        }).render('#paypal-button-container');
    };

    // Run the integration on initial load
    window.forcePayPalRefresh();
}
