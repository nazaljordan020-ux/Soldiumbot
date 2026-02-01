import { NextResponse } from "next/server";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TARGET_MINT = process.env.TARGET_MINT;
const TOKEN_NAME = "SoldiumX";

// POST: handle Telegram updates
export async function POST(req) {
  try {
    const update = await req.json();

    if (!update.message || !update.message.text) {
      return NextResponse.json({ ok: true });
    }

    const chat_id = update.message.chat.id;
    const text = update.message.text.toLowerCase();
    let reply = "";

    // /start command
    if (text === "/start") {
      reply = `🚀 Welcome to ${TOKEN_NAME} Bot!\nCommands:\n/start - Start bot\n/ping - Bot status\n/price - Token price`;
    }

    // /ping command
    else if (text === "/ping") {
      reply = "✅ Bot is running on Vercel";
    }

    // /price command
    else if (text === "/price") {
      try {
        const res = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${TARGET_MINT}`);
        const data = await res.json();

        const pair = data.pairs[0];

        reply = `🚀 ${TOKEN_NAME} Stats\n\n` +
                `💰 Price: $${parseFloat(pair.priceUsd).toFixed(6)}\n` +
                `📊 FDV: $${parseFloat(pair.fdv).toLocaleString()}\n` +
                `📈 24h Change: ${pair.priceChange.h24}%\n` +
                `🔗 [DexScreener](${pair.url})`;
      } catch (err) {
        reply = "❌ Error fetching price. Try again later.";
        console.error("Price fetch error:", err);
      }
    }

    // Send the reply to Telegram
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id, text: reply, parse_mode: "Markdown" })
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Telegram webhook error:", err);
    return NextResponse.json({ error: "Telegram webhook error" }, { status: 500 });
  }
}

// GET: optional health check
export async function GET() {
  return NextResponse.json({ status: "Telegram bot endpoint active" });
}
