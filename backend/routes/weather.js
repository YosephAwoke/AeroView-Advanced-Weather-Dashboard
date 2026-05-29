const express = require('express');
const router = express.Router();
const axios = require('axios');
const WeatherCache = require('../models/WeatherCache');

// Initialize in-memory cache fallback store
global.memoryWeatherCache = global.memoryWeatherCache || {};

// Helper to map WMO weather codes to our five simplified categories
const mapWmoToCondition = (code) => {
  if (code === 0) return 'clear';
  if ([1, 2, 3, 45, 48].includes(code)) return 'cloudy';
  if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) return 'rainy';
  if ([71, 73, 75, 77, 85, 86, 56, 57, 66, 67].includes(code)) return 'snowy';
  if ([95, 96, 99].includes(code)) return 'stormy';
  return 'clear'; // default fallback
};

// Helper to map PM2.5 to standard Air Quality Index bands
const getAqiCategory = (pm25) => {
  if (pm25 <= 12) return { value: Math.round(pm25 * 4.16), status: 'Good', color: '#10B981' };
  if (pm25 <= 35.4) return { value: Math.round(50 + (pm25 - 12) * 2.14), status: 'Moderate', color: '#FBBF24' };
  if (pm25 <= 55.4) return { value: Math.round(100 + (pm25 - 35.4) * 2.5), status: 'Unhealthy for Sensitive Groups', color: '#F97316' };
  if (pm25 <= 150.4) return { value: Math.round(150 + (pm25 - 55.4) * 0.53), status: 'Unhealthy', color: '#EF4444' };
  return { value: 200, status: 'Hazardous', color: '#7F1D1D' };
};

