const mongoose = require('mongoose');

const WeatherCacheSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true // e.g. "lat:lon" or "city_name"
  },
  data: {
    type: Object,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 900 // Automatically delete cache after 15 minutes (900 seconds)
  }
});

module.exports = mongoose.model('WeatherCache', WeatherCacheSchema);
