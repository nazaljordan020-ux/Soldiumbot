import { NextResponse } from "next/server";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TARGET_MINT = process.env.TARGET_MINT;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID; // group or personal chat
const TOKEN_NAME = "Soldiumx";

// Helper to send Telegram messages
async function sendTelegramMessage(text, chat_id = TELEGRAM_CHAT_ID) {
  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id, text, parse_mode: "Markdown" })
    });
  } catch (err) {
    console.error("Telegram send error:", err);
  }
}

// POST: handle Telegram commands and Helius webhook
export async function POST(req) {
  try {
    const data = await req.json();

    // === Case 1: Telegram command ===
    if (data.message && data.message.text) {
      const chat_id = data.message.chat.id;
      const text = data.message.text.toLowerCase();
      let reply = "";

      if (text === "/start") {
        reply = `🚀 *Welcome to ${TOKEN_NAME} Bot!*\n\n` +
                `💡 Commands:\n` +
                `/start - Welcome message\n` +
                `/ping - Bot status\n` +
                `/price - Token price`;
      } else if (text === "/ping") {
        reply = "✅ Bot is active and running on Vercel";
      } else if (text === "/price") {
        try {
          const res = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${TARGET_MINT}`);
          const dexData = await res.json();
          const pair = dexData.pairs[0];

          reply = `📊 *${TOKEN_NAME} Stats*\n\n` +
                  `💰 Price: $${parseFloat(pair.priceUsd).toFixed(6)}\n` +
                  `📈 24h Change: ${pair.priceChange.h24}%\n` +
                  `🏦 FDV: $${parseFloat(pair.fdv).toLocaleString()}\n` +
                  `🔗 [View on DexScreener](${pair.url})`;
        } catch (err) {
          reply = "❌ Error fetching price. Try again later.";
          console.error("Price fetch error:", err);
        }
      }

      await sendTelegramMessage(reply, chat_id);
      return NextResponse.json({ ok: true });
    }

    // === Case 2: Helius webhook (only monitor BUY) ===
    if (Array.isArray(data)) {
      for (const tx of data) {
        if (!tx.tokenTransfers) continue;

        for (const t of tx.tokenTransfers) {
          if (t.mint !== TARGET_MINT) continue;

          const amount = Number(t.tokenAmount || 0);

          // Only monitor buys (to the token's main address)
          if (amount <= 0) continue;

          const message =
            `🟢 *NEW BUY ALERT!* 🟢\n\n` +
            `💎 Token: ${TOKEN_NAME}\n` +
            `💰 Amount: ${Math.abs(amount)}\n` +
            `🧑 Buyer Wallet: \`${t.to}\`\n` +
            `📥 From Wallet: \`${t.from}\``;

          await sendTelegramMessage(message);
        }
      }

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Webhook handling error:", err);
    return NextResponse.json({ error: "Telegram/Helius webhook error" }, { status: 500 });
  }
}

// GET: health check
export async function GET() {
  return NextResponse.json({ status: "Telegram bot endpoint active" });
}
