import { NextResponse } from "next/server";
import fetch from "node-fetch";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TARGET_MINT = process.env.TARGET_MINT;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const TOKEN_NAME = "Soldiumx";

// In-memory storage of last 10 buys
let lastBuys = [];

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

// Fetch USD price from DexScreener
async function getTokenPrice() {
  try {
    const res = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${TARGET_MINT}`);
    const data = await res.json();
    const pair = data.pairs[0];
    return {
      price: parseFloat(pair.priceUsd),
      fdv: parseFloat(pair.fdv),
      change24h: pair.priceChange.h24,
      url: pair.url
    };
  } catch (err) {
    console.error("DexScreener fetch error:", err);
    return null;
  }
}

// POST: handle Telegram commands and Helius webhook
export async function POST(req) {
  try {
    const data = await req.json();

    // --- Telegram Commands ---
    if (data.message && data.message.text) {
      const chat_id = data.message.chat.id;
      const text = data.message.text.toLowerCase();
      let reply = "";

      if (text === "/start") {
        reply = `🚀 *Welcome to ${TOKEN_NAME} Bot!*\n\n` +
                `💡 Commands:\n` +
                `/start - Welcome message\n` +
                `/ping - Bot status\n` +
                `/price - Token price\n` +
                `/lastbuys - Recent buyers`;
      } else if (text === "/ping") {
        reply = "✅ Bot is running on Vercel";
      } else if (text === "/price") {
        const priceData = await getTokenPrice();
        if (priceData) {
          reply = `📊 *${TOKEN_NAME} Stats*\n\n` +
                  `💰 Price: $${priceData.price.toFixed(6)}\n` +
                  `📈 24h Change: ${priceData.change24h}%\n` +
                  `🏦 FDV: $${priceData.fdv.toLocaleString()}\n` +
                  `🔗 [View on DexScreener](${priceData.url})`;
        } else {
          reply = "❌ Error fetching price. Try again later.";
        }
      } else if (text === "/lastbuys") {
        if (lastBuys.length === 0) {
          reply = "No recent buys yet!";
        } else {
          reply = `🛒 *Last Buys*\n` + lastBuys.map((b, i) =>
            `${i+1}. ${b.amount} ${TOKEN_NAME} → ${b.toWallet} ($${b.usdValue.toFixed(2)})`
          ).join("\n");
        }
      }

      await sendTelegramMessage(reply, chat_id);
      return NextResponse.json({ ok: true });
    }

    // --- Helius Webhook (Buy Only) ---
    if (Array.isArray(data)) {
      const priceData = await getTokenPrice();
      for (const tx of data) {
        if (!tx.tokenTransfers) continue;

        for (const t of tx.tokenTransfers) {
          if (t.mint !== TARGET_MINT) continue;

          const amount = Number(t.tokenAmount || 0);
          if (amount <= 0) continue; // only buy

          const usdValue = priceData ? amount * priceData.price : 0;

          const message =
            `🟢 *NEW BUY ALERT!* 🟢\n\n` +
            `💎 Token: ${TOKEN_NAME}\n` +
            `💰 Amount: ${amount}\n` +
            `💵 USD Value: $${usdValue.toFixed(2)}\n` +
            `🧑 Buyer Wallet: \`${t.to}\`\n` +
            `📥 From Wallet: \`${t.from}\``;

          // Store last 10 buys
          lastBuys.unshift({ amount, usdValue, toWallet: t.to });
          if (lastBuys.length > 10) lastBuys.pop();

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
