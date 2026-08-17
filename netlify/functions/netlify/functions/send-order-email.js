exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }
  try {
    const { customerEmail, customerName, orderNumber, total, cartItems, shippingAddress } = JSON.parse(event.body);
    const API_KEY = process.env.RESEND_API_KEY;

    let itemsHtml = '';
    if (cartItems && cartItems.length > 0) {
      itemsHtml = '<hr style="border: 0; border-top: 1px solid #ddd; margin: 15px 0;">' + 
                  '<h3 style="margin: 0 0 10px 0; font-size: 16px;">Order Summary:</h3>' + 
                  '<ul style="margin: 0; padding-left: 20px;">' + 
                  cartItems.map(item => `<li style="margin-bottom: 5px; color: #555;">${item.quantity}x <strong>${item.name}</strong> - $${parseFloat(String(item.price).replace(/[^0-9.-]+/g, "")).toFixed(2)}</li>`).join('') + 
                  '</ul>';
    }

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333;">Thank you for your order, ${customerName}! 🎉</h2>
        <p style="color: #555; font-size: 16px;">We've successfully received your order and our team is getting it ready for you.</p>
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Order Number:</strong> #${orderNumber}</p>
          <p style="margin: 5px 0;"><strong>Total Paid:</strong> $${total}</p>
          ${itemsHtml}
          ${shippingAddress ? `
          <hr style="border: 0; border-top: 1px solid #ddd; margin: 15px 0;">
          <h3 style="margin: 0 0 10px 0; font-size: 16px;">Shipping Details:</h3>
          <p style="margin: 5px 0; color: #555; line-height: 1.5;">
            <strong>${shippingAddress.name}</strong><br>
            ${shippingAddress.address}<br>
            ${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.zip}<br>
            ${shippingAddress.country === 'US' ? 'United States' : shippingAddress.country}<br>
            Phone: ${shippingAddress.phone || 'Not provided'}
          </p>
          ` : ''}
        </div>
        <p style="color: #555; font-size: 16px;">We will send you another update with tracking information as soon as your order ships.</p>
        <br>
        <p style="color: #333; font-size: 16px;">Best regards,<br><strong>The Alquds Jewelry Team</strong></p>
      </div>
    `;

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'orders@alqudsjewelry.com',
        to: customerEmail,
        bcc: 'jerusalemjewelry@yahoo.com',
        subject: `Order Confirmation - #${orderNumber}`,
        html: emailHtml
      })
    });

    if (!response.ok) {
      throw new Error(`Resend API error: ${response.statusText}`);
    }

    return { statusCode: 200, body: JSON.stringify({ message: 'Email sent successfully!' }) };
  } catch (error) {
    console.error('Error sending email:', error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Failed to send email' }) };
  }
};
