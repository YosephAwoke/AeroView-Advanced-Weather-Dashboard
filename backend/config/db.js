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
    console.warn(`\n⚠️  [DATABASE WARNING] Could not connect to MongoDB: ${error.message}`);
    console.warn(`🚀 [FALLBACK] Activating high-performance In-Memory Database engine for local preview!\n`);
    global.useMemoryDB = true;
  }
};

module.exports = connectDB;
