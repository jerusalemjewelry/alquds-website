exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }
  try {
    const { customerEmail, customerName, orderNumber, total } = JSON.parse(event.body);
    const API_KEY = process.env.RESEND_API_KEY;

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333;">Thank you for your order, ${customerName}! 🎉</h2>
        <p style="color: #555; font-size: 16px;">We've successfully received your order and our team is getting it ready for you.</p>
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Order Number:</strong> #${orderNumber}</p>
          <p style="margin: 5px 0;"><strong>Total Paid:</strong> $${total}</p>
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
