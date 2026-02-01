import { NextResponse } from "next/server";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const TARGET_MINT = process.env.TARGET_MINT;

export async function POST(req) {
  try {
    const data = await req.json();

    // Helius sends an array of transactions
    for (const tx of data) {
      if (!tx.tokenTransfers) continue;

      for (const t of tx.tokenTransfers) {
        if (t.mint !== TARGET_MINT) continue;

        const amount = Number(t.tokenAmount || 0);
        const type = amount > 0 ? "🟢 BUY" : "🔴 SELL";

        const message =
          `${type}\n` +
          `Token: ${t.mint}\n` +
          `Amount: ${Math.abs(amount)}`;

        await fetch(
          `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: TELEGRAM_CHAT_ID,
              text: message
            })
          }
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Webhook error" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json(
    { error: "POST only" },
    { status: 405 }
  );
}
