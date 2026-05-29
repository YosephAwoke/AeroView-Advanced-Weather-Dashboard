import React, { useEffect, useRef } from 'react';
import { useWeatherTheme } from '../hooks/useWeatherTheme';

/**
 * WeatherAtmosphere - A lightweight, high-performance HTML5 Canvas backdrop.
 * Renders fluid, 60 FPS responsive animations synchronized with the current active city's
 * weather state (clear, cloudy, rainy, stormy, snowy) and the active appearance theme (light, dark).
 */
export const WeatherAtmosphere = () => {
  const canvasRef = useRef(null);
  const { weather, theme } = useWeatherTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationId;
    let particles = [];
    const maxParticles = weather === 'stormy' ? 120 : weather === 'rainy' ? 100 : weather === 'snowy' ? 80 : 25;

    // Lightning parameters for stormy weather
    let lightningFlash = 0;
    let nextLightningTime = Date.now() + 4000 + Math.random() * 6000;

    // Solar flare rotation for clear weather
    let solarAngle = 0;

    // Handle high-DPI scaling
    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
      initParticles(rect.width, rect.height);
    };

    // Initialize particles based on weather type
    const initParticles = (width, height) => {
      particles = [];
      for (let i = 0; i < maxParticles; i++) {
        if (weather === 'rainy' || weather === 'stormy') {
          particles.push({
            x: Math.random() * width,
            y: Math.random() * height - height,
            length: 12 + Math.random() * 15,
            speed: 15 + Math.random() * 12,
            opacity: 0.15 + Math.random() * 0.25,
            weight: 1.5 + Math.random() * 2
          });
        } else if (weather === 'snowy') {
          particles.push({
            x: Math.random() * width,
            y: Math.random() * height - height,
            r: 1.5 + Math.random() * 3.5,
            d: Math.random() * maxParticles,
            speed: 0.8 + Math.random() * 1.5,
            swingSpeed: 0.01 + Math.random() * 0.02,
            swingRange: 15 + Math.random() * 20,
            opacity: 0.25 + Math.random() * 0.35
          });
        } else if (weather === 'cloudy') {
          particles.push({
            x: Math.random() * width,
            y: Math.random() * height,
            r: 80 + Math.random() * 120,
            speed: 0.15 + Math.random() * 0.25,
            opacity: theme === 'dark' ? 0.03 : 0.04
          });
        }
      }
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    // Core 60 FPS animation loop
    const animate = () => {
      const width = canvas.width / (window.devicePixelRatio || 1);
      const height = canvas.height / (window.devicePixelRatio || 1);
      const isDark = theme === 'dark';

      ctx.clearRect(0, 0, width, height);

      // --- 1. RENDER RAIN & STORMY TELEMETRY ---
      if (weather === 'rainy' || weather === 'stormy') {
        if (isDark) {
          ctx.strokeStyle = weather === 'stormy' ? 'rgba(167, 139, 250, 0.45)' : 'rgba(147, 197, 253, 0.4)';
        } else {
          // Light Mode: draw highly visible sky-blue / blue rain lines
          ctx.strokeStyle = weather === 'stormy' ? 'rgba(124, 58, 237, 0.4)' : 'rgba(37, 99, 235, 0.35)';
        }
        
        ctx.lineWidth = 1.3;
        ctx.lineCap = 'round';

        particles.forEach((p) => {
          ctx.beginPath();
          ctx.globalAlpha = p.opacity;
          // Apply slight angle to falling paths
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x - 2, p.y + p.length);
          ctx.stroke();

          // Move
          p.y += p.speed;
          p.x -= 0.5;

          // Recycle
          if (p.y > height) {
            p.y = -p.length;
            p.x = Math.random() * width;
          }
        });

        // Stormy Lightning Strike engine
        if (weather === 'stormy') {
          const now = Date.now();
          if (now > nextLightningTime) {
            // Trigger primary flash
            lightningFlash = 0.95;
            nextLightningTime = now + 5000 + Math.random() * 9000;
          }

          if (lightningFlash > 0) {
            // Draw electric background glow
            if (isDark) {
              ctx.fillStyle = `rgba(139, 92, 246, ${lightningFlash * 0.09})`;
            } else {
              // Light Mode: draw an intense dark stormy sky flash
              ctx.fillStyle = `rgba(30, 27, 75, ${lightningFlash * 0.12})`;
            }
            ctx.fillRect(0, 0, width, height);

            // Decay flash rate with subtle bounce
            lightningFlash -= 0.06;
            
            // Double flash probability
            if (lightningFlash < 0.3 && Math.random() > 0.95) {
              lightningFlash = 0.85; // Mini secondary strike
            }
          }
        }
      }

      // --- 2. RENDER SNOWY TELEMETRY ---
      else if (weather === 'snowy') {
        // Dark Mode: pure white flakes; Light Mode: beautiful ice-blue crystals
        ctx.fillStyle = isDark ? '#ffffff' : 'rgba(14, 165, 233, 0.75)';
        
        particles.forEach((p) => {
          ctx.beginPath();
          ctx.globalAlpha = p.opacity;
          // Soft blur edge for snowy drops
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2, true);
          ctx.fill();

          // Move
          p.y += p.speed;
          p.d += p.swingSpeed;
          // Sway horizontally using high frequency trigonometry
          p.x += Math.sin(p.d) * 0.4;

          // Recycle
          if (p.y > height || p.x > width || p.x < 0) {
            p.y = -10;
            p.x = Math.random() * width;
          }
        });
      }

      // --- 3. RENDER CLOUDY BACKGROUND MISTS ---
      else if (weather === 'cloudy') {
        ctx.fillStyle = isDark 
          ? 'rgba(71, 85, 105, 1)' 
          : 'rgba(100, 116, 139, 1)';

        particles.forEach((p) => {
          ctx.beginPath();
          ctx.globalAlpha = p.opacity;
          
          // Create radial gradient for a soft fluffy fog look
          const gradient = ctx.createRadialGradient(p.x, p.y, p.r * 0.1, p.x, p.y, p.r);
          gradient.addColorStop(0, isDark ? 'rgba(71, 85, 105, 0.45)' : 'rgba(148, 163, 184, 0.12)');
          gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
          
          ctx.fillStyle = gradient;
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fill();

          // Horizontal drift
          p.x += p.speed;
          
          // Recycle
          if (p.x - p.r > width) {
            p.x = -p.r;
            p.y = Math.random() * height;
          }
        });
      }

      // --- 4. RENDER CLEAR SOLAR FLARE CORONA ---
      else if (weather === 'clear') {
        solarAngle += 0.0012; // Extremely slow spin
        
        ctx.beginPath();
        const solarX = width * 0.88;
        const solarY = height * 0.15;
        const baseRadius = 240;
        
        // Solar pulse oscillation
        const pulseRadius = baseRadius + Math.sin(solarAngle * 5) * 12;

        const solarGrad = ctx.createRadialGradient(solarX, solarY, 0, solarX, solarY, pulseRadius);
        if (isDark) {
          // Moody stellar nebulae in Dark Mode
          solarGrad.addColorStop(0, 'rgba(56, 189, 248, 0.16)');
          solarGrad.addColorStop(0.3, 'rgba(99, 102, 241, 0.05)');
          solarGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        } else {
          // Warm solar rays in Light Mode - highly visible golden auras
          solarGrad.addColorStop(0, 'rgba(245, 158, 11, 0.32)');
          solarGrad.addColorStop(0.4, 'rgba(251, 113, 133, 0.08)');
          solarGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        }

        ctx.fillStyle = solarGrad;
        ctx.arc(solarX, solarY, pulseRadius, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalAlpha = 1.0;
      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [weather, theme]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-0 transition-opacity duration-1000"
      style={{ mixBlendMode: theme === 'dark' ? 'screen' : 'normal' }}
    />
  );
};
