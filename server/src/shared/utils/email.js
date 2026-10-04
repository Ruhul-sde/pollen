import { sendMail } from "../../config/email.js";

// ─── Email Templates ───────────────────────────────────────────────────────

function baseLayout(content) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8" />
      <style>
        body { font-family: 'Helvetica Neue', Arial, sans-serif; background: #f9f7f4; margin: 0; padding: 0; color: #1a1a1a; }
        .container { max-width: 600px; margin: 40px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.07); }
        .header { background: #1a1a1a; padding: 32px; text-align: center; }
        .header h1 { color: #c9a96e; margin: 0; font-size: 28px; letter-spacing: 4px; text-transform: uppercase; }
        .header p { color: #888; font-size: 12px; letter-spacing: 2px; margin: 4px 0 0; }
        .body { padding: 40px 48px; }
        .footer { background: #f4f1ec; padding: 24px; text-align: center; font-size: 12px; color: #888; }
        .btn { display: inline-block; background: #1a1a1a; color: #c9a96e !important; padding: 14px 32px; border-radius: 6px; text-decoration: none; font-weight: 600; letter-spacing: 1px; margin: 24px 0; }
        .otp { font-size: 40px; font-weight: 700; letter-spacing: 12px; color: #c9a96e; text-align: center; padding: 24px; background: #f9f7f4; border-radius: 8px; margin: 24px 0; }
        table { width: 100%; border-collapse: collapse; }
        td, th { padding: 10px 14px; border-bottom: 1px solid #f0ebe3; font-size: 14px; }
        th { background: #f4f1ec; font-weight: 600; text-align: left; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Pollen</h1>
          <p>LUXURY FRAGRANCES</p>
        </div>
        <div class="body">${content}</div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Pollen Store · pollenstore.in</p>
          <p>You're receiving this because you have an account with us.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export async function sendOTPEmail({ to, name, otp, type = "verification" }) {
  const isPasswordReset = type === "password_reset";
  const isLoginVerify = type === "login_verify" || type === "login";

  const subject = isPasswordReset
    ? "Reset Your Pollen Password"
    : isLoginVerify
    ? "Your Pollen Login Verification Code"
    : "Verify Your Pollen Account";

  const message = isPasswordReset
    ? "We received a request to reset your password. Use the verification code below:"
    : isLoginVerify
    ? "We received a login request for your Pollen account. Use the verification code below to complete your login:"
    : "Welcome to Pollen! Please verify your email with the code below:";

  const html = baseLayout(`
    <h2 style="margin-top:0">Hello, ${name || "there"} 👋</h2>
    <p>${message}</p>
    <div class="otp">${otp}</div>
    <p style="color:#888;font-size:13px;text-align:center">This code expires in 10 minutes. Do not share it with anyone.</p>
  `);

  return sendMail({ to, subject, html });
}

export async function sendWelcomeEmail({ to, name }) {
  const html = baseLayout(`
    <h2 style="margin-top:0">Welcome to Pollen, ${name}! 🌸</h2>
    <p>Your account has been verified. You're now part of our exclusive fragrance community.</p>
    <p>Explore our curated collection of luxury perfumes crafted with the finest ingredients.</p>
    <a href="${process.env.CLIENT_URL}" class="btn">SHOP NOW</a>
    <p style="color:#888;font-size:13px">Need help? Reach us at support@pollenstore.in</p>
  `);

  return sendMail({ to, subject: "Welcome to Pollen Store ✨", html });
}

export async function sendOrderConfirmationEmail({ to, name, order }) {
  const itemRows = order.items
    .map(
      (item) => `
      <tr>
        <td>${item.name}</td>
        <td>${item.variant || ""}</td>
        <td>${item.qty}</td>
        <td>₹${item.price.toFixed(2)}</td>
      </tr>
    `
    )
    .join("");

  const html = baseLayout(`
    <h2 style="margin-top:0">Order Confirmed! 🎉</h2>
    <p>Hi ${name}, your order has been placed successfully.</p>
    <p><strong>Order ID:</strong> ${order.orderId}<br/>
       <strong>Tracking ID:</strong> ${order.trackingId || "Will be updated soon"}</p>
    <table>
      <thead>
        <tr>
          <th>Product</th><th>Variant</th><th>Qty</th><th>Price</th>
        </tr>
      </thead>
      <tbody>${itemRows}</tbody>
      <tfoot>
        <tr><td colspan="3"><strong>Total</strong></td><td><strong>₹${order.total.toFixed(2)}</strong></td></tr>
      </tfoot>
    </table>
    <p style="margin-top:24px">Expected delivery in 3–7 business days.</p>
    <a href="${process.env.CLIENT_URL}/orders/${order.orderId}" class="btn">VIEW ORDER</a>
  `);

  return sendMail({ to, subject: `Order Confirmed — #${order.orderId}`, html });
}

export async function sendOrderShippedEmail({ to, name, order }) {
  const html = baseLayout(`
    <h2 style="margin-top:0">Your Order is on its Way! 🚚</h2>
    <p>Hi ${name}, your Pollen order <strong>#${order.orderId}</strong> has been shipped.</p>
    <p><strong>Tracking ID:</strong> ${order.trackingId}</p>
    <p>Expected delivery in 2–4 business days.</p>
    <a href="${process.env.CLIENT_URL}/orders/${order.orderId}" class="btn">TRACK ORDER</a>
  `);

  return sendMail({ to, subject: `Your Order Has Shipped — #${order.orderId}`, html });
}

export async function sendOrderDeliveredEmail({ to, name, order }) {
  const html = baseLayout(`
    <h2 style="margin-top:0">Order Delivered! ✅</h2>
    <p>Hi ${name}, your order <strong>#${order.orderId}</strong> has been delivered.</p>
    <p>We hope you love your new Pollen fragrance. Share your experience by leaving a review!</p>
    <a href="${process.env.CLIENT_URL}/products" class="btn">WRITE A REVIEW</a>
  `);

  return sendMail({ to, subject: `Delivered — #${order.orderId}`, html });
}

export async function sendPasswordResetOTP({ to, name, otp }) {
  return sendOTPEmail({ to, name, otp, type: "password_reset" });
}
