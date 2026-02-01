export async function POST(req) {
  try {
    const payload = await req.json();

    // Helius sends an array
    const tx = payload?.[0];
    if (!tx) return Response.json({ ok: true });

    const TARGET_MINT = process.env.TARGET_MINT;

    // Find token transfer for your mint
    const transfer = tx.tokenTransfers?.find(
      (t) => t.mint === TARGET_MINT
    );

    if (!transfer) return Response.json({ ok: true });

    const isBuy = transfer.toUserAccount !== null;
    const type = isBuy ? "🟢 BUY" : "🔴 SELL";

    const amount = transfer.tokenAmount;
    const wallet = isBuy
      ? transfer.toUserAccount
      : transfer.fromUserAccount;

    const message =
`${type} Pump.fun Trade

🪙 Mint:
${TARGET_MINT}

💰 Amount:
${amount}

👛 Wallet:
${wallet}

🔗 Tx:
https://solscan.io/tx/${tx.signature}`;

    await fetch(
      `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: process.env.TELEGRAM_CHAT_ID,
          text: message
        })
      }
    );

    return Response.json({ success: true });

  } catch (err) {
    console.error("Helius webhook error:", err);
    return Response.json({ error: true });
  }
}
