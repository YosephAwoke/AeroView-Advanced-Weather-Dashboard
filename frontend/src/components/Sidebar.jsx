import React, { useState } from 'react';
import { useWeather } from '../context/WeatherContext';
import { CityMinicard } from './CityMinicard';
import { Plus, SunDim, Moon, Compass, ChevronDown, ChevronUp, MapPin, Loader2 } from 'lucide-react';

export const Sidebar = () => {
  const { cities, viewMode, setViewMode, addTrackedCity, isLoading } = useWeather();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [cityName, setCityName] = useState('');
  const [lat, setLat] = useState('');
  const [lon, setLon] = useState('');
  const [country, setCountry] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

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
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setIsSubmitting(true);

    if (!cityName || !lat || !lon) {
      setFormError('Name, Latitude, and Longitude are required.');
      setIsSubmitting(false);
      return;
    }

    const parsedLat = parseFloat(lat);
    const parsedLon = parseFloat(lon);

    if (isNaN(parsedLat) || parsedLat < -90 || parsedLat > 90) {
      setFormError('Latitude must be a valid number between -90 and 90.');
      setIsSubmitting(false);
      return;
    }

    if (isNaN(parsedLon) || parsedLon < -180 || parsedLon > 180) {
      setFormError('Longitude must be a valid number between -180 and 180.');
      setIsSubmitting(false);
      return;
    }

    const result = await addTrackedCity(cityName, parsedLat, parsedLon, country);
    
    if (result.success) {
      setCityName('');
      setLat('');
      setLon('');
      setCountry('');
      setIsFormOpen(false);
    } else {
      setFormError(result.message || 'Failed to add custom city location.');
    }
    setIsSubmitting(false);
  };

  return (
    <aside className="w-full lg:w-[390px] h-full flex flex-col gap-5 z-10 relative">
      {/* 1. Header with branding and theme triggers */}
      <div className="glass-panel p-5 flex items-center justify-between shadow-glass border-white/10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-accent/20 border border-accent/20 text-accent animate-pulse-slow">
            <Compass size={22} />
          </div>
          <div>
            <h1 className="font-black text-xl tracking-wider uppercase bg-clip-text text-transparent bg-gradient-to-r from-textPrimary via-accent to-textPrimary">
              Aetheris
            </h1>
            <p className="text-xs uppercase font-extrabold tracking-widest text-textSecondary opacity-80 mt-0.5">
              Weather Intelligence
            </p>
          </div>
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
                <input
                  type="text"
                  value={cityName}
                  onChange={(e) => setCityName(e.target.value)}
                  placeholder="e.g. Paris"
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-sm text-textPrimary placeholder-textSecondary/50 focus:outline-none focus:border-accent/40 focus:ring-1 focus:ring-accent/20 transition-all"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-black text-textSecondary tracking-wider block mb-1">
                  Latitude
                </label>
                <input
                  type="text"
                  value={lat}
                  onChange={(e) => setLat(e.target.value)}
                  placeholder="e.g. 48.86"
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-sm text-textPrimary placeholder-textSecondary/50 focus:outline-none focus:border-accent/40 focus:ring-1 focus:ring-accent/20 transition-all"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-black text-textSecondary tracking-wider block mb-1">
                  Longitude
                </label>
                <input
                  type="text"
                  value={lon}
                  onChange={(e) => setLon(e.target.value)}
                  placeholder="e.g. 2.35"
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-sm text-textPrimary placeholder-textSecondary/50 focus:outline-none focus:border-accent/40 focus:ring-1 focus:ring-accent/20 transition-all"
                  required
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
              className="w-full bg-accent hover:opacity-90 disabled:opacity-50 text-white font-extrabold text-xs py-2.5 rounded-xl flex items-center justify-center gap-1.5 shadow-glow hover:shadow-lg transition-all"
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
            {cities.map((city) => (
              <CityMinicard key={city._id} city={city} />
            ))}
          </div>
        )}
      </div>
    </aside>
  );
};
