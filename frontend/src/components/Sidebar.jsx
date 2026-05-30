import { useEffect, useRef, useState } from 'react';
import { useWeather } from '../context/WeatherContext';
import { useWeatherTheme } from '../hooks/useWeatherTheme';
import { CityMinicard } from './CityMinicard';
import { Plus, SunDim, Moon, ChevronDown, ChevronUp, MapPin, Loader2 } from 'lucide-react';

export const Sidebar = () => {
  const { cities, viewMode, setViewMode, addTrackedCity, isLoading, reorderCities } = useWeather();
  const { theme } = useWeatherTheme();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [cityName, setCityName] = useState('');
  const [citySuggestions, setCitySuggestions] = useState([]);
  const [isSearchingCities, setIsSearchingCities] = useState(false);
  const [lat, setLat] = useState('');
  const [lon, setLon] = useState('');
  const [country, setCountry] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const searchTimeoutRef = useRef(null);
  const suggestionAbortRef = useRef(null);
  const selectionRef = useRef(false);

  // Quick preset catalog for easy portfolio testing
  const presets = [
    { name: 'Paris', lat: 48.86, lon: 2.35, country: 'France' },
    { name: 'Sydney', lat: -33.87, lon: 151.21, country: 'Australia' },
    { name: 'Cairo', lat: 30.04, lon: 31.24, country: 'Egypt' },
    { name: 'Moscow', lat: 55.76, lon: 37.62, country: 'Russia' },
    { name: 'Rio de Janeiro', lat: -22.91, lon: -43.17, country: 'Brazil' }
  ];

  const handleApplyPreset = (preset) => {
    setCityName(preset.name);
    setLat(preset.lat.toString());
    setLon(preset.lon.toString());
    setCountry(preset.country);
    setCitySuggestions([]);
  };

  useEffect(() => {
    if (selectionRef.current) {
      // A suggestion was just chosen; suppress the next auto-search cycle
      selectionRef.current = false;
      setIsSearchingCities(false);
      setCitySuggestions([]);
      if (suggestionAbortRef.current) suggestionAbortRef.current.abort();
      return;
    }
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    const query = cityName.trim();
    if (query.length < 2) {
      if (suggestionAbortRef.current) {
        suggestionAbortRef.current.abort();
      }
      const resetTimer = setTimeout(() => {
        setCitySuggestions([]);
        setIsSearchingCities(false);
      }, 0);

      return () => {
        clearTimeout(resetTimer);
      };
    }

    searchTimeoutRef.current = setTimeout(async () => {
      if (suggestionAbortRef.current) {
        suggestionAbortRef.current.abort();
      }

      const controller = new AbortController();
      suggestionAbortRef.current = controller;
      setIsSearchingCities(true);

      try {
        const response = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=6&language=en&format=json`,
          { signal: controller.signal }
        );

        if (!response.ok) {
          throw new Error('Failed to search cities');
        }

        const data = await response.json();
        const results = Array.isArray(data?.results) ? data.results : [];
        setCitySuggestions(results.map((item) => ({
          id: `${item.id}-${item.name}-${item.country_code}`,
          name: item.name,
          country: item.country || '',
          admin1: item.admin1 || '',
          latitude: item.latitude,
          longitude: item.longitude
        })));
      } catch (error) {
        if (error.name !== 'AbortError') {
          setCitySuggestions([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsSearchingCities(false);
        }
      }
    }, 250);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [cityName]);

  const applyLocationSuggestion = (suggestion) => {
    // Mark that a selection occurred to avoid the effect re-searching
    selectionRef.current = true;
    if (suggestionAbortRef.current) suggestionAbortRef.current.abort();
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    setCityName(suggestion.name);
    setCountry(suggestion.country);
    setLat(String(suggestion.latitude));
    setLon(String(suggestion.longitude));
    setCitySuggestions([]);
    setFormError('');
  };

  const resolveCoordinates = async (name, countryHint) => {
    const query = countryHint ? `${name} ${countryHint}` : name;
    const response = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en&format=json`
    );

    if (!response.ok) {
      throw new Error('Could not look up location coordinates.');
    }

    const data = await response.json();
    const result = data?.results?.[0];

    if (!result) {
      throw new Error('No matching city found. Please pick a suggestion or enter coordinates manually.');
    }

    return {
      name: result.name || name,
      country: result.country || countryHint || '',
      lat: result.latitude,
      lon: result.longitude
    };
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setIsSubmitting(true);

    if (!cityName) {
      setFormError('City name is required. Latitude and longitude are optional.');
      setIsSubmitting(false);
      return;
    }

    let parsedLat = lat ? parseFloat(lat) : null;
    let parsedLon = lon ? parseFloat(lon) : null;

    if ((lat && Number.isNaN(parsedLat)) || (lon && Number.isNaN(parsedLon))) {
      setFormError('Latitude and longitude must be valid numbers when provided.');
      setIsSubmitting(false);
      return;
    }

    if (parsedLat !== null && (parsedLat < -90 || parsedLat > 90)) {
      setFormError('Latitude must be between -90 and 90 when provided.');
      setIsSubmitting(false);
      return;
    }

    if (parsedLon !== null && (parsedLon < -180 || parsedLon > 180)) {
      setFormError('Longitude must be between -180 and 180 when provided.');
      setIsSubmitting(false);
      return;
    }

    if (parsedLat === null || parsedLon === null) {
      try {
        const resolved = await resolveCoordinates(cityName.trim(), country.trim());
        parsedLat = resolved.lat;
        parsedLon = resolved.lon;
        if (!country.trim() && resolved.country) {
          setCountry(resolved.country);
        }
        setLat(String(parsedLat));
        setLon(String(parsedLon));
      } catch (error) {
        setFormError(error.message || 'Please choose a suggestion or add coordinates manually.');
        setIsSubmitting(false);
        return;
      }
    }

    const result = await addTrackedCity(cityName.trim(), parsedLat, parsedLon, country.trim());
    
    if (result.success) {
      setCityName('');
      setLat('');
      setLon('');
      setCountry('');
      setCitySuggestions([]);
      setIsFormOpen(false);
    } else {
      setFormError(result.message || 'Failed to add custom city location.');
    }
    setIsSubmitting(false);
  };

  return (
    <aside className="w-full lg:w-[390px] h-full flex flex-col gap-5 z-10 relative">
      {/* 1. Header with branding and theme triggers */}
      <div className="glass-panel p-3 flex items-center justify-between shadow-glass border-white/10">
        <div className="flex items-center min-w-0 pr-3">
          <img
            src={theme === 'dark' ? '/weather-darklogo.png' : '/weather-whitelogo.png'}
            alt="AeroView logo"
            className={`w-auto max-w-[360px] object-contain ${theme === 'dark' ? 'h-[4.5rem] md:h-[5rem]' : 'h-14 md:h-16'}`}
            loading="eager"
            decoding="async"
          />
        </div>

        {/* Theme mode toggle controls */}
        <button
          onClick={() => setViewMode(viewMode === 'light' ? 'dark' : 'light')}
          className="p-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 hover:bg-white/10 text-textSecondary hover:text-textPrimary transition-all duration-300"
          title={`Switch to ${viewMode === 'light' ? 'Dark' : 'Light'} Mode`}
        >
          {viewMode === 'light' ? <Moon size={18} /> : <SunDim size={18} />}
        </button>
      </div>

      {/* 2. Track new location panel */}
      <div className="glass-panel shadow-glass border-white/10 overflow-hidden">
        <button
          onClick={() => setIsFormOpen(!isFormOpen)}
          className="w-full p-5 flex items-center justify-between font-black text-sm tracking-wider text-textPrimary hover:bg-white/5 transition-colors uppercase border-b border-transparent"
          style={{ borderBottomColor: isFormOpen ? 'rgba(255,255,255,0.06)' : 'transparent' }}
        >
          <span className="flex items-center gap-2">
            <Plus size={16} className="text-accent" /> Track New Location
          </span>
          {isFormOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {isFormOpen && (
          <form onSubmit={handleFormSubmit} className="p-5 space-y-4 border-t border-white/5 bg-black/[0.04]">
            {/* Quick Presets row */}
            <div className="space-y-2">
              <span className="text-[10px] uppercase font-black text-textSecondary tracking-wider block opacity-75">
                Quick Preset Locations
              </span>
              <div className="flex flex-wrap gap-1.5">
                {presets.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => handleApplyPreset(preset)}
                    className="text-[10px] font-bold px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/5 hover:bg-accent/15 hover:border-accent/25 hover:text-textPrimary text-textSecondary transition-all duration-200"
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-[1px] bg-white/5 w-full my-3" />

            {/* Inputs */}
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-[10px] uppercase font-black text-textSecondary tracking-wider block mb-1">
                  Location Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={cityName}
                    onChange={(e) => setCityName(e.target.value)}
                    placeholder="e.g. Paris"
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-sm text-textPrimary placeholder-textSecondary/50 focus:outline-none focus:border-accent/40 focus:ring-1 focus:ring-accent/20 transition-all"
                    autoComplete="off"
                  />

                  {cityName.trim().length >= 2 && (isSearchingCities || citySuggestions.length > 0) && (
                    <div
                      className={`absolute left-0 right-0 top-[calc(100%+8px)] z-20 rounded-xl border backdrop-blur-xl shadow-2xl overflow-hidden ${
                        theme === 'light'
                          ? 'border-slate-200/80 bg-white/95'
                          : 'border-white/15 bg-slate-950/90'
                      }`}
                    >
                      {isSearchingCities && (
                        <div className={`px-4 py-3 text-sm font-semibold border-b ${theme === 'light' ? 'text-slate-600 border-slate-200/80 bg-slate-50' : 'text-textSecondary border-white/10 bg-white/5'}`}>
                          Searching locations...
                        </div>
                      )}

                      {!isSearchingCities && citySuggestions.length === 0 ? (
                        <div className={`px-4 py-3 text-sm font-semibold ${theme === 'light' ? 'text-slate-600 bg-slate-50' : 'text-textSecondary bg-white/5'}`}>
                          No matches found.
                        </div>
                      ) : (
                        citySuggestions.map((suggestion) => (
                          <button
                            key={suggestion.id}
                            type="button"
                            onClick={() => applyLocationSuggestion(suggestion)}
                            className={`w-full text-left px-4 py-3 transition-colors border-b last:border-b-0 ${
                              theme === 'light'
                                ? 'hover:bg-slate-100 border-slate-200/80'
                                : 'hover:bg-white/10 border-white/10'
                            }`}
                          >
                            <div className={`text-base font-semibold ${theme === 'light' ? 'text-slate-900' : 'text-textPrimary'}`}>{suggestion.name}</div>
                            <div className={`mt-0.5 text-sm ${theme === 'light' ? 'text-slate-600' : 'text-textSecondary'}`}>
                              {[suggestion.admin1, suggestion.country].filter(Boolean).join(', ')}
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase font-black text-textSecondary tracking-wider block mb-1">
                  Latitude <span className="font-medium normal-case opacity-70">(optional)</span>
                </label>
                <input
                  type="text"
                  value={lat}
                  onChange={(e) => setLat(e.target.value)}
                  placeholder="e.g. 48.86"
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-sm text-textPrimary placeholder-textSecondary/50 focus:outline-none focus:border-accent/40 focus:ring-1 focus:ring-accent/20 transition-all"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-black text-textSecondary tracking-wider block mb-1">
                  Longitude <span className="font-medium normal-case opacity-70">(optional)</span>
                </label>
                <input
                  type="text"
                  value={lon}
                  onChange={(e) => setLon(e.target.value)}
                  placeholder="e.g. 2.35"
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-sm text-textPrimary placeholder-textSecondary/50 focus:outline-none focus:border-accent/40 focus:ring-1 focus:ring-accent/20 transition-all"
                />
              </div>

              <div className="col-span-2">
                <label className="text-[10px] uppercase font-black text-textSecondary tracking-wider block mb-1">
                  Country (Optional)
                </label>
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="e.g. France"
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-sm text-textPrimary placeholder-textSecondary/50 focus:outline-none focus:border-accent/40 focus:ring-1 focus:ring-accent/20 transition-all"
                />
              </div>
            </div>

            {formError && (
              <p className="text-xs text-red-500/90 font-semibold leading-normal bg-red-500/10 border border-red-500/10 rounded-xl p-3">
                {formError}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full bg-accent hover:opacity-90 disabled:opacity-50 ${theme === 'light' ? 'text-slate-900' : 'text-white'} font-extrabold text-xs py-2.5 rounded-xl flex items-center justify-center gap-1.5 shadow-glow hover:shadow-lg transition-all`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Adding...
                </>
              ) : (
                <>
                  <MapPin size={14} /> Add Tracked City
                </>
              )}
            </button>
          </form>
        )}
      </div>

      {/* 3. Dynamic search city list wrapper */}
      <div className="flex-1 flex flex-col min-h-0">
        <span className="text-xs uppercase font-black text-textSecondary tracking-wider block mb-3 px-1 opacity-75">
          Tracked Locations ({cities.length})
        </span>

        {isLoading && cities.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center glass-panel border-white/10 p-6 min-h-[250px]">
            <Loader2 size={36} className="text-accent animate-spin mb-3" />
            <p className="text-sm text-textSecondary font-extrabold">Synchronizing Database...</p>
          </div>
        ) : cities.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center glass-panel border-white/10 border-dashed p-6 min-h-[250px]">
            <p className="text-xs text-textSecondary text-center font-bold leading-relaxed max-w-[220px]">
              No locations tracked. Click "Track New Location" above to seed.
            </p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-4 max-h-[calc(100vh-270px)]">
            {cities.map((city, index) => (
              <div
                key={city._id}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/plain', city._id);
                  e.dataTransfer.effectAllowed = 'move';
                }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const draggedId = e.dataTransfer.getData('text/plain');
                  if (!draggedId || draggedId === city._id) return;
                  const srcIndex = cities.findIndex(c => c._id === draggedId);
                  const dstIndex = index;
                  if (srcIndex === -1) return;
                  const next = [...cities];
                  const [moved] = next.splice(srcIndex, 1);
                  next.splice(dstIndex, 0, moved);
                  reorderCities(next);
                }}
              >
                <CityMinicard city={city} />
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
};
