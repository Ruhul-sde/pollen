/**
 * WhatsApp notification stub.
 * Replace the body of sendWhatsApp() with your Twilio/360Dialog/Interakt integration.
 */

export async function sendWhatsApp({ to, templateName, variables = {} }) {
  if (!process.env.WHATSAPP_ENABLED || process.env.WHATSAPP_ENABLED === "false") {
    console.log(`[WhatsApp] Stub — would send "${templateName}" to ${to}`, variables);
    return { stubbed: true };
  }

  // TODO: Integrate with Twilio / 360Dialog / Interakt
  // Example Twilio:
  // const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  // return client.messages.create({
  //   from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
  //   to: `whatsapp:+91${to}`,
  //   body: buildMessage(templateName, variables),
  // });

  console.warn("[WhatsApp] Provider not configured");
  return null;
}

export async function sendOrderWhatsApp({ phone, name, orderId, status }) {
  return sendWhatsApp({
    to: phone,
    templateName: "order_update",
    variables: { name, orderId, status },
  });
}
