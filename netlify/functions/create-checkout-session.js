const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event, context) => {
    // Only allow POST
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { cart, successUrl, cancelUrl } = JSON.parse(event.body);

        if (!cart || cart.length === 0) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Cart is empty' }) };
        }

        // Format line items for Stripe Checkout
        const lineItems = cart.map(item => {
            // Clean price (remove $, commas)
            const price = parseFloat(String(item.price).replace(/[^0-9.-]+/g, "")) || 0;
            const quantity = parseInt(item.quantity) || 1;

            return {
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: item.name,
                        description: item.karat ? `${item.karat} Gold` : undefined,
                        images: item.image ? [item.image.startsWith('http') ? item.image : `https://alqudsjewelry.com/${item.image.replace(/^\//, '')}`] : [],
                    },
                    unit_amount: Math.round(price * 100), // Stripe expects cents
                },
                quantity: quantity,
            };
        });

        // Create Checkout Session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card', 'link'], // 'link' includes Apple Pay / Google Pay if enabled in Stripe
            line_items: lineItems,
            mode: 'payment',
            payment_intent_data: {
                capture_method: 'manual', // Ensures it only AUTHORIZES the card, so you can void or capture exact amounts later
            },
            success_url: successUrl,
            cancel_url: cancelUrl,
            shipping_address_collection: {
                allowed_countries: ['US'], // Restrict to US for now
            },
            // Optionally request phone number
            phone_number_collection: {
                enabled: true,
            },
        });

        return {
            statusCode: 200,
            body: JSON.stringify({ id: session.id, url: session.url })
        };
    } catch (err) {
        console.error("Stripe Checkout Error:", err);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: err.message })
        };
    }
};
