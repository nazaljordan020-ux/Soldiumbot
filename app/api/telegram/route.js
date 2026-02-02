import { NextResponse } from "next/server";
import fetch from "node-fetch";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TARGET_MINT = process.env.TARGET_MINT;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const TOKEN_NAME = "Soldiumx";

// ===== ADMIN & SPAM PROTECTION =====

// Admin IDs from Vercel env (comma separated)
const ADMIN_IDS = process.env.TELEGRAM_ADMIN_IDS
  ? process.env.TELEGRAM_ADMIN_IDS.split(",").map(id => Number(id.trim()))
  : [];

// Mute switch
let isMuted = false;

// Spam detection
function isSpam(text = "") {
  const spamWords = [
    "airdrop",
    "free",
    "claim",
    "http",
    "https",
    "www",
    ".com",
    ".io",
    ".xyz"
  ];
  const lower = text.toLowerCase();
  return spamWords.some(word => lower.includes(word));
}

function isAdmin(userId) {
  return ADMIN_IDS.includes(Number(userId));
}

// ===== IN-MEMORY STORAGE =====
let lastBuys = [];

// ===== TELEGRAM SENDER =====
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

// ===== TOKEN PRICE =====
async function getTokenPrice() {
  try {
    const res = await fetch(
      `https://api.dexscreener.com/latest/dex/tokens/${TARGET_MINT}`
    );
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

// ===== POST HANDLER =====
export async function POST(req) {
  try {
    const data = await req.json();

    // ---------- TELEGRAM COMMANDS ----------
    if (data.message && data.message.text) {
      const chat_id = data.message.chat.id;
      const user_id = data.message.from.id;
      const textRaw = data.message.text;
      const text = textRaw.toLowerCase();

      // 🚫 BLOCK NON-ADMINS
      if (!isAdmin(user_id)) {
        if (isMuted) return NextResponse.json({ ok: true });
        if (isSpam(text)) return NextResponse.json({ ok: true });
        if (text.startsWith("/")) return NextResponse.json({ ok: true });
      }

      let reply = "";

      // 🔐 ADMIN COMMANDS
      if (text === "/mute" && isAdmin(user_id)) {
        isMuted = true;
        reply = "🔇 Bot muted for non-admin users.";
      }

      else if (text === "/unmute" && isAdmin(user_id)) {
        isMuted = false;
        reply = "🔊 Bot unmuted. Non-admin users can talk again.";
      }

      // 🤖 PUBLIC COMMANDS
      else if (text === "/start") {
        reply =
          `🚀 *Welcome to ${TOKEN_NAME} Bot!*\n\n` +
          `💡 Commands:\n` +
          `/price - Token price\n` +
          `/lastbuys - Recent buyers`;
      }

      else if (text === "/ping") {
        reply = "✅ Bot is running on Vercel";
      }

      else if (text === "/price") {
        const priceData = await getTokenPrice();
        reply = priceData
          ? `📊 *${TOKEN_NAME} Stats*\n\n` +
            `💰 Price: $${priceData.price.toFixed(6)}\n` +
            `📈 24h Change: ${priceData.change24h}%\n` +
            `🏦 FDV: $${priceData.fdv.toLocaleString()}\n` +
            `🔗 [View on DexScreener](${priceData.url})`
          : "❌ Error fetching price.";
      }

      else if (text === "/lastbuys") {
        reply =
          lastBuys.length === 0
            ? "No recent buys yet!"
            : `🛒 *Last Buys*\n` +
              lastBuys
                .map(
                  (b, i) =>
                    `${i + 1}. ${b.amount} ${TOKEN_NAME} → ${b.toWallet} ($${b.usdValue.toFixed(2)})`
                )
                .join("\n");
      }

      if (reply) await sendTelegramMessage(reply, chat_id);
      return NextResponse.json({ ok: true });
    }

    // ---------- HELIUS BUY ALERTS ----------
    if (Array.isArray(data)) {
      const priceData = await getTokenPrice();

      for (const tx of data) {
        if (!tx.tokenTransfers) continue;

        for (const t of tx.tokenTransfers) {
          if (t.mint !== TARGET_MINT) continue;

          const amount = Number(t.tokenAmount || 0);
          if (amount <= 0) continue;

          const usdValue = priceData ? amount * priceData.price : 0;

          const message =
            `🟢 *NEW BUY ALERT!* 🟢\n\n` +
            `💎 Token: ${TOKEN_NAME}\n` +
            `💰 Amount: ${amount}\n` +
            `💵 USD Value: $${usdValue.toFixed(2)}\n` +
            `🧑 Buyer Wallet: \`${t.to}\`\n` +
            `📥 From Wallet: \`${t.from}\``;

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
    return NextResponse.json(
      { error: "Telegram/Helius webhook error" },
      { status: 500 }
    );
  }
}

// ===== HEALTH CHECK =====
export async function GET() {
  return NextResponse.json({ status: "Telegram bot endpoint active" });
}
