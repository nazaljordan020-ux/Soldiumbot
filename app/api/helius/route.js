import fetch from "node-fetch";

const HELIUS_API_KEY = process.env.HELIUS_API_KEY;
const WEBHOOK_URL = "https://YOUR-PROJECT-NAME.vercel.app/api/helius";

const body = {
  webhookURL: WEBHOOK_URL,
  transactionTypes: ["SWAP"],
  accountAddresses: [
    "6yi6hyPp1Ubgn8iipWtDLt7Jou1zECTPm2pnheBmpump"
  ],
  webhookType: "enhanced"
};

await fetch(`https://api.helius.xyz/v0/webhooks?api-key=${HELIUS_API_KEY}`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body)
});

console.log("Webhook created ✅");
