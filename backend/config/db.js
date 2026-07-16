const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const connURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/weather';
    
    console.log(`Connecting to MongoDB at: ${connURI}...`);
    
    // Disable Mongoose command buffering so queries fail immediately if DB is offline,
    // preventing the API from hanging for 30 seconds.
    mongoose.set('bufferCommands', false);
    
    // Set a short timeout (2.5 seconds) for server selection
    const conn = await mongoose.connect(connURI, {
      serverSelectionTimeoutMS: 2500,
    });
    
    console.log(`MongoDB Connected successfully: ${conn.connection.host}`);
    global.useMemoryDB = false;
  } catch (error) {
    const allowMemoryFallback = process.env.ALLOW_MEMORY_DB_FALLBACK === 'true' || process.env.NODE_ENV !== 'production';
    console.warn(`\n⚠️  [DATABASE WARNING] Could not connect to MongoDB: ${error.message}`);

    if (!allowMemoryFallback) {
      console.error('❌ [DATABASE ERROR] Memory fallback is disabled in production. Refusing to start with an unavailable database.');
      throw error;
    }

    console.warn(`🚀 [FALLBACK] Activating in-memory database mode for local preview only!\n`);
    global.useMemoryDB = true;
  }
};

module.exports = connectDB;
