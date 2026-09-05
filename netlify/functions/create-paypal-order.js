const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID || 'BAA1meBJLQLzbDmIEf-l-Dx-sCRygXfKNLqsm6ZQfI-tEfL1s6Le7WFm2gd0CYK4jWGkiELo2qe1KKnVrI';
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET || 'EJSXRXLayB5vHS_5QL_iz0G62UWMX5I9MiCCP1Wtc2ccDIs1gUtBmkBRUOqndTF7MuAZUeWq7tJgR18X';
const PAYPAL_API_BASE = process.env.PAYPAL_API_BASE || 'https://api-m.paypal.com';

async function getAccessToken() {
  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');
  const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: 'POST',
    body: 'grant_type=client_credentials',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`PayPal Token Error: ${response.status} ${errText}`);
  }

  const data = await response.json();
  return data.access_token;
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { items, shippingAddress, amounts } = JSON.parse(event.body || '{}');

    const accessToken = await getAccessToken();

    const orderPayload = {
      intent: 'AUTHORIZE',
      purchase_units: [{
        amount: {
          currency_code: 'USD',
          value: amounts.grandTotal,
          breakdown: {
            item_total: { currency_code: 'USD', value: amounts.itemTotal },
            shipping: { currency_code: 'USD', value: amounts.shipping },
            tax_total: { currency_code: 'USD', value: amounts.tax },
            handling: { currency_code: 'USD', value: amounts.handling }
          }
        },
        items: items,
        shipping: shippingAddress ? {
          name: { full_name: shippingAddress.name || 'Customer' },
          address: {
            address_line_1: shippingAddress.address || '123 Main St',
            admin_area_2: shippingAddress.city || 'Bridgeview',
            admin_area_1: shippingAddress.state || 'IL',
            postal_code: shippingAddress.zip || '60455',
            country_code: shippingAddress.country || 'US'
          }
        } : undefined
      }],
      application_context: {
        shipping_preference: 'SET_PROVIDED_ADDRESS',
        user_action: 'CONTINUE'
      }
    };

    const response = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(orderPayload)
    });

    const orderData = await response.json();

    if (!response.ok) {
      console.error('PayPal Server Order Creation Error:', orderData);
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: orderData })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ id: orderData.id, orderData })
    };
  } catch (error) {
    console.error('Create Order Netlify Handler Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message || 'Internal Server Error' })
    };
  }
};