// ==========================================
// RESILIENT TELEMETRY GENERATOR (OFFLINE MOCK FALLBACK)
// ==========================================
const generateMockTelemetry = (cityName, lat, lon) => {
  let condition = 'clear';
  let tempBase = 22;
  let humidityBase = 60;
  let pressureBase = 1012;
  let windSpeedBase = 12;
  let uvBase = 5;
  let aqiBase = 45;
  let aqiStatus = 'Good';
  let aqiColor = '#10B981';

  const nameLower = cityName.toLowerCase();
  
  if (nameLower.includes('london') || nameLower.includes('rain')) {
    condition = 'rainy';
    tempBase = 12;
    humidityBase = 88;
    pressureBase = 1007;
    windSpeedBase = 20;
    uvBase = 1;
    aqiBase = 18;
  } else if (nameLower.includes('tokyo') || nameLower.includes('dalian') || nameLower.includes('cloudy')) {
    condition = 'cloudy';
    tempBase = 17;
    humidityBase = 72;
    pressureBase = 1015;
    windSpeedBase = 11;
    uvBase = 3;
    aqiBase = 65;
    aqiStatus = 'Moderate';
    aqiColor = '#FBBF24';
  } else if (nameLower.includes('moscow') || nameLower.includes('snowy')) {
    condition = 'snowy';
    tempBase = -4;
    humidityBase = 85;
    pressureBase = 1009;
    windSpeedBase = 24;
    uvBase = 0;
    aqiBase = 12;
  } else if (nameLower.includes('stormy') || nameLower.includes('thunder') || nameLower.includes('addis')) {
    // Let's make Addis Ababa stormy/cloudy fallback occasionally for testing visual modes
    if (nameLower.includes('addis')) {
      condition = 'clear';
      tempBase = 24;
      humidityBase = 48;
      pressureBase = 1016;
      windSpeedBase = 9;
      uvBase = 9;
    } else {
      condition = 'stormy';
      tempBase = 15;
      humidityBase = 95;
      pressureBase = 997;
      windSpeedBase = 35;
      uvBase = 0;
      aqiBase = 75;
      aqiStatus = 'Moderate';
      aqiColor = '#FBBF24';
    }
  } else {
    // New York, Sydney, Cairo, Rio
    condition = 'clear';
    tempBase = 25;
    if (nameLower.includes('cairo')) tempBase = 33;
    if (nameLower.includes('sydney')) tempBase = 21;
    humidityBase = 42;
    pressureBase = 1018;
    windSpeedBase = 7;
    uvBase = 8;
  }

  // Generate 24 hours of hourly predictions
  const hourlyTime = [];
  const hourlyTemp = [];
  const hourlyHumidity = [];
  const hourlyPrecip = [];
  const hourlyUv = [];
  const hourlyCode = [];

  const now = new Date();
  for (let i = 0; i < 24; i++) {
    const d = new Date(now);
    d.setHours(now.getHours() + i);
    hourlyTime.push(d.toISOString());
    
    // Sinusoidal temperature curve over 24h
    const hourVal = d.getHours();
    const tempOffset = Math.sin((hourVal - 6) / 24 * Math.PI * 2) * 5;
    hourlyTemp.push(Math.round(tempBase + tempOffset));
    
    // Inverse humidity
    hourlyHumidity.push(Math.round(humidityBase - tempOffset * 2));
    
    hourlyPrecip.push(
      condition === 'rainy' ? Math.round(50 + Math.random() * 40) :
      condition === 'stormy' ? Math.round(70 + Math.random() * 30) :
      condition === 'snowy' ? Math.round(60 + Math.random() * 30) :
      Math.round(Math.random() * 15)
    );
    
    hourlyUv.push(Math.max(0, Math.round(uvBase * Math.sin(hourVal / 24 * Math.PI))));
    hourlyCode.push(condition === 'clear' ? 0 : condition === 'cloudy' ? 3 : condition === 'rainy' ? 61 : condition === 'snowy' ? 71 : 95);
  }

  // Generate 7 days daily prediction
  const dailyData = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    
    // Rotate forecast conditions for realistic portfolio layout
    let dayCondition = condition;
    if (condition === 'clear' && i % 3 === 2) dayCondition = 'cloudy';
    if (condition === 'rainy' && i % 4 === 3) dayCondition = 'stormy';
    if (condition === 'snowy' && i % 3 === 2) dayCondition = 'cloudy';

    dailyData.push({
      date: d.toISOString().split('T')[0],
      tempMax: Math.round(tempBase + 3 + Math.random() * 3),
      tempMin: Math.round(tempBase - 3 - Math.random() * 3),
      uvMax: uvBase,
      precipSum: dayCondition === 'rainy' ? 6 + Math.random() * 10 : dayCondition === 'stormy' ? 12 + Math.random() * 20 : 0,
      weatherCode: dayCondition === 'clear' ? 0 : dayCondition === 'cloudy' ? 3 : dayCondition === 'rainy' ? 61 : dayCondition === 'snowy' ? 71 : 95,
      condition: dayCondition
    });
  }

  return {
    cityName,
    latitude: lat,
    longitude: lon,
    condition,
    current: {
      temp: Math.round(tempBase + Math.random() * 1.5),
      feelsLike: Math.round(tempBase + Math.random() * 2 - 1),
      humidity: humidityBase,
      cloudCover: condition === 'clear' ? 10 : condition === 'cloudy' ? 75 : 95,
      pressure: pressureBase,
      windSpeed: windSpeedBase + Math.random() * 3,
      windDirection: Math.round(Math.random() * 360),
      uvIndex: uvBase,
      isDay: true,
      weatherCode: condition === 'clear' ? 0 : condition === 'cloudy' ? 3 : condition === 'rainy' ? 61 : 71
    },
    hourly: {
      time: hourlyTime,
      temp: hourlyTemp,
      humidity: hourlyHumidity,
      precipProb: hourlyPrecip,
      uvIndex: hourlyUv,
      weatherCode: hourlyCode
    },
    daily: dailyData,
    airQuality: {
      pm2_5: aqiBase / 4,
      pm10: aqiBase / 2,
      no2: 8,
      o3: 34,
      aqi: aqiBase,
      aqiStatus,
      aqiColor
    },
    offlineMock: true // Tag to identify as offline render
  };
};

