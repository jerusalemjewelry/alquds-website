exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const {
      customerEmail,
      customerName,
      orderNumber,
      total,
      subtotal,
      shippingCost,
      taxAmount,
      handlingFee,
      cartItems,
      shippingAddress,
      paymentMethod
    } = body;

    const API_KEY = process.env.RESEND_API_KEY;

    if (!API_KEY) {
      console.error('Error: RESEND_API_KEY environment variable is not configured in Netlify.');
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: 'Email service configuration error: RESEND_API_KEY environment variable missing in Netlify settings.'
        })
      };
    }

    const fromSender = process.env.RESEND_FROM_EMAIL || 'Alquds Jewelry <orders@alqudsjewelry.com>';
    const adminEmail = 'jerusalemjewelry@yahoo.com';

    // Format items table rows
    let itemsTableRows = '';
    if (cartItems && Array.isArray(cartItems) && cartItems.length > 0) {
      itemsTableRows = cartItems.map(item => {
        const qty = parseInt(item.quantity) || 1;
        const rawPrice = parseFloat(String(item.price).replace(/[^0-9.-]+/g, "")) || 0;
        const itemTotal = (rawPrice * qty).toFixed(2);
        const unitPrice = rawPrice.toFixed(2);
        const sku = item.itemNo || item.sku || item.id || item.code || 'N/A';

        // Specifications
        const specs = [];
        if (item.karat) specs.push(`${item.karat}k Gold`);
        if (item.weight && item.weight !== 'N/A' && item.weight !== 'Varies') specs.push(`${item.weight}g`);
        if (item.size) specs.push(`Size: ${item.size}`);
        if (item.length) specs.push(`Length: ${item.length}`);
        if (item.customName) specs.push(`Custom: ${item.customName}`);
        const specsHtml = specs.length > 0 
          ? `<div style="font-size: 12px; color: #b89726; margin-top: 4px;">${specs.join(' &bull; ')}</div>` 
          : '';

        return `
          <tr style="border-bottom: 1px solid #222;">
            <td style="padding: 12px 8px; color: #ffffff;">
              <strong style="font-size: 14px;">${item.name || 'Jewelry Item'}</strong>
              <div style="font-size: 12px; color: #aaaaaa; margin-top: 2px;">Item #: <code>${sku}</code></div>
              ${specsHtml}
            </td>
            <td style="padding: 12px 8px; text-align: center; color: #ffffff; font-size: 14px;">${qty}</td>
            <td style="padding: 12px 8px; text-align: right; color: #ffffff; font-size: 14px;">$${unitPrice}</td>
            <td style="padding: 12px 8px; text-align: right; color: #d4af37; font-weight: bold; font-size: 14px;">$${itemTotal}</td>
          </tr>
        `;
      }).join('');
    } else {
      itemsTableRows = `
        <tr>
          <td colspan="4" style="padding: 15px; text-align: center; color: #aaaaaa;">Jewelry Item Order</td>
        </tr>
      `;
    }

    // Format shipping address block
    let shippingHtml = 'Not provided';
    if (shippingAddress) {
      shippingHtml = `
        <strong>${shippingAddress.name || customerName || 'Customer'}</strong><br>
        ${shippingAddress.address || ''}<br>
        ${shippingAddress.city || ''}${shippingAddress.state ? ', ' + shippingAddress.state : ''} ${shippingAddress.zip || ''}<br>
        ${shippingAddress.country === 'US' ? 'United States' : (shippingAddress.country || 'United States')}<br>
        <strong>Phone:</strong> ${shippingAddress.phone || 'Not provided'}
      `;
    }

    // Numbers calculation
    const subtotalFormatted = subtotal ? parseFloat(subtotal).toFixed(2) : (total ? parseFloat(total).toFixed(2) : '0.00');
    const shippingFormatted = shippingCost ? (parseFloat(shippingCost) === 0 ? 'Free' : '$' + parseFloat(shippingCost).toFixed(2)) : 'Free';
    const taxFormatted = taxAmount ? '$' + parseFloat(taxAmount).toFixed(2) : '$0.00';
    const feeFormatted = handlingFee ? '$' + parseFloat(handlingFee).toFixed(2) : '$0.00';
    const totalFormatted = total ? parseFloat(total).toFixed(2) : subtotalFormatted;

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Order Confirmation - Alquds Jewelry</title>
      </head>
      <body style="background-color: #0d0d0d; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; margin: 0; padding: 20px; color: #dddddd;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 650px; background-color: #141414; border: 1px solid #2a2a2a; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.5);">
          <!-- Header Banner -->
          <tr>
            <td style="background-color: #000000; padding: 25px 30px; text-align: center; border-bottom: 2px solid #d4af37;">
              <h1 style="color: #d4af37; margin: 0; font-size: 24px; letter-spacing: 2px; font-weight: 700;">ALQUDS <span style="color: #ffffff;">JEWELRY</span></h1>
              <div style="color: #888888; font-size: 11px; margin-top: 5px; text-transform: uppercase; letter-spacing: 1px;">Jerusalem Jewelry &bull; Bridgeview, IL</div>
            </td>
          </tr>
          
          <!-- Content Body -->
          <tr>
            <td style="padding: 30px;">
              <h2 style="color: #ffffff; margin-top: 0; font-size: 20px;">Order Confirmed &bull; Thank You, ${customerName || 'Valued Customer'}!</h2>
              <p style="color: #bbbbbb; font-size: 14px; line-height: 1.6;">
                We have received your order <strong>#${orderNumber}</strong>. Our master jewelers are processing your order with care.
              </p>

              <!-- Order Summary Header Pill -->
              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #1a1a1a; border-radius: 6px; margin: 20px 0; border: 1px solid #333333;">
                <tr>
                  <td style="padding: 12px 15px; font-size: 13px; color: #bbbbbb;">
                    <strong>Order #:</strong> <span style="color: #d4af37;">${orderNumber}</span>
                  </td>
                  <td style="padding: 12px 15px; font-size: 13px; color: #bbbbbb; text-align: right;">
                    <strong>Payment:</strong> <span style="color: #ffffff;">${paymentMethod || 'PayPal / Credit Card'}</span>
                  </td>
                </tr>
              </table>

              <!-- Items Table -->
              <h3 style="color: #d4af37; font-size: 16px; margin-bottom: 10px; border-bottom: 1px solid #333333; padding-bottom: 8px;">Order Details</h3>
              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 25px;">
                <thead>
                  <tr style="border-bottom: 1px solid #333; text-align: left; color: #888888; font-size: 12px; text-transform: uppercase;">
                    <th style="padding: 8px;">Item Description</th>
                    <th style="padding: 8px; text-align: center;">Qty</th>
                    <th style="padding: 8px; text-align: right;">Price</th>
                    <th style="padding: 8px; text-align: right;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsTableRows}
                </tbody>
              </table>

              <!-- Financial Breakdown -->
              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 25px; background-color: #181818; padding: 15px; border-radius: 6px;">
                <tr>
                  <td style="padding: 4px 0; font-size: 13px; color: #aaaaaa;">Items Subtotal:</td>
                  <td style="padding: 4px 0; font-size: 13px; color: #ffffff; text-align: right;">$${subtotalFormatted}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; font-size: 13px; color: #aaaaaa;">Insured Shipping:</td>
                  <td style="padding: 4px 0; font-size: 13px; color: #ffffff; text-align: right;">${shippingFormatted}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; font-size: 13px; color: #aaaaaa;">Sales Tax:</td>
                  <td style="padding: 4px 0; font-size: 13px; color: #ffffff; text-align: right;">${taxFormatted}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; font-size: 13px; color: #aaaaaa;">Card Processing Fee (3%):</td>
                  <td style="padding: 4px 0; font-size: 13px; color: #ffffff; text-align: right;">${feeFormatted}</td>
                </tr>
                <tr style="border-top: 1px solid #333333;">
                  <td style="padding: 10px 0 4px 0; font-size: 16px; color: #ffffff; font-weight: bold;">Grand Total Paid:</td>
                  <td style="padding: 10px 0 4px 0; font-size: 18px; color: #d4af37; font-weight: bold; text-align: right;">$${totalFormatted} USD</td>
                </tr>
              </table>

              <!-- Shipping Address Box -->
              <h3 style="color: #d4af37; font-size: 16px; margin-bottom: 10px; border-bottom: 1px solid #333333; padding-bottom: 8px;">Delivery Address</h3>
              <div style="background-color: #181818; padding: 15px; border-radius: 6px; font-size: 13px; color: #cccccc; line-height: 1.6;">
                ${shippingHtml}
              </div>

              <!-- Footer Note -->
              <p style="color: #888888; font-size: 12px; margin-top: 30px; line-height: 1.5; text-align: center;">
                If you have any questions regarding your order, please call us directly at <a href="tel:+17082339508" style="color: #d4af37; text-decoration: none;">(708) 233-9508</a> or reply to this email.
              </p>
            </td>
          </tr>

          <!-- Footer Bar -->
          <tr>
            <td style="background-color: #080808; padding: 15px; text-align: center; color: #666666; font-size: 11px;">
              &copy; 2025 Alquds Jewelry (Jerusalem Jewelry) &bull; All Rights Reserved.
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    // Send email via Resend API
    const recipients = [customerEmail];
    if (customerEmail !== adminEmail) {
      recipients.push(adminEmail);
    }

    const payload = {
      from: fromSender,
      to: recipients,
      subject: `Order Confirmation #${orderNumber} - Alquds Jewelry`,
      html: emailHtml
    };

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const resendData = await resendResponse.json().catch(() => ({}));

    if (!resendResponse.ok) {
      console.error('Resend API Error details:', resendData);
      
      // If error is due to unverified from domain, attempt sending via onboarding fallback address
      if (resendResponse.status === 403 && fromSender.includes('@alqudsjewelry.com')) {
        console.log('Attempting fallback sending via onboarding@resend.dev...');
        const fallbackPayload = {
          ...payload,
          from: 'Alquds Jewelry <onboarding@resend.dev>'
        };

        const fallbackResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(fallbackPayload)
        });

        const fallbackData = await fallbackResponse.json().catch(() => ({}));
        if (fallbackResponse.ok) {
          return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Email sent successfully via fallback domain!', data: fallbackData })
          };
        }
      }

      return {
        statusCode: resendResponse.status,
        body: JSON.stringify({
          error: 'Resend API error',
          details: resendData
        })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Order confirmation email sent successfully!', data: resendData })
    };

  } catch (error) {
    console.error('Error in send-order-email function:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error while sending email', message: error.message })
    };
  }
};
