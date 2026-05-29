import React from 'react';
import { useWeather } from '../context/WeatherContext';
import { TiltCard } from './TiltCard';
import { Sun, Cloud, CloudRain, CloudLightning, Snowflake, Trash2, MapPin } from 'lucide-react';

// Maps our weather conditions to beautiful Lucide icons
export const getWeatherIcon = (condition, size = 28, className = "") => {
  switch (condition) {
    case 'clear':
      return <Sun size={size} className={`text-amber-500 animate-spin-slow ${className}`} />;
    case 'cloudy':
      return <Cloud size={size} className={`text-slate-400 animate-pulse ${className}`} />;
    case 'rainy':
      return <CloudRain size={size} className={`text-blue-500 animate-bounce ${className}`} />;
    case 'stormy':
      return <CloudLightning size={size} className={`text-purple-500 animate-pulse ${className}`} />;
    case 'snowy':
      return <Snowflake size={size} className={`text-sky-300 animate-spin-slow ${className}`} />;
    default:
      return <Sun size={size} className={`text-amber-500 ${className}`} />;
  }
};

// Maps weather condition strings to descriptive localized display strings
export const getConditionLabel = (condition) => {
  switch (condition) {
    case 'clear': return 'Sunny Skies';
    case 'cloudy': return 'Overcast Skies';
    case 'rainy': return 'Heavy Showers';
    case 'stormy': return 'Severe Thunderstorms';
    case 'snowy': return 'Freezing Snow';
    default: return 'Clear Weather';
  }
};

// Maps weather condition strings to card-specific glass highlighting colors
const getCardConditionStyle = (condition) => {
  switch (condition) {
    case 'clear':
      return 'hover:border-amber-400/40 bg-amber-500/[0.04]';
    case 'cloudy':
      return 'hover:border-slate-400/30 bg-slate-500/[0.04]';
    case 'rainy':
      return 'hover:border-blue-400/40 bg-blue-500/[0.04]';
    case 'stormy':
      return 'hover:border-purple-400/40 bg-purple-500/[0.04]';
    case 'snowy':
      return 'hover:border-sky-300/45 bg-sky-400/[0.04]';
    default:
      return '';
  }
};

export const CityMinicard = ({ city }) => {
  const { activeCityId, setActiveCityId, citiesData, removeTrackedCity } = useWeather();
  
  const weatherData = citiesData[city._id];
  const isActive = activeCityId === city._id;

  if (!weatherData) {
    return (
      <div className="w-full h-[130px] glass-panel border-dashed border-white/20 animate-pulse p-5 flex items-center justify-between">
        <div className="space-y-2.5">
          <div className="h-6 w-36 bg-white/10 rounded" />
          <div className="h-5 w-24 bg-white/10 rounded" />
        </div>
        <div className="h-14 w-14 bg-white/10 rounded-full" />
      </div>
    );
  }

  const { temp } = weatherData.current;
  const condition = weatherData.condition;

  const handleCardClick = () => {
    setActiveCityId(city._id);
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (confirm(`Stop tracking weather telemetry for ${city.name}?`)) {
      await removeTrackedCity(city._id);
    }
  };

  return (
    <div 
      onClick={handleCardClick}
      className={`w-full transition-all duration-300 active:scale-[0.97] ${isActive ? '' : 'hover:scale-[1.01]'}`}
    >
      <TiltCard 
        maxTilt={isActive ? 5 : 10}
        className={`p-5 h-[130px] flex flex-col justify-between transition-all duration-500 ${
          isActive 
            ? 'border-[2.5px] border-accent shadow-glow ring-2 ring-accent/20 bg-gradient-to-br from-accent/10 to-accent/[0.03]' 
            : 'border border-cardBorder/30'
        } ${getCardConditionStyle(condition)}`}
      >
        <div className="flex items-start justify-between w-full">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="font-extrabold text-xl text-textPrimary tracking-wide line-clamp-1">
                {city.name}
              </span>
              {city.isDefault && (
                <span className="text-[10px] uppercase px-2 py-0.5 rounded-full bg-white/10 text-textSecondary border border-white/5 font-bold">
                  Seed
                </span>
              )}
              {isActive && (
                <span className="text-[9px] uppercase px-2 py-0.5 rounded-full bg-accent/15 text-accent border border-accent/25 font-black tracking-widest animate-pulse-slow">
                  Active
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-sm text-textSecondary mt-1 font-semibold">
              <MapPin size={13} className="text-textSecondary opacity-80" />
              <span>{city.country || 'Global'}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2.5">
            <div className="transition-transform duration-300 hover:rotate-12">
              {getWeatherIcon(condition, 30)}
            </div>
            
            {!city.isDefault && (
              <button 
                onClick={handleDelete}
                className="text-textSecondary/40 hover:text-red-500/80 p-2 rounded-lg hover:bg-red-500/10 transition-all duration-200 pointer-events-auto"
                title="Remove city"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-end justify-between mt-auto">
          <span className="text-sm font-bold tracking-wide text-textSecondary/90 bg-white/5 border border-white/5 px-3 py-1 rounded-lg">
            {getConditionLabel(condition)}
          </span>
          <div className="flex items-baseline gap-0.5">
            <span className="text-4xl font-black text-textPrimary leading-none">
              {Math.round(temp)}
            </span>
            <span className="text-base font-black text-accent">
              °C
            </span>
          </div>
        </div>
      </TiltCard>
    </div>
  );
};
