import os
import requests
from flask import Flask, request
from telegram import Update
from telegram.ext import Application, CommandHandler, ContextTypes

app = Flask(__name__)

# Config
TOKEN = os.getenv("BOT_TOKEN")
MINT = "6yi6hyPp1Ubgn8iipWtDLt7Jou1zECTPm2pnheBmpump"
TOKEN_NAME = "SoldiumX"

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(f"👋 Welcome to {TOKEN_NAME} Official Bot!\nUse /price to see live statistics.")

async def get_price(update: Update, context: ContextTypes.DEFAULT_TYPE):
    try:
        response = requests.get(f"https://api.dexscreener.com/latest/dex/tokens/{MINT}")
        data = response.json()
        pair = data['pairs'][0]
        
        price = pair['priceUsd']
        mcap = pair.get('fdv', 0)
        h24_change = pair['priceChange']['h24']
        link = pair['url']

        text = (
            f"🚀 **{TOKEN_NAME} Token Info**\n\n"
            f"💰 **Price:** ${price}\n"
            f"📊 **Market Cap:** ${mcap:,.0f}\n"
            f"📈 **24h Change:** {h24_change}%\n\n"
            f"🔗 [View on DexScreener]({link})"
        )
        await update.message.reply_text(text, parse_mode="Markdown", disable_web_page_preview=False)
    except Exception as e:
        await update.message.reply_text("❌ Error fetching live data. Please try again later.")

# Initialize Bot
ptb_app = Application.builder().token(TOKEN).build()
ptb_app.add_handler(CommandHandler("start", start))
ptb_app.add_handler(CommandHandler("price", get_price))

@app.route("/", methods=["POST"])
async def webhook():
    update = Update.de_json(request.get_json(force=True), ptb_app.bot)
    async with ptb_app:
        await ptb_app.process_update(update)
    return "OK", 200

@app.route("/", methods=["GET"])
def index():
    return f"{TOKEN_NAME} Bot is Online"