// @route   GET /api/weather
// @desc    Get weather telemetry for coordinates (lat, lon)
// @access  Public
router.get('/', async (req, res) => {
  const { lat, lon, city } = req.query;

  if (!lat || !lon) {
    return res.status(400).json({ error: 'Latitude and Longitude are required' });
  }

  const roundedLat = parseFloat(lat).toFixed(2);
  const roundedLon = parseFloat(lon).toFixed(2);
  const cacheKey = `${roundedLat}:${roundedLon}`;
  const cityName = city || 'Unknown Location';

  try {
    // 1. Check Cache Layer (MongoDB or In-Memory fallback)
    if (global.useMemoryDB) {
      const cached = global.memoryWeatherCache[cacheKey];
      if (cached && Date.now() < cached.expiry) {
        return res.json({ ...cached.data, fromCache: true });
      }
    } else {
      const cachedData = await WeatherCache.findOne({ key: cacheKey });
      if (cachedData) {
        return res.json({ ...cachedData.data, fromCache: true });
      }
    }

    // 2. Fetch from external APIs in parallel
    try {
      const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${roundedLat}&longitude=${roundedLon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,showers,snowfall,weather_code,cloud_cover,pressure_msl,wind_speed_10m,wind_direction_10m,uv_index&hourly=temperature_2m,relative_humidity_2m,precipitation_probability,uv_index,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,uv_index_max,precipitation_sum&timezone=auto`;
      const aqUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${roundedLat}&longitude=${roundedLon}&current=pm2_5,pm10,nitrogen_dioxide,ozone&timezone=auto`;

      const [weatherRes, aqRes] = await Promise.all([
        axios.get(weatherUrl, { timeout: 3500 }), // 3.5s timeout for fast offline triggers
        axios.get(aqUrl, { timeout: 3500 })
      ]);

      const weather = weatherRes.data;
      const aq = aqRes.data;

      if (!weather || !weather.current) {
        throw new Error('Invalid response from Open-Meteo Forecast API');
      }

      const currentWmoCode = weather.current.weather_code;
      const condition = mapWmoToCondition(currentWmoCode);

      const pm25 = aq?.current?.pm2_5 || 10;
      const pm10 = aq?.current?.pm10 || 15;
      const no2 = aq?.current?.nitrogen_dioxide || 5;
      const o3 = aq?.current?.ozone || 40;
      const aqiBreakdown = getAqiCategory(pm25);

      const weatherPayload = {
        cityName,
        latitude: roundedLat,
        longitude: roundedLon,
        condition,
        current: {
          temp: weather.current.temperature_2m,
          feelsLike: weather.current.apparent_temperature,
          humidity: weather.current.relative_humidity_2m,
          cloudCover: weather.current.cloud_cover,
          pressure: weather.current.pressure_msl,
          windSpeed: weather.current.wind_speed_10m,
          windDirection: weather.current.wind_direction_10m,
          uvIndex: weather.current.uv_index,
          isDay: weather.current.is_day === 1,
          weatherCode: currentWmoCode
        },
        hourly: {
          time: weather.hourly.time.slice(0, 24),
          temp: weather.hourly.temperature_2m.slice(0, 24),
          humidity: weather.hourly.relative_humidity_2m.slice(0, 24),
          precipProb: weather.hourly.precipitation_probability.slice(0, 24),
          uvIndex: weather.hourly.uv_index.slice(0, 24),
          weatherCode: weather.hourly.weather_code.slice(0, 24)
        },
        daily: weather.daily.time.map((time, idx) => ({
          date: time,
          tempMax: weather.daily.temperature_2m_max[idx],
          tempMin: weather.daily.temperature_2m_min[idx],
          uvMax: weather.daily.uv_index_max[idx],
          precipSum: weather.daily.precipitation_sum[idx],
          weatherCode: weather.daily.weather_code[idx],
          condition: mapWmoToCondition(weather.daily.weather_code[idx])
        })),
        airQuality: {
          pm2_5: pm25,
          pm10: pm10,
          no2: no2,
          o3: o3,
          aqi: aqiBreakdown.value,
          aqiStatus: aqiBreakdown.status,
          aqiColor: aqiBreakdown.color
        },
        offlineMock: false
      };

      // Cache the API payload
      if (global.useMemoryDB) {
        global.memoryWeatherCache[cacheKey] = {
          data: weatherPayload,
          expiry: Date.now() + 15 * 60 * 1000
        };
      } else {
        await WeatherCache.create({ key: cacheKey, data: weatherPayload });
      }

      return res.json({ ...weatherPayload, fromCache: false });

    } catch (networkError) {
      // INTERCEPT NET ERRORS (e.g. ECONNREFUSED/ETIMEDOUT) -> GENERATE RICH SIMULATED RECORDS
      console.warn(`🛰️ [NETWORK FALLBACK] API connection failed for ${cityName}: ${networkError.message}. Generating dynamic simulated telemetry!`);
      const mockPayload = generateMockTelemetry(cityName, roundedLat, roundedLon);

      // Cache the mock payload so subsequent quick tab-clicks are instant
      if (global.useMemoryDB) {
        global.memoryWeatherCache[cacheKey] = {
          data: mockPayload,
          expiry: Date.now() + 15 * 60 * 1000
        };
      } else {
        // If mongo is online but open-meteo is offline, store mock in MongoDB cache
        try {
          await WeatherCache.create({ key: cacheKey, data: mockPayload });
        } catch (dbErr) {
          console.error('Failed to store mock in MongoDB:', dbErr.message);
        }
      }

      return res.json({ ...mockPayload, fromCache: false });
    }

  } catch (error) {
    console.error('Global Route Error:', error.message);
    return res.status(500).json({ error: 'Failed to process weather request', details: error.message });
  }
});

module.exports = router;
