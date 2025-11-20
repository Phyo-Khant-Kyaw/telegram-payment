const express = require("express");
const TelegramBot = require('node-telegram-bot-api');
const encode = require('jwt-encode');
const axios = require('axios');
const jwtDecode = require('jwt-decode');
const app = express();
const port = 3000;

const BOT_TOKEN = process.env.BOT_TOKEN || "8485618565:AAFiQgag0qDq-L_FarfJkgfejk4E-RpfYQA";
const MERCHANT_ID = process.env.MERCHANT_ID || "MPSSD0000000083";
const SECRET_KEY = process.env.SECRET_KEY || "q8zL1hqwOocl9tVjhYJo9RilpaDiL-c5p8Yh52nn8tE";
const API_URL = process.env.API_URL || "https://test.octoverse.com.mm/api/payment/auth/token";

const PRICE_OPTIONS = [1500, 3000, 5000, 10000];

app.get("/", (req, res) => {
  res.send("Hello World!");
});

const bot = new TelegramBot(BOT_TOKEN, { polling: true });

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;

  const inlineKeyboard = PRICE_OPTIONS.map((p) => [
    { text: `${p} MMK`, callback_data: String(p) },
  ]);

  bot.sendMessage(chatId, "🛒 Choose a payment amount:", {
    reply_markup: { inline_keyboard: inlineKeyboard },
  });
});

// Handle price selection
bot.on("callback_query", async (query) => {
  const chatId = query.message.chat.id;
  const amount = Number(query.data);
  const invoiceNo = `INV${Date.now()}`;

  const payload = {
    merchantID: MERCHANT_ID,
    invoiceNo,
    amount,
    currencyCode: "MMK",
  };

  try {
    const encodedToken = encode(payload, SECRET_KEY);

    const response = await axios.post(API_URL, { payData: encodedToken });

    if (response.data.respCode === "0000") {
      const decoded = jwtDecode(response.data.data);
      const paymentUrl = decoded.paymenturl;

      bot.sendMessage(
        chatId,
        `✅ *Payment URL Generated!*\n\n💵 Amount: *${amount} MMK*\n🧾 Invoice: *${invoiceNo}*\n\n👉 Click here to pay:\n${paymentUrl}`,
        { parse_mode: "Markdown" }
      );
    } else {
      bot.sendMessage(chatId, "❌ Failed to generate payment URL.");
    }
  } catch (error) {
    console.error("API error:", error.message);
    bot.sendMessage(chatId, "❌ Server error occurred. Please try again.");
  }
});

app.listen(port, () => {
  console.log(`Express app listening on port ${port}`);
});
