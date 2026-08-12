/**
 * Sends a notification whenever a new enquiry arrives.
 * Channels are each optional — whichever you configure in .env gets used:
 *   1. Email    (via your Gmail account)
 *   2. WhatsApp  (via the free CallMeBot service)
 *   3. Telegram  (via a Telegram bot — reliable, recommended)
 *
 * If a channel isn't configured, it's skipped silently. If sending fails,
 * the error is logged to the terminal but the enquiry is still saved, so
 * you never lose an enquiry because a notification failed.
 */

const nodemailer = require("nodemailer");

// Build a readable message from an enquiry object.
function formatLines(inq) {
  return [
    `Name: ${inq.name}`,
    inq.company ? `Company: ${inq.company}` : null,
    `Email: ${inq.email}`,
    inq.phone ? `Phone: ${inq.phone}` : null,
    `Product: ${inq.product || "General enquiry"}`,
    `Message: ${inq.message}`,
    `Received: ${new Date(inq.receivedAt).toLocaleString()}`,
  ].filter(Boolean);
}

// --- Email via Gmail -------------------------------------------------------
async function sendEmail(inq) {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  const to = process.env.NOTIFY_EMAIL || user;
  if (!user || !pass) return; // not configured — skip

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });

  await transporter.sendMail({
    from: `"SL Industries website" <${user}>`,
    to,
    replyTo: inq.email, // reply goes straight to the customer
    subject: `New enquiry: ${inq.product || "General"} — ${inq.name}`,
    text: "New website enquiry\n\n" + formatLines(inq).join("\n"),
  });
  console.log("  -> enquiry emailed to", to);
}

// --- WhatsApp via CallMeBot ------------------------------------------------
async function sendWhatsApp(inq) {
  const phone = process.env.WHATSAPP_PHONE;
  const apikey = process.env.WHATSAPP_APIKEY;
  if (!phone || !apikey) return; // not configured — skip

  const text = "New website enquiry\n" + formatLines(inq).join("\n");
  const url =
    "https://api.callmebot.com/whatsapp.php?phone=" +
    encodeURIComponent(phone) +
    "&text=" +
    encodeURIComponent(text) +
    "&apikey=" +
    encodeURIComponent(apikey);

  const res = await fetch(url);
  if (!res.ok) throw new Error("CallMeBot responded " + res.status);
  console.log("  -> enquiry sent to WhatsApp", phone);
}

// --- Telegram --------------------------------------------------------------
async function sendTelegram(inq) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return; // not configured — skip

  const text = "🌱 New website enquiry\n" + formatLines(inq).join("\n");
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text }),
  });
  if (!res.ok) throw new Error("Telegram responded " + res.status);
  console.log("  -> enquiry sent to Telegram");
}

// Run all channels; never throw (a failed notification must not break saving).
async function notify(inq) {
  await Promise.allSettled([
    sendEmail(inq).catch((e) => console.error("  email notify failed:", e.message)),
    sendWhatsApp(inq).catch((e) => console.error("  whatsapp notify failed:", e.message)),
    sendTelegram(inq).catch((e) => console.error("  telegram notify failed:", e.message)),
  ]);
}

module.exports = { notify };
