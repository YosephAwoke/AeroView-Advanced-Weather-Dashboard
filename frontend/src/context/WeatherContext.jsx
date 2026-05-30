/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';

const WeatherContext = createContext(null);

export const useWeather = () => {
  const context = useContext(WeatherContext);
  if (!context) {
    throw new Error('useWeather must be used within a WeatherProvider');
  }
  return context;
};

export const WeatherProvider = ({ children }) => {
  const [cities, setCities] = useState([]);
  const [citiesData, setCitiesData] = useState({});
  const [activeCityId, setActiveCityId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const hasFetchedRef = useRef(false); // Prevents React StrictMode double-fetch
  const activeCityIdRef = useRef(null);
  const citiesDataRef = useRef({});

  // Read theme viewMode preference: default to local storage, otherwise light mode
  const [viewMode, setViewMode] = useState(() => {
    const saved = localStorage.getItem('theme_preference');
    if (saved) return saved;
    return 'light';
  });

  const BACKEND_URL = 'http://localhost:5000/api';

  // Helper: fetch with a timeout to prevent hanging if backend is down
  const fetchWithTimeout = async (url, timeoutMs = 6000) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      return res;
    } catch (err) {
      clearTimeout(timeoutId);
      throw err;
    }
  };

  // 1. Synchronize document themes
  useEffect(() => {
    localStorage.setItem('theme_preference', viewMode);
  }, [viewMode]);

  useEffect(() => {
    activeCityIdRef.current = activeCityId;
  }, [activeCityId]);

  useEffect(() => {
    citiesDataRef.current = citiesData;
  }, [citiesData]);

  // 2. Fetch all tracked cities from MongoDB and pull weather telemetry
  const fetchAllData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Step A: Load tracked cities list from database (6s timeout)
      const citiesRes = await fetchWithTimeout(`${BACKEND_URL}/cities`);
      if (!citiesRes.ok) throw new Error('Failed to retrieve cities list from backend');
      const citiesList = await citiesRes.json();
      // Apply locally stored ordering if present
      let orderedCities = citiesList;
      try {
        const storedOrder = JSON.parse(localStorage.getItem('city_order') || 'null');
        if (Array.isArray(storedOrder) && storedOrder.length > 0) {
          const byId = Object.fromEntries(citiesList.map(c => [c._id, c]));
          const ordered = [];
          storedOrder.forEach(id => { if (byId[id]) ordered.push(byId[id]); });
          // append any new cities that weren't stored
          citiesList.forEach(c => { if (!storedOrder.includes(c._id)) ordered.push(c); });
          orderedCities = ordered;
        }
      } catch {
        // ignore parse errors and fall back to server ordering
      }
      setCities(orderedCities);

      if (citiesList.length === 0) {
        setCitiesData({});
        setActiveCityId(null);
        setIsLoading(false);
        return;
      }

      const currentActiveCityId = activeCityIdRef.current;
      const nextActiveCityId = orderedCities.some(city => city._id === currentActiveCityId)
        ? currentActiveCityId
        : orderedCities[0]._id;

      setActiveCityId(nextActiveCityId);

      const activeCity = orderedCities.find(city => city._id === nextActiveCityId);
      const cachedActiveWeather = citiesDataRef.current[nextActiveCityId];

      if (!cachedActiveWeather && activeCity) {
        const activeWeatherRes = await fetchWithTimeout(
          `${BACKEND_URL}/weather?lat=${activeCity.lat}&lon=${activeCity.lon}&city=${encodeURIComponent(activeCity.name)}`,
          6000
        );

        if (activeWeatherRes.ok) {
          const activeWeatherJson = await activeWeatherRes.json();
          setCitiesData(prev => ({ ...prev, [activeCity._id]: activeWeatherJson }));
        }
      }

      setIsLoading(false);

      orderedCities.forEach((city) => {
        if (city._id === nextActiveCityId) return;

        void (async () => {
          try {
            const res = await fetchWithTimeout(
              `${BACKEND_URL}/weather?lat=${city.lat}&lon=${city.lon}&city=${encodeURIComponent(city.name)}`,
              8000
            );
            if (!res.ok) return;
            const weatherJson = await res.json();
            setCitiesData(prev => ({ ...prev, [city._id]: weatherJson }));
          } catch (err) {
            console.error(err);
          }
        })();
      });
    } catch (err) {
      console.error('Core Context Loading Error:', err);
      setError('Could not connect to the backend server. Please verify the Express backend is running on port 5000.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Allow reordering of tracked cities in UI; persist ordering to localStorage
  const reorderCities = (newOrder) => {
    setCities(newOrder);
    try {
      const ids = newOrder.map(c => c._id);
      localStorage.setItem('city_order', JSON.stringify(ids));
    } catch (e) {
      console.error('Failed to persist city order', e);
    }
  };

  useEffect(() => {
    // Guard against React StrictMode double-mount in dev
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;

    fetchAllData();
    // Setup automatic refresh every 5 minutes (300,000 ms)
    const interval = setInterval(fetchAllData, 300000);
    return () => clearInterval(interval);
  }, [fetchAllData]);

  // 3. Add custom city tracking
  const addTrackedCity = async (name, lat, lon, country) => {
    try {
      const res = await fetch(`${BACKEND_URL}/cities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, lat, lon, country })
      });
      
      const responseData = await res.json();
      if (!res.ok) {
        throw new Error(responseData.error || 'Failed to add custom city');
      }

      // Reload entire list and fetch telemetry
      setCities(prev => [...prev, responseData]);
      
      // Load telemetry for new city in background
      const weatherRes = await fetch(`${BACKEND_URL}/weather?lat=${lat}&lon=${lon}&city=${encodeURIComponent(name)}`);
      if (weatherRes.ok) {
        const weatherJson = await weatherRes.json();
        setCitiesData(prev => ({ ...prev, [responseData._id]: weatherJson }));
      }

      setActiveCityId(responseData._id);
      return { success: true };
    } catch (err) {
      console.error(err);
      return { success: false, message: err.message };
    }
  };

  // 4. Delete tracked city
  const removeTrackedCity = async (id) => {
    try {
      const res = await fetch(`${BACKEND_URL}/cities/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Failed to delete city');

      // Update lists
      setCities(prev => prev.filter(c => c._id !== id));
      setCitiesData(prev => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });

      // Shift active pointer if deleted active city
      if (activeCityId === id) {
        const remaining = cities.filter(c => c._id !== id);
        if (remaining.length > 0) {
          setActiveCityId(remaining[0]._id);
        } else {
          setActiveCityId(null);
        }
      }
      return { success: true };
    } catch (err) {
      console.error(err);
      return { success: false, message: err.message };
    }
  };

  // Resolve active telemetry helper
  const getActiveCityWeather = () => {
    if (!activeCityId || !citiesData[activeCityId]) return null;
    return citiesData[activeCityId];
  };

  return (
    <WeatherContext.Provider value={{
      cities,
      citiesData,
      activeCityId,
      setActiveCityId,
      activeWeather: getActiveCityWeather(),
      isLoading,
      error,
      viewMode,
      setViewMode,
      addTrackedCity,
      removeTrackedCity,
      refreshData: fetchAllData,
      reorderCities
    }}>
      {children}
    </WeatherContext.Provider>
  );
};
