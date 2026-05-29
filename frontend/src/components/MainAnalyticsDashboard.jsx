import React, { useState } from 'react';
import { useWeather } from '../context/WeatherContext';
import { useWeatherTheme } from '../hooks/useWeatherTheme';
import { getWeatherIcon, getConditionLabel } from './CityMinicard';
import { 
  Sun, Wind, Droplets, Gauge, Compass, 
  RefreshCw, Calendar, Clock, Activity 
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, 
  XAxis, YAxis, Tooltip, CartesianGrid 
} from 'recharts';

export const MainAnalyticsDashboard = () => {
  const { activeWeather, isLoading, refreshData } = useWeather();
  const { theme, weather } = useWeatherTheme();
  const [activeTab, setActiveTab] = useState('hourly'); // 'hourly' or 'weekly'
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshData();
    setTimeout(() => setIsRefreshing(false), 800);
  };

  // 1. Loading shimmer skeleton (padded)
  if (isLoading && !activeWeather) {
    return (
      <div className="flex-1 glass-panel border-white/10 p-8 flex flex-col gap-8 animate-pulse z-10">
        <div className="flex items-center justify-between border-b border-white/5 pb-5">
          <div className="space-y-3">
            <div className="h-8 w-64 bg-white/10 rounded-lg" />
            <div className="h-5 w-44 bg-white/10 rounded-lg" />
          </div>
          <div className="h-12 w-12 bg-white/10 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 flex-1 min-h-[350px]">
          <div className="h-full bg-white/5 rounded-3xl" />
          <div className="h-full bg-white/5 rounded-3xl col-span-2" />
        </div>
        <div className="h-[250px] bg-white/5 rounded-3xl" />
      </div>
    );
  }

  // 2. Empty showcase fallback state
  if (!activeWeather) {
    return (
      <div className="flex-1 glass-panel border-white/10 p-10 flex flex-col items-center justify-center text-center gap-6 z-10 min-h-[450px]">
        <div className="p-5 rounded-full bg-accent/10 border border-accent/25 text-accent animate-bounce">
          <Sun size={56} className="animate-spin-slow" />
        </div>
        <h2 className="text-2xl font-black text-textPrimary tracking-wide">Select a City</h2>
        <p className="text-sm text-textSecondary max-w-sm leading-relaxed font-semibold">
          Please select an existing city from the sidebar or click "Track New Location" to add customized coordinates.
        </p>
      </div>
    );
  }

  // Extract metrics
  const { cityName, current, hourly, daily, airQuality, offlineMock } = activeWeather;
  
  // Format localized system time
  const localTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const localDate = new Date().toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });

  // Map wind degrees to text vectors
  const getWindDirectionText = (deg) => {
    if (deg >= 337.5 || deg < 22.5) return 'N';
    if (deg >= 22.5 && deg < 67.5) return 'NE';
    if (deg >= 67.5 && deg < 112.5) return 'E';
    if (deg >= 112.5 && deg < 157.5) return 'SE';
    if (deg >= 157.5 && deg < 202.5) return 'S';
    if (deg >= 202.5 && deg < 247.5) return 'SW';
    if (deg >= 247.5 && deg < 292.5) return 'W';
    return 'NW';
  };

  // Map UV indexes to portfolio descriptors
  const getUvDescriptor = (uv) => {
    if (uv <= 2) return { text: 'Low Protection Required', level: 'Low' };
    if (uv <= 5) return { text: 'Moderate Exposure', level: 'Mod' };
    if (uv <= 7) return { text: 'High Protection Advisable', level: 'High' };
    if (uv <= 10) return { text: 'Very High Exposure Risk', level: 'V. High' };
    return { text: 'Extreme Danger Avoid Sun', level: 'Extreme' };
  };

  // Prepare chart coordinate datasets for Recharts
  const chartData = hourly.time.map((timeStr, idx) => {
    const dateObj = new Date(timeStr);
    const hourFormatted = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return {
      time: hourFormatted,
      temp: Math.round(hourly.temp[idx]),
      humidity: hourly.humidity[idx],
      precip: hourly.precipProb[idx]
    };
  });

  return (
    <main className="flex-1 flex flex-col gap-5 z-10 relative select-none">
      
      {/* SECTION 1: MASTER DATA HEADER */}
      <section className="glass-panel p-5 flex items-center justify-between shadow-glass border-white/10">
        <div>
          <h2 className="text-2xl lg:text-4xl font-black text-textPrimary tracking-wide flex flex-wrap items-center gap-3">
            {cityName}
            <div className="flex gap-1.5">
              <span className="text-[11px] tracking-widest font-extrabold uppercase py-1 px-2.5 rounded-lg bg-badgeBg border border-accent/25 text-accent">
                Live Telemetry
              </span>
              {offlineMock && (
                <span className="text-[11px] tracking-widest font-extrabold uppercase py-1 px-2.5 rounded-lg bg-amber-500/10 border border-amber-500/25 text-amber-500 animate-pulse">
                  Simulated
                </span>
              )}
            </div>
          </h2>
          <div className="flex items-center gap-4 text-textSecondary text-sm font-bold tracking-wide mt-2">
            <span className="flex items-center gap-1.5">
              <Calendar size={15} className="text-textSecondary opacity-90" /> {localDate}
            </span>
            <span className="w-[1.5px] h-4 bg-white/10" />
            <span className="flex items-center gap-1.5">
              <Clock size={15} className="text-textSecondary opacity-90" /> Local: {localTime}
            </span>
          </div>
        </div>

        <button
          onClick={handleRefresh}
          className={`p-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 hover:bg-white/10 text-textSecondary hover:text-textPrimary transition-all duration-300 ${isRefreshing ? 'animate-spin' : ''}`}
          title="Force update cache"
        >
          <RefreshCw size={16} />
        </button>
      </section>

      {/* SECTION 2: THREE-COLUMN ANALYTICAL TELEMETRY GRID */}
      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        
        {/* COLUMN 1: HERO DISPLAY */}
        <article className="glass-panel p-6 flex flex-col justify-between shadow-glass border-white/10 min-h-[250px] bg-gradient-to-br from-white/[0.07] to-white/[0.02]">
          <div className="flex items-start justify-between w-full">
            <div className="space-y-1.5">
              <span className="text-xs uppercase tracking-widest font-black text-textSecondary opacity-80">
                Atmosphere Profile
              </span>
              <h3 className="text-2xl font-extrabold text-textPrimary leading-tight">
                {getConditionLabel(weather)}
              </h3>
            </div>
            <div className="p-3 bg-white/5 border border-white/5 rounded-2xl hover:scale-110 transition-transform duration-300">
              {getWeatherIcon(weather, 38)}
            </div>
          </div>

          <div className="flex items-baseline my-4">
            <span className="text-7xl lg:text-8xl font-black tracking-tighter text-textPrimary leading-none">
              {Math.round(current.temp)}
            </span>
            <span className="text-3xl font-black text-accent leading-none ml-1">
              °C
            </span>
          </div>

          <div className="flex items-center justify-between border-t border-white/5 pt-4 text-sm text-textSecondary font-bold">
            <span>Feels like: <strong className="text-textPrimary">{Math.round(current.feelsLike)}°C</strong></span>
            <div className="flex gap-3">
              <span>H: <strong className="text-textPrimary">{Math.round(daily[0].tempMax)}°C</strong></span>
              <span>L: <strong className="text-textPrimary">{Math.round(daily[0].tempMin)}°C</strong></span>
            </div>
          </div>
        </article>

        {/* COLUMN 2: SECONDARY TELEMETRY WIDGETS */}
        <article className="glass-panel p-5 grid grid-cols-2 gap-4 shadow-glass border-white/10">
          
          {/* UV INDEX */}
          <div className="p-3.5 bg-white/5 border border-white/5 rounded-2xl flex flex-col justify-between">
            <div className="flex items-center justify-between text-textSecondary">
              <span className="text-xs uppercase tracking-wider font-black">UV Exposure</span>
              <Sun size={16} className="text-amber-500" />
            </div>
            <div className="my-2 flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-textPrimary">{current.uvIndex}</span>
              <span className="text-[11px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20 font-extrabold uppercase tracking-wider">
                {getUvDescriptor(current.uvIndex).level}
              </span>
            </div>
            <span className="text-sm text-textSecondary/80 leading-normal line-clamp-1 font-semibold">
              {getUvDescriptor(current.uvIndex).text}
            </span>
          </div>

          {/* WIND DIRECTION / SPEED */}
          <div className="p-3.5 bg-white/5 border border-white/5 rounded-2xl flex flex-col justify-between">
            <div className="flex items-center justify-between text-textSecondary">
              <span className="text-xs uppercase tracking-wider font-black">Wind Velocity</span>
              <Wind size={16} className="text-blue-400" />
            </div>
            <div className="my-2 flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-textPrimary">{Math.round(current.windSpeed)}</span>
              <span className="text-sm font-bold text-textSecondary">km/h</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm text-textSecondary/80 font-semibold">
              <Compass 
                size={14} 
                className="text-textSecondary"
                style={{ transform: `rotate(${current.windDirection}deg)` }} 
              />
              <span>Vector: {getWindDirectionText(current.windDirection)} ({current.windDirection}°)</span>
            </div>
          </div>

          {/* HUMIDITY */}
          <div className="p-3.5 bg-white/5 border border-white/5 rounded-2xl flex flex-col justify-between">
            <div className="flex items-center justify-between text-textSecondary">
              <span className="text-xs uppercase tracking-wider font-black">Relative Humidity</span>
              <Droplets size={16} className="text-sky-400" />
            </div>
            <div className="my-2 flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-textPrimary">{current.humidity}</span>
              <span className="text-sm font-bold text-textSecondary">%</span>
            </div>
            <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-accent h-full transition-all duration-1000" 
                style={{ width: `${current.humidity}%` }} 
              />
            </div>
          </div>

          {/* PRESSURE */}
          <div className="p-3.5 bg-white/5 border border-white/5 rounded-2xl flex flex-col justify-between">
            <div className="flex items-center justify-between text-textSecondary">
              <span className="text-xs uppercase tracking-wider font-black">Baro Pressure</span>
              <Gauge size={16} className="text-purple-400" />
            </div>
            <div className="my-2 flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-textPrimary">{Math.round(current.pressure)}</span>
              <span className="text-sm font-bold text-textSecondary">hPa</span>
            </div>
            <span className="text-sm text-textSecondary/80 leading-normal line-clamp-1 font-semibold">
              {current.pressure > 1013 ? 'High Density Stability' : 'Low Density Cyclonic'}
            </span>
          </div>

        </article>

        {/* COLUMN 3: AIR QUALITY MONITOR (AQI) */}
        <article className="glass-panel p-6 flex flex-col justify-between shadow-glass border-white/10">
          <div>
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <span className="text-xs uppercase tracking-widest font-black text-textSecondary opacity-80">
                Particulate Analytics (AQI)
              </span>
              <Activity size={17} className="text-accent" />
            </div>
            
            <div className="flex items-center gap-4.5 mt-4">
              <span className="text-5xl font-black text-textPrimary tracking-tight">
                {airQuality.aqi}
              </span>
              <div>
                <span 
                  className="text-sm font-extrabold px-3 py-1 rounded-full border block"
                  style={{ 
                    color: airQuality.aqiColor, 
                    borderColor: `${airQuality.aqiColor}40`,
                    background: `${airQuality.aqiColor}15`
                  }}
                >
                  {airQuality.aqiStatus}
                </span>
                <span className="text-[11px] text-textSecondary tracking-wider block mt-1.5 uppercase font-bold">
                  AQI Index Rating
                </span>
              </div>
            </div>
          </div>

          {/* Color progressive bar */}
          <div className="my-4 space-y-1.5">
            <div className="flex justify-between text-[10px] text-textSecondary font-black uppercase tracking-widest opacity-85">
              <span>Good</span>
              <span>Moderate</span>
              <span>Hazardous</span>
            </div>
            <div className="w-full h-2 rounded-full relative bg-gradient-to-r from-emerald-500 via-amber-400 to-rose-600 border border-white/5">
              <div 
                className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-white border-2 border-accent shadow-md transition-all duration-1000"
                style={{ left: `calc(${Math.min(100, (airQuality.aqi / 200) * 100)}% - 7px)` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2 text-center pt-3 border-t border-white/5 text-sm text-textSecondary font-semibold">
            <div className="bg-white/5 p-2 rounded-xl border border-white/5">
              <span className="block text-textPrimary font-extrabold text-base">{Math.round(airQuality.pm2_5)}</span>
              <span>PM2.5</span>
            </div>
            <div className="bg-white/5 p-2 rounded-xl border border-white/5">
              <span className="block text-textPrimary font-extrabold text-base">{Math.round(airQuality.pm10)}</span>
              <span>PM10</span>
            </div>
            <div className="bg-white/5 p-2 rounded-xl border border-white/5">
              <span className="block text-textPrimary font-extrabold text-base">{Math.round(airQuality.no2)}</span>
              <span>NO2</span>
            </div>
            <div className="bg-white/5 p-2 rounded-xl border border-white/5">
              <span className="block text-textPrimary font-extrabold text-base">{Math.round(airQuality.o3)}</span>
              <span>O3</span>
            </div>
          </div>
        </article>

      </section>

      {/* SECTION 3: EXPANDED TAB CONTROLLER & CHARTS MODULE */}
      <section className="glass-panel p-5 flex-1 shadow-glass border-white/10 flex flex-col min-h-[320px]">
        
        {/* Toggle tabs */}
        <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-5">
          <div className="flex gap-2.5">
            <button
              onClick={() => setActiveTab('hourly')}
              className={`text-sm font-extrabold px-4 py-2 rounded-xl border transition-all duration-300 ${activeTab === 'hourly' ? 'bg-accent border-accent text-white shadow-glow' : 'bg-white/5 border-white/5 hover:border-white/10 text-textSecondary hover:text-textPrimary'}`}
            >
              24-Hour Trends
            </button>
            <button
              onClick={() => setActiveTab('weekly')}
              className={`text-sm font-extrabold px-4 py-2 rounded-xl border transition-all duration-300 ${activeTab === 'weekly' ? 'bg-accent border-accent text-white shadow-glow' : 'bg-white/5 border-white/5 hover:border-white/10 text-textSecondary hover:text-textPrimary'}`}
            >
              7-Day Outlook
            </button>
          </div>
          
          <div className="flex items-center gap-2 text-textSecondary text-xs font-black uppercase tracking-wider">
            <Calendar size={13} />
            <span>Telemetry Plots</span>
          </div>
        </div>

        {/* Tab content */}
        <div className="flex-1 min-h-0">
          
          {/* TAB A: HOURLY AREA CHART PLOT (RECHARTS) */}
          {activeTab === 'hourly' ? (
            <div className="w-full h-full min-h-[240px]">
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart 
                  data={chartData} 
                  margin={{ top: 10, right: 10, left: -18, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.45}/>
                      <stop offset="95%" stopColor="var(--accent)" stopOpacity={0.00}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                  <XAxis 
                    dataKey="time" 
                    tick={{ fill: 'var(--text-secondary)', fontSize: 10, fontWeight: 700 }} 
                    tickLine={false} 
                    axisLine={false} 
                  />
                  <YAxis 
                    tick={{ fill: 'var(--text-secondary)', fontSize: 10, fontWeight: 700 }} 
                    tickLine={false} 
                    axisLine={false} 
                    unit="°" 
                  />
                  <Tooltip 
                    contentStyle={{
                      background: 'var(--card-bg)',
                      border: '1px solid var(--card-border)',
                      borderRadius: '0.85rem',
                      color: 'var(--text-primary)',
                      fontSize: '12px',
                      fontFamily: 'Outfit',
                      fontWeight: 700,
                      backdropFilter: 'blur(12px)'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="temp" 
                    name="Temperature"
                    stroke="var(--accent)" 
                    strokeWidth={3} 
                    fillOpacity={1} 
                    fill="url(#chartGradient)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            
            /* TAB B: 7-DAY OUTLOOK GRID (larger week cards) */
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 w-full">
              {daily.map((day, idx) => {
                const dayDate = new Date(day.date);
                const isToday = idx === 0;
                const weekdayFormatted = isToday 
                  ? 'Today' 
                  : dayDate.toLocaleDateString([], { weekday: 'short' });
                const dateNumFormatted = dayDate.toLocaleDateString([], { day: 'numeric' });

                return (
                  <div 
                    key={day.date}
                    className={`p-4 rounded-2xl flex flex-col items-center justify-between border text-center transition-all duration-300 min-h-[160px] ${isToday ? 'bg-accent/15 border-accent/30 scale-[1.01] shadow-md' : 'bg-white/5 border-white/5 hover:border-white/10 hover:bg-white/10'}`}
                  >
                    <div>
                      <span className={`block text-sm font-extrabold tracking-wider ${isToday ? 'text-accent' : 'text-textPrimary'}`}>
                        {weekdayFormatted}
                      </span>
                      <span className="text-xs text-textSecondary font-bold block mt-0.5">
                        {dayDate.toLocaleDateString([], { month: 'short' })} {dateNumFormatted}
                      </span>
                    </div>

                    <div className="my-3 hover:scale-110 transition-transform duration-300">
                      {getWeatherIcon(day.condition, 24)}
                    </div>

                    <div className="space-y-0.5">
                      <div className="flex items-center justify-center gap-1.5 font-black text-sm">
                        <span className="text-textPrimary">{Math.round(day.tempMax)}°</span>
                        <span className="text-textSecondary text-xs">{Math.round(day.tempMin)}°</span>
                      </div>
                      <span className="text-[9px] uppercase tracking-widest font-black text-textSecondary opacity-80 block">
                        {getConditionLabel(day.condition).split(' ')[0]}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

    </main>
  );
};
