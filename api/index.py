import os
import requests
import asyncio
from flask import Flask, request
from telegram import Update, Bot

app = Flask(__name__)

# Config
TOKEN = os.getenv("BOT_TOKEN")
MINT = "6yi6hyPp1Ubgn8iipWtDLt7Jou1zECTPm2pnheBmpump"
TOKEN_NAME = "SoldiumX"

# Create bot safely
bot = Bot(token=TOKEN) if TOKEN else None

async def handle_message(update):
    if not update.message or not update.message.text:
        return
    
    text = update.message.text.lower()
    chat_id = update.message.chat_id

    if text == "/start":
        await bot.send_message(chat_id=chat_id, text=f"Welcome to {TOKEN_NAME} Bot! Use /price.")
        
    elif text == "/price":
        try:
            res = requests.get(f"https://api.dexscreener.com/latest/dex/tokens/{MINT}").json()
            pair = res['pairs'][0]
            msg = (
                f"🚀 **{TOKEN_NAME} Stats**\n\n"
                f"💰 Price: ${pair['priceUsd']}\n"
                f"📊 MCap: ${pair['fdv']:,.0f}\n"
                f"📈 24h: {pair['priceChange']['h24']}%\n"
                f"🔗 [DexScreener]({pair['url']})"
            )
            await bot.send_message(chat_id=chat_id, text=msg, parse_mode="Markdown")
        except Exception as e:
            await bot.send_message(chat_id=chat_id, text="Error fetching price. Please try later.")

@app.route("/", methods=["POST"])
def webhook():
    if not bot:
        return "Bot Token Missing", 500
    try:
        update = Update.de_json(request.get_json(force=True), bot)
        asyncio.run(handle_message(update))
        return "OK", 200
    except Exception as e:
        print(f"Error: {e}")
        return "Error", 500

@app.route("/", methods=["GET"])
def index():
    if not TOKEN:
        return "Missing BOT_TOKEN in Environment Variables!", 200
    return f"Bot is active and loaded with token starting with {TOKEN[:5]}..."
