const express = require('express');
const router = express.Router();
const City = require('../models/City');

// @route   GET /api/cities
// @desc    Get all saved cities (MongoDB-driven or In-Memory fallback)
// @access  Public
router.get('/', async (req, res) => {
  try {
    if (global.useMemoryDB) {
      return res.json(global.memoryCities || []);
    }
    const cities = await City.find().sort({ createdAt: 1 });
    return res.json(cities);
  } catch (error) {
    console.error('Error fetching cities:', error);
    return res.status(500).json({ error: 'Failed to retrieve saved cities' });
  }
});

// @route   POST /api/cities
// @desc    Add a new city to the tracking board
// @access  Public
router.post('/', async (req, res) => {
  const { name, lat, lon, country } = req.body;

  if (!name || lat === undefined || lon === undefined) {
    return res.status(400).json({ error: 'City name, latitude, and longitude are required' });
  }

  try {
    const trimmedName = name.trim();
    const parsedLat = parseFloat(lat);
    const parsedLon = parseFloat(lon);

    // In-Memory Mode Handler
    if (global.useMemoryDB) {
      const exists = global.memoryCities.some(
        c => c.name.toLowerCase() === trimmedName.toLowerCase()
      );
      if (exists) {
        return res.status(400).json({ error: `City '${trimmedName}' is already on the tracking board` });
      }

      const newCity = {
        _id: `mem_${Date.now()}`,
        name: trimmedName,
        lat: parsedLat,
        lon: parsedLon,
        country: country || '',
        isDefault: false,
        createdAt: new Date()
      };

      global.memoryCities.push(newCity);
      return res.status(201).json(newCity);
    }

    // Normal MongoDB Mode
    const existingCity = await City.findOne({
      name: { $regex: new RegExp(`^${trimmedName}$`, 'i') }
    });

    if (existingCity) {
      return res.status(400).json({ error: `City '${trimmedName}' is already on the tracking board` });
    }

    const newCity = new City({
      name: trimmedName,
      lat: parsedLat,
      lon: parsedLon,
      country: country || '',
      isDefault: false
    });

    const savedCity = await newCity.save();
    return res.status(201).json(savedCity);
  } catch (error) {
    console.error('Error adding city:', error);
    return res.status(500).json({ error: 'Failed to add new city to dashboard' });
  }
});

// @route   DELETE /api/cities/:id
// @desc    Delete a city from the tracking board
// @access  Public
router.delete('/:id', async (req, res) => {
  try {
    // In-Memory Mode Handler
    if (global.useMemoryDB) {
      const cityExists = global.memoryCities.find(c => c._id === req.params.id);
      if (!cityExists) {
        return res.status(404).json({ error: 'City not found in memory' });
      }
      
      global.memoryCities = global.memoryCities.filter(c => c._id !== req.params.id);
      return res.json({ message: `City '${cityExists.name}' deleted successfully from memory` });
    }

    // Normal MongoDB Mode
    const city = await City.findById(req.params.id);
    if (!city) {
      return res.status(404).json({ error: 'City not found' });
    }

    await city.deleteOne();
    return res.json({ message: `City '${city.name}' deleted successfully` });
  } catch (error) {
    console.error('Error deleting city:', error);
    return res.status(500).json({ error: 'Failed to delete city from dashboard' });
  }
});

module.exports = router;
