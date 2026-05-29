import React, { Suspense, lazy } from 'react';
import { WeatherProvider } from './context/WeatherContext';
import { useWeatherTheme } from './hooks/useWeatherTheme';
import { WeatherAtmosphere } from './components/WeatherAtmosphere';
import { Sidebar } from './components/Sidebar';
import { Activity } from 'lucide-react';

const MainAnalyticsDashboard = lazy(() =>
  import('./components/MainAnalyticsDashboard').then((module) => ({
    default: module.MainAnalyticsDashboard,
  }))
);

// Maps weather condition strings to descriptive localized physics models
const getPhysicsModelLabel = (condition) => {
  switch (condition) {
    case 'clear': return 'Stellar Corona & Ambient Pulse';
    case 'cloudy': return 'Vector Cloud Drift';
    case 'rainy': return 'Angular Parallax Streams';
    case 'snowy': return 'Sinusoidal Glacial Drift';
    case 'stormy': return 'Electro-Vignette & Lightning Strike';
    default: return 'Physics Engine Idle';
  }
};

// Internal component to handle theme activation and structural grid layering
const DashboardContent = () => {
  // Activate Matrix Theme selectors on document body
  const { weather } = useWeatherTheme();

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-start p-5 md:p-8 lg:p-10 overflow-x-hidden select-none">
      
      {/* Dynamic 60 FPS Particle Weather Canvas Backdrop */}
      <WeatherAtmosphere />

      {/* Main Glassmorphic workspace grid (expanded size boundaries) */}
      <div className="w-full max-w-[1550px] min-h-[90vh] flex flex-col lg:flex-row gap-6 lg:gap-8 relative z-10">
        
        {/* Left Sidebar: Controls & City Lists */}
        <Sidebar />

        {/* Right Main Showcase: Advanced charts & deep telemetry */}
        <Suspense
          fallback={
            <div className="flex-1 glass-panel border-white/10 p-8 flex flex-col gap-8 animate-pulse z-10 min-h-[450px]">
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
          }
        >
          <MainAnalyticsDashboard />
        </Suspense>
        
      </div>

      {/* DYNAMIC ATMOSPHERIC PHYSICS HUD BADGE */}
      <div className="fixed bottom-5 right-5 z-40 glass-panel px-4 py-2 border-white/10 text-xs font-bold uppercase tracking-wider shadow-glow bg-black/20 hover:scale-105 hover:bg-black/35 cursor-crosshair transition-all duration-300 flex items-center gap-2 text-textPrimary">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <Activity size={12} className="text-accent animate-pulse" />
        <span className="text-textSecondary">Backdrop Render:</span>
        <span className="text-accent font-extrabold tracking-widest">{getPhysicsModelLabel(weather)} (60 FPS)</span>
      </div>
      
      {/* Dynamic Ambient Blur Backdrop Orbs */}
      <div className="absolute top-[20%] left-[10%] w-[450px] h-[450px] bg-accent/5 rounded-full blur-[160px] pointer-events-none z-0 transition-colors duration-1000" />
      <div className="absolute bottom-[20%] right-[10%] w-[550px] h-[550px] bg-glowColor/5 rounded-full blur-[200px] pointer-events-none z-0 transition-colors duration-1000" />
    </div>
  );
};

function App() {
  return (
    <WeatherProvider>
      <DashboardContent />
    </WeatherProvider>
  );
}

export default App;
