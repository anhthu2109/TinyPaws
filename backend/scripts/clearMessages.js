const mongoose = require('mongoose');
require('dotenv').config();

const Message = require('../models/Message');

async function clearMessages() {
  try {
    const mongoUri = process.env.MONGO_DB || process.env.MONGO_URI || 'mongodb://localhost:27017/TINYPAWS';
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    console.log('🧹 Deleting all messages in collection...');
    const result = await Message.deleteMany({});
    console.log(`✅ Deleted ${result.deletedCount} messages.`);
  } catch (err) {
    console.error('❌ Error clearing messages collection:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

clearMessages();
