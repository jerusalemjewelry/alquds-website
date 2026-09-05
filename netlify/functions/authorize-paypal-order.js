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
    const { orderID } = JSON.parse(event.body || '{}');

    if (!orderID) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing orderID' }) };
    }

    const accessToken = await getAccessToken();

    const response = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders/${orderID}/authorize`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    const authData = await response.json();

    if (!response.ok) {
      console.error('PayPal Server Order Authorization Error:', authData);
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: authData })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify(authData)
    };
  } catch (error) {
    console.error('Authorize Order Netlify Handler Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message || 'Internal Server Error' })
    };
  }
};
