require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const City = require('./models/City');

const app = express();
app.set('trust proxy', 1);

const allowedOrigins = new Set(
  [
    'http://localhost:5173',
    'http://localhost:4173',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:4173'
  ].concat(
    (process.env.FRONTEND_ORIGIN || '')
      .split(',')
      .map(origin => origin.trim())
      .filter(Boolean)
  )
);

const corsOptions = {
  origin(origin, callback) {
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.has(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

const requestBuckets = new Map();
const createRateLimit = ({ windowMs, max }) => (req, res, next) => {
  const identity = req.ip || req.headers['x-forwarded-for'] || 'anonymous';
  const now = Date.now();
  const bucket = requestBuckets.get(identity);

  if (!bucket || now - bucket.startedAt >= windowMs) {
    requestBuckets.set(identity, { startedAt: now, count: 1 });
    return next();
  }

  if (bucket.count >= max) {
    return res.status(429).json({ error: 'Too many requests. Please try again shortly.' });
  }

  bucket.count += 1;
  requestBuckets.set(identity, bucket);
  return next();
};

setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of requestBuckets.entries()) {
    if (now - bucket.startedAt > 30 * 60 * 1000) {
      requestBuckets.delete(key);
    }
  }
}, 30 * 60 * 1000).unref();

// Initialize global memoryCities array for dynamic local preview fallback
global.memoryCities = [
  { _id: 'mem_1', name: 'Addis Ababa', lat: 9.03, lon: 38.74, country: 'Ethiopia', isDefault: true },
  { _id: 'mem_2', name: 'Dalian', lat: 38.92, lon: 121.61, country: 'China', isDefault: true },
  { _id: 'mem_3', name: 'New York', lat: 40.71, lon: -74.01, country: 'United States', isDefault: true },
  { _id: 'mem_4', name: 'London', lat: 51.51, lon: -0.13, country: 'United Kingdom', isDefault: true },
  { _id: 'mem_5', name: 'Tokyo', lat: 35.68, lon: 139.69, country: 'Japan', isDefault: true }
];

// 1. Establish Database Connection (awaited at startup below)

// 2. Middlewares
app.use(cors(corsOptions));
app.use(createRateLimit({ windowMs: 15 * 60 * 1000, max: 120 }));
app.use(express.json());

// 3. Database Preseeding Engine (for MongoDB cases)
const seedDefaultCities = async () => {
  try {
    if (global.useMemoryDB) return; // Skip if in-memory mode is active
    
    const count = await City.countDocuments();
    if (count === 0) {
      console.log('No cities found in MongoDB. Seeding default database records...');
      const defaultCities = [
        { name: 'Addis Ababa', lat: 9.03, lon: 38.74, country: 'Ethiopia', isDefault: true },
        { name: 'Dalian', lat: 38.92, lon: 121.61, country: 'China', isDefault: true },
        { name: 'New York', lat: 40.71, lon: -74.01, country: 'United States', isDefault: true },
        { name: 'London', lat: 51.51, lon: -0.13, country: 'United Kingdom', isDefault: true },
        { name: 'Tokyo', lat: 35.68, lon: 139.69, country: 'Japan', isDefault: true }
      ];
      await City.insertMany(defaultCities);
      console.log('Seeded 5 default cities in MongoDB successfully!');
    }
  } catch (error) {
    console.error('Error seeding default database records:', error);
  }
};

// Startup: connect DB, seed defaults, then open the HTTP port
const startServer = async () => {
  try {
    await connectDB();
    await seedDefaultCities();
  } catch (error) {
    console.error('❌ Failed to start backend:', error.message);
    process.exit(1);
  }

  // 4. Mount API Routes
  app.use('/api/weather', require('./routes/weather'));
  app.use('/api/cities', require('./routes/cities'));

  // 5. Health Check Endpoint
  app.get('/api/health', (req, res) => {
    res.json({ 
      status: 'healthy', 
      databaseMode: global.useMemoryDB ? 'In-Memory Preview' : 'MongoDB Production', 
      timestamp: new Date() 
    });
  });

  // 6. Listen
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Weather telemetry backend server running on port ${PORT}`);
    console.log(`Database Mode: ${global.useMemoryDB ? '🧠 In-Memory Preview' : '🗄️ MongoDB Production'}`);
  });
};

startServer();
