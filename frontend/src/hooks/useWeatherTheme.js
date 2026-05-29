import { useEffect } from 'react';
import { useWeather } from '../context/WeatherContext';

/**
 * Custom React Hook that binds the state indicators (theme and active weather condition)
 * to HTML data attributes. This allows CSS custom variables and gradient tokens
 * to smoothly transition in globals.css.
 */
export const useWeatherTheme = () => {
  const { viewMode, activeWeather } = useWeather();
  
  // Extract weather condition, fallback to 'clear' if loading or unavailable
  const condition = activeWeather?.condition || 'clear';

  useEffect(() => {
    // Append theme attribute ('light' or 'dark') to document body
    document.body.setAttribute('data-theme', viewMode);
    
    // Append weather attribute ('clear', 'cloudy', 'rainy', 'stormy', 'snowy') to document body
    document.body.setAttribute('data-weather', condition);
  }, [viewMode, condition]);

  return {
    theme: viewMode,
    weather: condition,
    activeWeather
  };
};
