const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');

async function createBotUser() {
  try {
    const mongoUri = process.env.MONGO_DB || process.env.MONGO_URI || 'mongodb://localhost:27017/TINYPAWS';
    await mongoose.connect(mongoUri);

    // Kiểm tra xem bot user đã tồn tại chưa
    const existingBot = await User.findOne({ role: 'bot' });
    if (existingBot) {
      return;
    }

    const botEmail = process.env.CHATBOT_BOT_EMAIL || 'tinypaws.chatbot@tinypaws.com';

    const botUser = new User({
      email: botEmail,
      full_name: 'TinyPaws Chatbot',
      role: 'bot',
      avatar: '/images/bot.png',
      bio: 'TinyPaws Chatbot - trợ lý AI hỗ trợ tư vấn thú cưng và sản phẩm.'
    });

    await botUser.save();

  } catch (err) {
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

createBotUser();
