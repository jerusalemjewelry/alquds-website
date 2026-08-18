exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { amount } = JSON.parse(event.body);
    
    // Amount must be in cents for Stripe
    const amountInCents = Math.round(parseFloat(amount) * 100);

    const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
    if (!STRIPE_SECRET_KEY) {
      return { statusCode: 500, body: JSON.stringify({ error: 'STRIPE_SECRET_KEY is missing' }) };
    }

    const response = await fetch('https://api.stripe.com/v1/payment_intents', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        amount: amountInCents.toString(),
        currency: 'usd',
        'automatic_payment_methods[enabled]': 'true',
        capture_method: 'manual'
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Stripe error:', data);
      throw new Error(data.error?.message || 'Failed to create PaymentIntent');
    }

    return { 
      statusCode: 200, 
      body: JSON.stringify({ clientSecret: data.client_secret }) 
    };

  } catch (error) {
    console.error('Error creating Stripe intent:', error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
