import { NextResponse } from "next/server";
import fetch from "node-fetch";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TARGET_MINT = process.env.TARGET_MINT; // your token mint
const TOKEN_NAME = "Soldiumx";

export async function POST(req) {
  try {
    const update = await req.json();
    if (!update.message || !update.message.text) return NextResponse.json({ ok: true });

    const chat_id = update.message.chat.id;
    const text = update.message.text.toLowerCase();

    if (text === "/start") {
      await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id,
          text: `Welcome to ${TOKEN_NAME} Bot! Use /price.`
        })
      });
    }

    if (text === "/price") {
      try {
        const res = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${TARGET_MINT}`);
        const data = await res.json();
        const pair = data.pairs[0];
        const msg = `🚀 ${TOKEN_NAME} Stats\n\n💰 Price: $${pair.priceUsd}\n📊 MCap: $${pair.fdv.toLocaleString()}\n📈 24h: ${pair.priceChange.h24}%\n🔗 ${pair.url}`;

        await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id, text: msg })
        });
      } catch (err) {
        await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id, text: "Error fetching price. Try later." })
        });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Telegram webhook error" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: "POST only" }, { status: 405 });
}
